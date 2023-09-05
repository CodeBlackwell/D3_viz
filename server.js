const express = require('express');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

// Sequelize setup
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/etymology.sqlite',
    logging: false
});

const Term = sequelize.define('Term', {
    term_id: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'src')));

// Default route to serve your main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Example route to fetch all terms (just for demonstration)
app.get('/terms', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;

    try {
        const terms = await Term.findAll({
            offset: (page - 1) * pageSize,
            limit: pageSize
        });
        res.json(terms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch terms' });
    }
});

// Fetch Term by ID
app.get('/term/:id', async (req, res) => {
    try {
        const term = await Term.findByPk(req.params.id);
        if (term) {
            res.json(term);
        } else {
            res.status(404).json({ error: 'Term not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch term' });
    }
});

// Search Terms by Name
app.get('/terms/search', async (req, res) => {
    const termName = req.query.name;
    if (!termName) {
        return res.status(400).json({ error: 'Name parameter is required' });
    }

    try {
        const terms = await Term.findAll({
            where: {
                name: {
                    [Op.like]: `%${termName}%`
                }
            }
        });
        res.json(terms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search terms' });
    }
});
// Get Term by ID
app.get('/api/terms/:term_id', async (req, res) => {
    try {
        const term = await Term.findByPk(req.params.term_id);
        if (term) {
            res.json(term);
        } else {
            res.status(404).json({ error: 'Term not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// List All Terms (with Pagination)
app.get('/api/terms', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const terms = await Term.findAll({ offset, limit });
        res.json(terms);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/terms/random', async (req, res) => {
    try {
        const term = await Term.findOne({ order: sequelize.random() });
        if (term) {
            res.json(term);
        } else {
            res.status(404).json({ error: 'No terms available' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Autocomplete Term (assuming there's a 'term' field in the Term model)
app.get('/api/terms/autocomplete', async (req, res) => {
    try {
        const partialTerm = req.query.query;
        const terms = await Term.findAll({
            where: { term: { [Op.like]: `${partialTerm}%` } },
            limit: 10 // Limiting to 10 results for autocomplete
        });
        res.json(terms);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;

// Initialize the database connection before starting the server
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

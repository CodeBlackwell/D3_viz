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
    try {
        const terms = await Term.findAll();
        res.json(terms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch terms' });
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

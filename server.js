const express = require('express');
const path = require('path');

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'src')));

// Default route to serve your main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
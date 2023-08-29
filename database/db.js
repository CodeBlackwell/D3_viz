const { Sequelize } = require('sequelize');
const Etymology = require('./EtymologyModel');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/etymologyDB.sqlite'
});

sequelize.sync().then(() => {
    console.log('Database & tables created!');
});

module.exports = sequelize;

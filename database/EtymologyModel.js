// database/EtymologyModel.js

const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Etymology = sequelize.define('Etymology', {
    term_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lang: DataTypes.STRING,
    term: DataTypes.STRING,
    reltype: DataTypes.STRING,
    related_term_id: DataTypes.STRING,
    related_lang: DataTypes.STRING,
    related_term: DataTypes.STRING,
    position: DataTypes.INTEGER,
    group_tag: DataTypes.STRING,
    parent_tag: DataTypes.STRING,
    parent_position: DataTypes.INTEGER
});

module.exports = Etymology;

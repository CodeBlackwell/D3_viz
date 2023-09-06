const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: process.env.ETYMOLOGY_DB_USER,
    password: process.env.ETYMOLOGY_DB_PASSWORD,
    database: 'postgres' // default database
};

const client = new Client(config);

async function createDatabaseAndTables() {
    try {
        await client.query('CREATE DATABASE etymologydb;');
        console.log('Database etymologydb created successfully.');

        // Switch to the new database
        client.end();
        config.database = 'etymologydb';
        client = new Client(config);
        await client.connect();

        // Create tables
        await client.query(`
            CREATE TABLE Languages (
                lang_id SERIAL PRIMARY KEY,
                lang VARCHAR(255) NOT NULL
            );
            CREATE TABLE GroupTags (
                group_tag_id SERIAL PRIMARY KEY,
                group_tag VARCHAR(255) NOT NULL
            );
            CREATE TABLE ParentTags (
                parent_tag_id SERIAL PRIMARY KEY,
                parent_tag VARCHAR(255) NOT NULL
            );
            CREATE TABLE RelatedTerms (
                related_term_id SERIAL PRIMARY KEY,
                related_term VARCHAR(255) NOT NULL,
                reltype VARCHAR(255),
                related_lang_id INTEGER REFERENCES Languages(lang_id)
            );
            CREATE TABLE Terms (
                term_id SERIAL PRIMARY KEY,
                term VARCHAR(255) NOT NULL,
                position INTEGER,
                lang_id INTEGER REFERENCES Languages(lang_id),
                group_tag_id INTEGER REFERENCES GroupTags(group_tag_id),
                parent_tag_id INTEGER REFERENCES ParentTags(parent_tag_id),
                parent_position INTEGER
            );
        `);
        console.log('Tables created successfully.');
    } catch (err) {
        console.error('Error creating database or tables:', err);
    }
}

async function importCSVtoPostgreSQL(directoryPath) {
    // ... (rest of the import function remains unchanged)
}

// Call the functions
(async () => {
    await client.connect();
    await createDatabaseAndTables();
    await importCSVtoPostgreSQL('path_to_database/chunks/');
    await client.end();
})();

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');
const pgp = require('pg-promise')();

require('dotenv').config();


const connectionString = `postgresql://${process.env.ETYMOLOGY_DB_USER}:${process.env.ETYMOLOGY_DB_PASSWORD}@localhost:5432/postgres`;
let client = new Client({
    connectionString: connectionString
});


async function createDatabaseAndTables() {
    try {
        // Check if the database exists
        const dbExistsResult = await client.query("SELECT 1 FROM pg_database WHERE datname='etymologydb'");
        if (dbExistsResult.rowCount > 0) {
            console.log('Database etymologydb already exists. Deleting...');
            await client.query('DROP DATABASE etymologydb;');
            console.log('Database etymologydb deleted successfully.');
        }

        // Create the database
        await client.query('CREATE DATABASE etymologydb;');
        console.log('Database etymologydb created successfully.');

        // Close the initial connection
        await client.end();

        // Update the connectionString to connect to the newly created etymologydb
        const newConnectionString = `postgresql://${process.env.ETYMOLOGY_DB_USER}:${process.env.ETYMOLOGY_DB_PASSWORD}@localhost:5432/etymologydb`;
        client = new Client({
            connectionString: newConnectionString
        });
        await client.connect();

        await client.query(`
            CREATE TABLE languages (
                lang_id SERIAL PRIMARY KEY,
                lang_name TEXT UNIQUE NOT NULL
            );

            CREATE TABLE reltypes (
                reltype_id SERIAL PRIMARY KEY,
                reltype_name TEXT UNIQUE NOT NULL
            );

            CREATE TABLE group_tags (
                group_tag_id SERIAL PRIMARY KEY,
                group_tag_name TEXT UNIQUE NOT NULL
            );

            CREATE TABLE parent_tags (
                parent_tag_id SERIAL PRIMARY KEY,
                parent_tag_name TEXT UNIQUE NOT NULL
            );

            CREATE TABLE related_terms (
                related_term_id TEXT PRIMARY KEY,
                related_term TEXT,
                reltype_id INTEGER REFERENCES reltypes(reltype_id),
                related_lang_id INTEGER REFERENCES languages(lang_id)
            );
        `);
        console.log('Dimension tables created successfully.');

        // Create the fact table
        await client.query(`
            CREATE TABLE terms (
                term_id TEXT NOT NULL,
                term TEXT,
                lang_id INTEGER REFERENCES languages(lang_id),
                position REAL,
                group_tag_id INTEGER REFERENCES group_tags(group_tag_id),
                parent_tag_id INTEGER REFERENCES parent_tags(parent_tag_id),
                parent_position REAL,
                related_term_entry_id TEXT REFERENCES related_terms(related_term_id)
            );
        `);
        console.log('Fact table created successfully.');

    } catch (err) {
        console.error('Error creating database or tables:', err);
    }
}


// Call the functions
(async () => {
    await client.connect();
    await createDatabaseAndTables();
    await client.end();
})();
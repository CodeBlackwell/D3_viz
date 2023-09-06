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

let mappings = {
    reltypes: {},
    languages: {},
    group_tags: {},
    parent_tags: {}
};

async function cacheMappings() {
    try {
        const reltypes = await client.query('SELECT reltype_id, reltype_name FROM reltypes;');
        reltypes.rows.forEach(row => {
            mappings.reltypes[row.reltype_name] = row.reltype_id;
        });

        const languages = await client.query('SELECT lang_id, lang_name FROM languages;');
        languages.rows.forEach(row => {
            mappings.languages[row.lang_name] = row.lang_id;
        });

        const groupTags = await client.query('SELECT group_tag_id, group_tag_name FROM group_tags;');
        groupTags.rows.forEach(row => {
            mappings.group_tags[row.group_tag_name] = row.group_tag_id;
        });

        const parentTags = await client.query('SELECT parent_tag_id, parent_tag_name FROM parent_tags;');
        parentTags.rows.forEach(row => {
            mappings.parent_tags[row.parent_tag_name] = row.parent_tag_id;
        });

    } catch (err) {
        console.error('Error caching mappings:', err);
    }
}


const csTerms = new pgp.helpers.ColumnSet(['term_id', 'term', 'position', 'lang_id', 'group_tag_id', 'parent_tag_id', 'parent_position', 'related_term_entry_id'], {table: 'terms'});
const csRelatedTerms = new pgp.helpers.ColumnSet(['related_term_id', 'related_term', 'reltype_id', 'related_lang_id'], {table: 'related_terms'});

async function importCSVtoPostgreSQL(directoryPath) {
    try {
        const db = pgp({
            host: 'localhost',
            port: 5432,
            database: 'etymologydb',
            user: process.env.ETYMOLOGY_DB_USER,
            password: process.env.ETYMOLOGY_DB_PASSWORD
        });

        const files = fs.readdirSync(directoryPath);
        let totalFiles = files.length;

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const data = fs.readFileSync(filePath, 'utf8');
            const rows = await csv().fromString(data);

            const termsData = [];
            const relatedTermsData = [];

            for (const row of rows) {
                // Populate related terms data
                relatedTermsData.push({
                    related_term_id: row.related_term_id,
                    related_term: row.related_term,
                    reltype_id: mappings.reltypes[row.reltype],
                    related_lang_id: mappings.languages[row.related_lang]
                });

                // Populate terms data
                termsData.push({
                    term_id: row.term_id,
                    term: row.term,
                    position: row.position,
                    lang_id: mappings.languages[row.lang],
                    group_tag_id: mappings.group_tags[row.group_tag],
                    parent_tag_id: mappings.parent_tags[row.parent_tag],
                    parent_position: row.parent_position,
                    related_term_entry_id: row.related_term_id
                });
            }

            const relatedTermsInsert = pgp.helpers.insert(relatedTermsData, csRelatedTerms) + ' ON CONFLICT DO NOTHING';
            const termsInsert = pgp.helpers.insert(termsData, csTerms) + ' ON CONFLICT DO NOTHING';

            await db.none(relatedTermsInsert);
            await db.none(termsInsert);

            console.log(`CSV file ${file} successfully processed.`);
        }

    } catch (err) {
        console.error('Error importing CSV to PostgreSQL:', err);
    } finally {
        pgp.end();
    }
}

// Call the functions
(async () => {
    await client.connect();
    await createDatabaseAndTables();
    await cacheMappings();
    await importCSVtoPostgreSQL('./chunks');
    await client.end();
})();
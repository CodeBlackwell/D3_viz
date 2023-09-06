const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');
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
        `);
        console.log('Dimension tables created successfully.');

        // Create the fact table
        await client.query(`
            CREATE TABLE terms (
                term_id TEXT NOT NULL,
                term TEXT,
                lang_id INTEGER REFERENCES languages(lang_id),
                reltype_id INTEGER REFERENCES reltypes(reltype_id),
                related_term_id TEXT,
                related_lang_id INTEGER REFERENCES languages(lang_id),
                position REAL,
                group_tag_id INTEGER REFERENCES group_tags(group_tag_id),
                parent_tag_id INTEGER REFERENCES parent_tags(parent_tag_id),
                parent_position REAL
            );
        `);
        console.log('Fact table created successfully.');

    } catch (err) {
        console.error('Error creating database or tables:', err);
    }
}


async function importCSVtoPostgreSQL(directoryPath) {
    try {
        await client.connect();

        fs.readdir(directoryPath, async (err, files) => {
            if (err) throw err;

            let totalFiles = files.length;
            let processedFiles = 0;

            for (const file of files) {
                let rowCount = 0;
                const filePath = path.join(directoryPath, file);
                const readStream = fs.createReadStream(filePath);
                readStream.pipe(csv())
                    .on('data', async (row) => {
                        rowCount++;
                        await client.query('INSERT INTO Languages(lang) VALUES($1) ON CONFLICT (lang) DO NOTHING', [row.lang]);
                        await client.query('INSERT INTO GroupTags(group_tag) VALUES($1) ON CONFLICT (group_tag) DO NOTHING', [row.group_tag]);
                        await client.query('INSERT INTO ParentTags(parent_tag) VALUES($1) ON CONFLICT (parent_tag) DO NOTHING', [row.parent_tag]);
                        await client.query('INSERT INTO RelatedTerms(related_term, reltype, related_lang_id) VALUES($1, $2, (SELECT lang_id FROM Languages WHERE lang = $3)) ON CONFLICT (related_term) DO NOTHING', [row.related_term, row.reltype, row.related_lang]);

                        // Insert data into fact table
                        const query = `
                            INSERT INTO Terms(term_id, term, position, lang_id, group_tag_id, parent_tag_id, parent_position, reltype, related_term_id)
                            VALUES($1, $2, $3, (SELECT lang_id FROM Languages WHERE lang = $4), (SELECT group_tag_id FROM GroupTags WHERE group_tag = $5), (SELECT parent_tag_id FROM ParentTags WHERE parent_tag = $6), $7, $8, (SELECT related_term_id FROM RelatedTerms WHERE related_term = $9))
                            ON CONFLICT (term_id) DO NOTHING;
                        `;
                        const values = [row.term_id, row.term, row.position, row.lang, row.group_tag, row.parent_tag, row.parent_position, row.reltype, row.related_term];
                        await client.query(query, values);
                        if (rowCount % 1000 === 0) {
                            console.log(`Processed ${rowCount} rows from ${file}`);
                        }
                    })
                    .on('end', () => {
                        processedFiles++;
                        console.log(`CSV file ${file} successfully processed. Progress: ${((processedFiles / totalFiles) * 100).toFixed(2)}%`);
                    });
            }
        });
    } catch (err) {
        console.error('Error importing CSV to PostgreSQL:', err);
    } finally {
        await client.end();
    }
}

// Call the functions
(async () => {
    await client.connect();
    await createDatabaseAndTables();
    await importCSVtoPostgreSQL('./chunks');
    await client.end();
})();
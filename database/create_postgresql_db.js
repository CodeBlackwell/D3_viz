const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: process.env.ETYMOLOGY_DB_USER,
    password: process.env.ETYMOLOGY_DB_PASSWORD,
    database: 'etymologydb'
};

const client = new Client(config);

async function createDatabaseAndTables() {
    try {
        await client.query('CREATE DATABASE etymologydb;');
        console.log('Database etymologydb created successfully.');

        // Switch to the new database
        client.end();
        config.database = 'etymologydb';
        let client = new Client(config);
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
    try {
        await client.connect();

        fs.readdir(directoryPath, async (err, files) => {
            if (err) throw err;

            for (const file of files) {
                const filePath = path.join(directoryPath, file);
                const readStream = fs.createReadStream(filePath);
                readStream.pipe(csv())
                    .on('data', async (row) => {
                        // Insert data into dimension tables
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
                    })
                    .on('end', () => {
                        console.log(`CSV file ${file} successfully processed`);
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
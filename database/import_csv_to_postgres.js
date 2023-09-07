const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');
const pgp = require('pg-promise')();

require('dotenv').config();

const connectionString = `postgresql://${process.env.ETYMOLOGY_DB_USER}:${process.env.ETYMOLOGY_DB_PASSWORD}@localhost:5432/etymologydb`;
let client = new Client({
    connectionString: connectionString
});

async function importCSVFiles() {
    try {
        await client.connect();

        // Loop through each CSV file in the chunks directory
        const files = fs.readdirSync(path.join(__dirname, 'chunks'));
        const totalFiles = files.filter(file => path.extname(file) === '.csv').length;

        let processedFiles = 0;

        for (const file of files) {
            if (path.extname(file) === '.csv') {
                console.log(`Processing file: ${file}`);
                const filePath = path.join(__dirname, 'chunks', file);

                // Count the total rows in the current file
                const totalRows = fs.readFileSync(filePath, 'utf-8').split('\n').length - 1; // Subtract 1 for the header row
                let processedRows = 0;

                const readStream = fs.createReadStream(filePath).pipe(csv());

                // Read each row from the CSV file and insert it into the database
                for await (const row of readStream) {
                    // Insert into dimension tables first
                    await client.query('INSERT INTO languages(lang_name) VALUES($1) ON CONFLICT (lang_name) DO NOTHING', [row.lang_name]);
                    await client.query('INSERT INTO reltypes(reltype_name) VALUES($1) ON CONFLICT (reltype_name) DO NOTHING', [row.reltype_name]);
                    await client.query('INSERT INTO group_tags(group_tag_name) VALUES($1) ON CONFLICT (group_tag_name) DO NOTHING', [row.group_tag_name]);
                    await client.query('INSERT INTO parent_tags(parent_tag_name) VALUES($1) ON CONFLICT (parent_tag_name) DO NOTHING', [row.parent_tag_name]);
                    await client.query('INSERT INTO related_terms(related_term_id, related_term, reltype_id, related_lang_id) VALUES($1, $2, $3, $4) ON CONFLICT (related_term_id) DO NOTHING', [row.related_term_id, row.related_term, row.reltype_id, row.related_lang_id]);

                    // Insert into fact table
                    await client.query('INSERT INTO terms(term_id, term, lang_id, position, group_tag_id, parent_tag_id, parent_position, related_term_entry_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8)', [row.term_id, row.term, row.lang_id, row.position, row.group_tag_id, row.parent_tag_id, row.parent_position, row.related_term_entry_id]);
                    processedRows++;

                    // Print progress every 1,000 rows
                    if (processedRows % 1000 === 0) {
                        const rowPercentageComplete = ((processedRows / totalRows) * 100).toFixed(2);
                        console.log(`Progress in ${file}: ${rowPercentageComplete}% (${processedRows} rows processed)`);
                    }
                }
                const filePercentageComplete = ((processedFiles / totalFiles) * 100).toFixed(2);
                console.log(`Completed ${file}. Overall progress: ${filePercentageComplete}%`);
            }
        }

        console.log('CSV files imported successfully.');
    } catch (err) {
        console.error('Error importing CSV files:', err);
    } finally {
        await client.end();
    }
}

// Call the function to start the import
importCSVFiles();
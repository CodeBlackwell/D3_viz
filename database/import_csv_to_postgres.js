const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { pgp } = require('./config');



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

const db = pgp({
    host: 'localhost',
    port: 5432,
    database: 'etymologydb',
    user: process.env.ETYMOLOGY_DB_USER,
    password: process.env.ETYMOLOGY_DB_PASSWORD
});
const BATCH_SIZE = 50; // Number of files to process concurrently. Adjust as needed.


async function processCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const batches = [];
        let batch = [];
        let rowCount = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                batch.push(row);
                if (batch.length === BATCH_SIZE) {
                    batches.push(insertBatch(batch));
                    batch = [];
                }
                rowCount++;
            })
            .on('end', async () => {
                if (batch.length) {
                    batches.push(insertBatch(batch));
                }
                await Promise.all(batches);
                resolve(rowCount);
            })
            .on('error', reject);
    });
}

async function importCSVtoPostgreSQL() {
    await cacheMappings();

    const csvDir = path.join(__dirname, 'chunks');
    const csvFiles = fs.readdirSync(csvDir);
    let totalRows = 0;

    for (let i = 0; i < csvFiles.length; i += BATCH_SIZE) {
        const fileBatch = csvFiles.slice(i, i + BATCH_SIZE);
        const promises = fileBatch.map((file) => processCSVFile(path.join(csvDir, file)));

        const results = await Promise.all(promises);
        totalRows += results.reduce((acc, val) => acc + val, 0);

        console.log(`Processed files ${i + 1} to ${i + fileBatch.length} of ${csvFiles.length}. Total rows added: ${totalRows}`);
    }

    console.log('Data import completed.');
}

importCSVtoPostgreSQL().catch((error) => {
    console.error('Error importing CSV to PostgreSQL:', error);
});
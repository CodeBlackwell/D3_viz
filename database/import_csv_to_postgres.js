import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pgp from 'pg-promise';

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
const BATCH_SIZE = 5; // Number of files to process concurrently. Adjust as needed.


async function importCSVtoPostgreSQL(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);
        let totalRowsAdded = 0; // Counter for total rows added

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batchFiles = files.slice(i, i + BATCH_SIZE);
            await Promise.all(batchFiles.map(async (file, index) => {
                const filePath = path.join(directoryPath, file);
                const data = fs.readFileSync(filePath, 'utf8');
                const rows = await csv().fromString(data);

                const termsData = [];
                const relatedTermsData = [];

                for (let j = 0; j < rows.length; j++) {
                    const row = rows[j];
                    relatedTermsData.push({
                        related_term_id: row.related_term_id,
                        related_term: row.related_term,
                        reltype_id: mappings.reltypes[row.reltype],
                        related_lang_id: mappings.languages[row.related_lang]
                    });

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

                    // Print progress for the current chunk
                    if (j % 1000 === 0 || j === rows.length - 1) { // Adjust the 1000 value if you want more frequent updates
                        const percentageDone = ((j + 1) / rows.length) * 100;
                        console.log(`Processing file ${file} (${index + 1}/${batchFiles.length}): ${percentageDone.toFixed(2)}% done.`);
                    }
                }

                const relatedTermsInsert = pgp.helpers.insert(relatedTermsData, csRelatedTerms) + ' ON CONFLICT DO NOTHING';
                const termsInsert = pgp.helpers.insert(termsData, csTerms) + ' ON CONFLICT DO NOTHING';

                await db.tx(async t => {
                    await t.none(relatedTermsInsert);
                    await t.none(termsInsert);
                });

                totalRowsAdded += rows.length;
                console.log(`CSV file ${file} successfully processed. Total rows added so far: ${totalRowsAdded}.`);
            }));
        }

    } catch (err) {
        console.error('Error importing CSV to PostgreSQL:', err);
    } finally {
        pgp.end();
    }
}


// Call the functions
(async () => {
    const directoryPath = path.join(__dirname, 'chunks');
    await cacheMappings();
    await importCSVtoPostgreSQL(directoryPath);
})();
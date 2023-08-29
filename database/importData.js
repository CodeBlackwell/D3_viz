const fs = require('fs');
const csv = require('csv-parser');
const Etymology = require('./EtymologyModel');
console.log(`Current directory: ${process.cwd()}`);

fs.createReadStream('/home/kali/Desktop/DataVizProjects/D3_viz/database/etymology.csv')
    .pipe(csv())
    .on('data', async (row) => {
        await Etymology.create({
            term_id: row.term_id,
            lang: row.lang,
            term: row.term,
            reltype: row.reltype,
            related_term_id: row.related_term_id,
            related_lang: row.related_lang,
            related_term: row.related_term,
            position: row.position,
            group_tag: row.group_tag,
            parent_tag: row.parent_tag,
            parent_position: row.parent_position
        });
    })
    .on('end', () => {
        console.log('CSV file successfully processed');
    });

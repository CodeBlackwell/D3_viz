const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

console.log('Initializing SQLite database...');
const db = new sqlite3.Database('./database/etymology.db', (err) => {
    if (err) {
        console.error('Error initializing SQLite database:', err);
        return;
    }
    console.log('SQLite database initialized.');
});

console.log('Creating table if it doesn\'t exist...');
db.run(`CREATE TABLE IF NOT EXISTS terms (
    term_id TEXT,
    lang TEXT,
    term TEXT,
    reltype TEXT,
    related_term_id TEXT,
    related_lang TEXT,
    related_term TEXT,
    position INTEGER,
    group_tag TEXT,
    parent_tag TEXT,
    parent_position INTEGER
)`, (err) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Table created or already exists.');
});

const importCSV = (filePath) => {
    let rowCount = 0;
    fs.createReadStream(filePath)
        .pipe(csv({ separator: '\t' }))
        .on('data', (row) => {
            rowCount++;
            db.run(`INSERT INTO terms (
        term_id,
        lang,
        term,
        reltype,
        related_term_id,
        related_lang,
        related_term,
        position,
        group_tag,
        parent_tag,
        parent_position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    row.term_id,
                    row.lang,
                    row.term,
                    row.reltype,
                    row.related_term_id,
                    row.related_lang,
                    row.related_term,
                    row.position,
                    row.group_tag,
                    row.parent_tag,
                    row.parent_position
                ]);
        })
        .on('end', () => {
            console.log(`Finished importing ${filePath}. Total rows added: ${rowCount}`);
        });
};

console.log('Reading /database/chunks/ directory...');
fs.readdir(path.join(__dirname, 'database', 'chunks'), (err, files) => {
    if (err) {
        console.error('Could not read the directory:', err);
        return;
    }

    console.log(`Found ${files.length} files in /database/chunks/ directory.`);
    files.forEach((file) => {
        if (path.extname(file) === '.csv') {
            importCSV(path.join(__dirname, 'chunks', file));
        }
    });
});

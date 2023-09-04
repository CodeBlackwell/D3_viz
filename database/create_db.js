const fs = require('fs');
const path = require('path');
const readline = require('readline');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const { performance } = require('perf_hooks');

let totalRows = 0;
const startTime = performance.now();

const db = new sqlite3.Database('./database/etymology.db', (err) => {
    if (err) {
        console.error('Error initializing SQLite database:', err);
        return;
    }
});

db.serialize(() => {
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
        }
    });

    const countLines = async (filePath) => {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        let lineCount = 0;
        for await (const line of rl) {
            lineCount++;
        }
        return lineCount - 1; // Exclude header
    };

    const importCSV = async (filePath) => {
        const totalLines = await countLines(filePath);
        let rowCount = 0;

        return new Promise((resolve) => {
            fs.createReadStream(filePath)
                .pipe(csv({ separator: '\t' }))
                .on('data', (row) => {
                    rowCount++;
                    totalRows++;

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

                    if (rowCount % 100 === 0) {
                        const currentTime = performance.now();
                        const runtime = ((currentTime - startTime) / 1000).toFixed(2);
                        const percentageComplete = ((rowCount / totalLines) * 100).toFixed(2);
                        console.log(`Inserted ${rowCount} rows from ${filePath} (${percentageComplete}% complete). Total rows: ${totalRows}. Runtime: ${runtime} seconds.`);
                    }
                })
                .on('end', () => {
                    console.log(`Finished importing ${filePath}. Total rows added: ${rowCount}`);
                    resolve();
                });
        });
    };

    fs.readdir(path.join(__dirname, 'chunks'), async (err, files) => {
        if (err) {
            console.error('Could not read the directory:', err);
            return;
        }

        for (const file of files) {
            if (path.extname(file) === '.csv') {
                await importCSV(path.join(__dirname, 'chunks', file));
            }
        }
    });
});

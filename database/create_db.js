const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const csv = require('fast-csv');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/etymology.sqlite',
    logging: false
});

const Term = sequelize.define('Term', {
    term_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    }
});

const CHUNKS_DIR = path.join(__dirname, 'chunks');
let currentFileIndex = 0;
let currentRowIndex = 0;

function processFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv.parse({ headers: true, delimiter: '\t' }))
            .on('data', (row) => {
                if (row.term_id) {
                    Term.create(row)
                        .then(() => {
                            currentRowIndex++;
                            if (currentRowIndex % 100 === 0) {
                                console.log(`Processed ${currentRowIndex} rows from ${filePath}`);
                            }
                        })
                        .catch(error => {
                            console.error(`Error processing row ${currentRowIndex} from ${filePath}:`, error);
                        });
                }
            })
            .on('error', (error) => {
                console.error(`Error parsing CSV from ${filePath}:`, error);
            })
            .on('end', () => {
                resolve();
            });
    });
}

async function main() {
    await sequelize.sync({ force: true });
    const files = fs.readdirSync(CHUNKS_DIR);
    for (const file of files) {
        const filePath = path.join(CHUNKS_DIR, file);
        await processFile(filePath);
        currentFileIndex++;
        console.log(`Processed file ${currentFileIndex} of ${files.length}`);
    }
    console.log('All files processed.');
    await sequelize.close();
}

main();

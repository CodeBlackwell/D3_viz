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
    }
});

const CHUNKS_DIR = path.join(__dirname, 'chunks');
let currentFileIndex = 0;
let currentRowIndex = 0;


async function processFile(filePath) {
    const rowsToInsert = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath, { encoding: 'utf8' })
            .pipe(csv.parse({ headers: true, delimiter: ',' }))
            .on('data', (row) => {
                if (row.term_id) {
                    rowsToInsert.push(row);
                }
            })
            .on('error', reject)
            .on('end', async () => {
                try {
                    await Term.bulkCreate(rowsToInsert);
                    console.log(`Processed ${rowsToInsert.length} rows from ${filePath}`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
    });
}

async function main() {
    await sequelize.sync({ force: true });
    const files = fs.readdirSync(CHUNKS_DIR);
    const filePromises = files.map(file => {
        const filePath = path.join(CHUNKS_DIR, file);
        return processFile(filePath);
    });
    await Promise.all(filePromises);
    console.log('All files processed.');
    await sequelize.close();
}

main();


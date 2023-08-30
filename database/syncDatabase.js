// syncDatabase.js
const { EtymologyModel } = require('./EtymologyModel');  // Adjust the path as needed

async function syncDatabase() {
    try {
        await EtymologyModel.sync({ force: true });
        console.log("Database synced!");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

syncDatabase();

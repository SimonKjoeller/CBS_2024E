const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path'); // Importer path-modulet

const db = new sqlite3.Database('db/sqlite.db');

// Funktion til at køre SQL script
const runSQLScript = (filename) => {
    // Brug absolut sti til at finde scriptfilen
    const scriptPath = path.join(__dirname, 'scripts', filename); // Absolut sti til scriptfil
    const script = fs.readFileSync(scriptPath, 'utf8');

    db.exec(script, (err) => {
        if (err) {
            console.log("Fejl ved eksekvering af script: ", err);
        } else {
            console.log(`SQL script ${filename} kørt succesfuldt`);
        }
    });
};

db.serialize(() => {
    // Kald runSQLScript med de korrekte filnavne
    runSQLScript('schema.sql');
    runSQLScript('dump.sql');
});

module.exports = db;

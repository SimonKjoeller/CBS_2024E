const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('db/sqlite.db');

const runSQLScript = (filename) => {
    const script = fs.readFileSync(filename, 'utf8');
    db.exec(script, (err) => {
        if (err) {
            console.log("erroer exec script: ", err);
        } else {
            console.log(`SQL script ${filename} run successfully`);
        }
    });
};

db.serialize(() => {
    runSQLScript('./scripts/schema.sql');
    runSQLScript('./scripts/dump.sql');
});

module.exports = db;
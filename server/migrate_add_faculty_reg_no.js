import sqlite3 from 'sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'college.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.run("ALTER TABLE faculty ADD COLUMN registration_no TEXT UNIQUE", (err) => {
        if (err) {
            console.error("Error adding column (it might already exist):", err.message);
        } else {
            console.log("Successfully added 'registration_no' column to 'faculty' table.");
        }
    });
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Close the database connection.');
});

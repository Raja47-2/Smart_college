import sqlite3 from 'sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'college.db');
const logPath = resolve(__dirname, '../migration_retry.log');

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logPath, msg + '\n');
};

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        log('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    } else {
        log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Check if column exists first
    db.all("PRAGMA table_info(faculty)", (err, rows) => {
        if (err) {
            log("Error reading schema: " + err.message);
            return;
        }

        const hasColumn = rows.some(r => r.name === 'registration_no');
        if (hasColumn) {
            log("Column 'registration_no' already exists.");
        } else {
            log("Adding 'registration_no' column...");
            db.run("ALTER TABLE faculty ADD COLUMN registration_no TEXT UNIQUE", (err) => {
                if (err) {
                    log("Error adding column: " + err.message);
                } else {
                    log("Successfully added 'registration_no' column to 'faculty' table.");
                }
            });
        }
    });
});

db.close((err) => {
    if (err) {
        log(err.message);
    }
    log('Close the database connection.');
});

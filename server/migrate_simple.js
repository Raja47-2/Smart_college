import sqlite3 from 'sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'college.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to database.');
});

db.serialize(() => {
    db.run("ALTER TABLE faculty ADD COLUMN registration_no TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'registration_no' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Successfully added 'registration_no' column.");
        }
    });

    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_faculty_reg_no ON faculty(registration_no)", (err) => {
        if (err) {
            console.error("Error creating index:", err.message);
        } else {
            console.log("Successfully created unique index.");
        }
    });
});

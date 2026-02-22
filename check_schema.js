import sqlite3 from 'sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'server/college.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
});

db.all("PRAGMA table_info(faculty)", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Faculty columns:", rows);
    }
    db.close();
});

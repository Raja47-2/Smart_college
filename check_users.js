import sqlite3 from 'sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'server/college.db');

const db = new sqlite3.verbose().Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.all("SELECT id, name, email, password, role FROM users", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Users found:", rows.length);
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Role: ${row.role}, PasswordHash: ${row.password.substring(0, 10)}...`);
        });
    }
    db.close();
});

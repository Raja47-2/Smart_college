// Migration: Add extra fields to students table
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite3.Database(resolve(__dirname, 'college_v2.db'));

const newCols = [
    'photo_url TEXT',
    'address TEXT',
    'dob TEXT',
    'blood_group TEXT',
    'father_name TEXT',
    'mother_name TEXT',
    'mobile TEXT',
    'gender TEXT',
];

db.serialize(() => {
    newCols.forEach(col => {
        const colName = col.split(' ')[0];
        db.run(`ALTER TABLE students ADD COLUMN ${col}`, err => {
            if (err && err.message.includes('duplicate')) {
                console.log(`  [skip] ${colName} already exists`);
            } else if (err) {
                console.log(`  [error] ${colName}: ${err.message}`);
            } else {
                console.log(`  [ok] Added ${colName}`);
            }
        });
    });
    setTimeout(() => { db.close(); console.log('Done.'); }, 500);
});

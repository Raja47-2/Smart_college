// Migration: Add parent_mobile to students table + create sms_logs table
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite3.Database(resolve(__dirname, 'college_v2.db'));

db.serialize(() => {
    // Add parent_mobile column to students
    db.run(`ALTER TABLE students ADD COLUMN parent_mobile TEXT`, err => {
        if (err && err.message.includes('duplicate')) console.log('[skip] parent_mobile already exists');
        else if (err) console.log('[error]', err.message);
        else console.log('[ok] Added parent_mobile to students');
    });

    // Create sms_logs table
    db.run(`CREATE TABLE IF NOT EXISTS sms_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        student_name TEXT,
        parent_mobile TEXT,
        attendance_pct REAL,
        month TEXT,
        message TEXT,
        status TEXT,
        sent_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )`, err => {
        if (err) console.log('[error creating sms_logs]', err.message);
        else console.log('[ok] sms_logs table ready');
    });

    setTimeout(() => { db.close(); console.log('Done.'); }, 500);
});

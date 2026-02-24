// Migration: Create feedback table
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite3.Database(resolve(__dirname, 'college_v2.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        rating INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        admin_reply TEXT,
        is_anonymous INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime'))
    )`, err => {
        if (err) console.log('[error]', err.message);
        else console.log('[ok] feedback table ready');
    });
    setTimeout(() => { db.close(); console.log('Done.'); }, 500);
});

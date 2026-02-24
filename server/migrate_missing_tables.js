import db from './database.js';

db.serialize(() => {
    // Online Classes Table
    db.run(`CREATE TABLE IF NOT EXISTS online_classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        stream TEXT NOT NULL,
        departments TEXT NOT NULL, -- JSON string
        years TEXT NOT NULL,       -- JSON string
        class_type TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        meet_link TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(teacher_id) REFERENCES users(id)
    )`);

    // Teacher Permissions Table
    db.run(`CREATE TABLE IF NOT EXISTS teacher_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL UNIQUE,
        permissions TEXT NOT NULL, -- JSON string of permissions
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(teacher_id) REFERENCES users(id)
    )`);

    console.log('Missing tables created successfully.');
});

import db from './database.js';

const createAiDoubtsTable = () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS ai_doubts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            response TEXT NOT NULL,
            user_type TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `;

    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating ai_doubts table:', err.message);
        } else {
            console.log('✓ ai_doubts table created or already exists');
        }
        db.close();
    });
};

console.log('Creating AI Doubts table...');
createAiDoubtsTable();

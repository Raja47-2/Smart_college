import db from './database.js';

const migrateAiDoubts = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS ai_doubts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      category TEXT,
      response TEXT,
      user_type TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
            if (err) {
                console.error('Error creating ai_doubts table:', err.message);
            } else {
                console.log('ai_doubts table created/verified successfully.');
            }
            process.exit();
        });
    });
};

migrateAiDoubts();

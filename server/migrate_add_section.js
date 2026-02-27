import db from './database.js';

db.serialize(() => {
    db.run("ALTER TABLE students ADD COLUMN section TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column 'section' already exists.");
            } else {
                console.error("Error adding 'section' column:", err.message);
            }
        } else {
            console.log("Column 'section' added successfully to students table.");
        }
    });
});

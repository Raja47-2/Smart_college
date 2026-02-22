// Migrate alumni table to add photo_url column
import db from './database.js';

db.run("ALTER TABLE alumni ADD COLUMN photo_url TEXT", (err) => {
    if (err) {
        if (err.message.includes('duplicate column')) {
            console.log('photo_url column already exists.');
        } else {
            console.error('Migration error:', err.message);
        }
    } else {
        console.log('photo_url column added to alumni table successfully.');
    }
    db.close();
});

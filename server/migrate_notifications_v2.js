import db from './database.js';

console.log('Starting migration: adding targeting columns to notifications table...');

db.serialize(() => {
    // Add target_role column
    db.run("ALTER TABLE notifications ADD COLUMN target_role TEXT DEFAULT 'all'", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('target_role column already exists.');
            } else {
                console.error('Error adding target_role:', err.message);
            }
        } else {
            console.log('Added target_role column.');
        }
    });

    // Add target_dept column
    db.run("ALTER TABLE notifications ADD COLUMN target_dept TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('target_dept column already exists.');
            } else {
                console.error('Error adding target_dept:', err.message);
            }
        } else {
            console.log('Added target_dept column.');
        }
    });

    // Add target_year column
    db.run("ALTER TABLE notifications ADD COLUMN target_year TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('target_year column already exists.');
            } else {
                console.error('Error adding target_year:', err.message);
            }
        } else {
            console.log('Added target_year column.');
        }
    });

    // Add target_course column
    db.run("ALTER TABLE notifications ADD COLUMN target_course TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('target_course column already exists.');
            } else {
                console.error('Error adding target_course:', err.message);
            }
        } else {
            console.log('Added target_course column.');
        }
    });
});

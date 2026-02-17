import sqlite3 from 'sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'server/college.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

async function resetPasswords() {
    console.log("Resetting passwords to defaults...");

    const adminHash = await bcrypt.hash('admin123', 10);
    const teacherHash = await bcrypt.hash('teacher123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    db.serialize(() => {
        db.run("UPDATE users SET password = ? WHERE email = 'admin@college.edu'", [adminHash], (err) => {
            if (err) console.error("Admin update failed:", err);
            else console.log("Admin password reset to 'admin123'");
        });

        db.run("UPDATE users SET password = ? WHERE email = 'teacher@college.edu'", [teacherHash], (err) => {
            if (err) console.error("Teacher update failed:", err);
            else console.log("Teacher password reset to 'teacher123'");
        });

        db.run("UPDATE users SET password = ? WHERE email = 'student@college.edu'", [studentHash], (err) => {
            if (err) console.error("Student update failed:", err);
            else console.log("Student password reset to 'student123'");
        });
    });

    // Check if roles are correct
    db.all("SELECT email, role FROM users", (err, rows) => {
        rows.forEach(r => console.log(`User: ${r.email}, Role: ${r.role}`));
    });
}

resetPasswords();

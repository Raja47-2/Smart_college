import db from './server/database.js';
import bcrypt from 'bcryptjs';

db.serialize(async () => {
    console.log("Dropping and recreating users table...");
    db.run("DROP TABLE IF EXISTS users");

    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student', 'principal')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    const adminPassword = await bcrypt.hash('admin123', 10);
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);
    const principalPassword = await bcrypt.hash('principal123', 10);

    const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    stmt.run('Admin User', 'admin@college.edu', adminPassword, 'admin');
    stmt.run('Principal User', 'principal@college.edu', principalPassword, 'principal');
    stmt.run('Teacher One', 'teacher@college.edu', teacherPassword, 'teacher');
    stmt.run('Student One', 'student@college.edu', studentPassword, 'student');
    stmt.finalize();

    console.log("Database reset and seeded with Principal.");
});

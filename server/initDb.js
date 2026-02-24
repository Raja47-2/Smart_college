import { createRequire } from 'module';
import db from './database.js';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const createTables = () => {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student', 'principal')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Students Table
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      registration_no TEXT UNIQUE,
      type TEXT,
      course TEXT,
      department TEXT,
      year TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Faculty Table
    db.run(`CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT,
      designation TEXT,
      registration_no TEXT UNIQUE,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Attendance Table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id)
    )`);

    // Fees Table
    db.run(`CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id)
    )`);

    // Assignments Table
    db.run(`CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      teacher_id INTEGER,
      due_date TEXT,
      course TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    )`);

    // Submissions Table
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      file_url TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assignment_id) REFERENCES assignments(id),
      FOREIGN KEY(student_id) REFERENCES students(id)
    )`);

    // Notifications Table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // College Info Table (key-value)
    db.run(`CREATE TABLE IF NOT EXISTS college_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    )`);

    // Alumni Table
    db.run(`CREATE TABLE IF NOT EXISTS alumni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      batch_year TEXT,
      course TEXT,
      department TEXT,
      job_title TEXT,
      company TEXT,
      contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Staff Contacts Table
    db.run(`CREATE TABLE IF NOT EXISTS staff_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT,
      designation TEXT,
      phone TEXT,
      email TEXT
    )`);

    // Timetables Table
    db.run(`CREATE TABLE IF NOT EXISTS timetables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stream TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      subject TEXT NOT NULL,
      faculty_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Tables created.');
    seedData();
  });
};

const seedData = async () => {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);
  const principalPassword = await bcrypt.hash('principal123', 10);

  db.get("SELECT count(*) as count FROM users", [], (err, row) => {
    if (err) return console.error(err.message);
    if (row.count === 0) {
      console.log('Seeding data...');

      const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
      stmt.run('Admin User', 'admin@college.edu', adminPassword, 'admin');
      stmt.run('Principal User', 'principal@college.edu', principalPassword, 'principal');
      stmt.run('Teacher One', 'teacher@college.edu', teacherPassword, 'teacher');
      stmt.run('Student One', 'student@college.edu', studentPassword, 'student');
      stmt.finalize();

      setTimeout(() => {
        // Helper to get user ID by email
        db.get("SELECT id FROM users WHERE email='student@college.edu'", (err, studentUser) => {
          if (studentUser) {
            db.run("INSERT INTO students (user_id, name, email, course, department, year, registration_no, type) VALUES (?, 'Student One', 'student@college.edu', 'Engineering', 'Computer Science', '2nd Year', 'REG-2024-001', 'Hosteler')", [studentUser.id]);
          }
        });
        db.get("SELECT id FROM users WHERE email='teacher@college.edu'", (err, teacherUser) => {
          if (teacherUser) {
            db.run("INSERT INTO faculty (user_id, name, email, department, designation) VALUES (?, 'Teacher One', 'teacher@college.edu', 'Computer Science', 'Professor')", [teacherUser.id]);
          }
        });
        console.log('Seed data inserted.');
      }, 1000);

    } else {
      console.log('Database already has data.');
    }
  });
};

createTables();

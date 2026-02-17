const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = require('./database');

const createTables = () => {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Students Table
        db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      course TEXT,
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

        console.log('Tables created.');
        seedData();
    });
};

const seedData = async () => {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    db.get("SELECT count(*) as count FROM users", [], (err, row) => {
        if (err) return console.error(err.message);
        if (row.count === 0) {
            console.log('Seeding data...');

            const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
            stmt.run('Admin User', 'admin@college.edu', adminPassword, 'admin');
            stmt.run('Teacher One', 'teacher@college.edu', teacherPassword, 'teacher');
            stmt.run('Student One', 'student@college.edu', studentPassword, 'student');
            stmt.finalize();

            // Seed Student Profile
            db.run("INSERT INTO students (user_id, name, email, course, year) VALUES ((SELECT id FROM users WHERE email='student@college.edu'), 'Student One', 'student@college.edu', 'Computer Science', '2nd Year')");

            // Seed Faculty Profile
            db.run("INSERT INTO faculty (user_id, name, email, department, designation) VALUES ((SELECT id FROM users WHERE email='teacher@college.edu'), 'Teacher One', 'teacher@college.edu', 'Computer Science', 'Professor')");

            console.log('Seed data inserted.');
        } else {
            console.log('Database already has data.');
        }
    });
};

createTables();

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createReadStream } from 'fs';
import multer from 'multer';
import db from './database.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Config
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';
const PORT = process.env.PORT || 3000;

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, resolve(__dirname, 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(resolve(__dirname, 'uploads')));


// Middleware to verify Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
    const { email, password, identifier } = req.body;
    const loginId = identifier || email; // Support both fields

    // Try to find user by Email first (common case)
    db.get("SELECT * FROM users WHERE email = ?", [loginId], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        if (user) {
            // User found by Email
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '30d' });
            res.json({ token, role: user.role, name: user.name });
        } else {
            // User not found by Email, check if it's a Registration No
            // 1. Check Students first
            db.get("SELECT user_id FROM students WHERE registration_no = ?", [loginId], (err, student) => {
                if (err) return res.status(500).json({ error: err.message });

                if (student) {
                    // Found Student — get linked user
                    db.get("SELECT * FROM users WHERE id = ?", [student.user_id], async (err, linkedUser) => {
                        if (err) return res.status(500).json({ error: err.message });
                        if (!linkedUser) return res.status(400).json({ error: 'User record not found' });

                        const validPassword = await bcrypt.compare(password, linkedUser.password);
                        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

                        const token = jwt.sign({ id: linkedUser.id, email: linkedUser.email, role: linkedUser.role }, SECRET_KEY, { expiresIn: '30d' });
                        res.json({ token, role: linkedUser.role, name: linkedUser.name });
                    });
                } else {
                    // 2. Check Faculty
                    db.get("SELECT user_id FROM faculty WHERE registration_no = ?", [loginId], (err, faculty) => {
                        if (err) return res.status(500).json({ error: err.message });

                        if (faculty) {
                            // Found Faculty
                            db.get("SELECT * FROM users WHERE id = ?", [faculty.user_id], async (err, linkedUser) => {
                                if (err) return res.status(500).json({ error: err.message });
                                if (!linkedUser) return res.status(400).json({ error: 'User record not found' });

                                const validPassword = await bcrypt.compare(password, linkedUser.password);
                                if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

                                const token = jwt.sign({ id: linkedUser.id, email: linkedUser.email, role: linkedUser.role }, SECRET_KEY, { expiresIn: '30d' });
                                res.json({ token, role: linkedUser.role, name: linkedUser.name });
                            });
                        } else {
                            return res.status(400).json({ error: 'User not found' });
                        }
                    });
                }
            });
        }
    });
});

// --- STUDENTS ROUTES ---
app.get('/api/students', authenticateToken, (req, res) => {
    if (req.user.role === 'student') {
        db.all("SELECT * FROM students WHERE user_id = ? OR email = ?", [req.user.id, req.user.email], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        db.all("SELECT * FROM students", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

app.post('/api/students', authenticateToken, (req, res) => {
    let { name, email, course, department, year, registration_no, type, password } = req.body;

    if (!password) {
        password = '123456';
    }

    // Check if user exists
    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'User with this email already exists' });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create User
            const userStmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')");
            userStmt.run(name, email, hashedPassword, function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const userId = this.lastID;

                // Create Student Profile
                const stmt = db.prepare("INSERT INTO students (user_id, name, email, course, department, year, registration_no, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                stmt.run(userId, name, email, course, department, year, registration_no, type, function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID, user_id: userId, name, email, course, department, year, registration_no, type });
                });
            });
        } catch (e) {
            res.status(500).json({ error: 'Error creating user' });
        }
    });
});

app.put('/api/students/:id', authenticateToken, (req, res) => {
    const { name, email, course, department, year, registration_no, type } = req.body;
    const stmt = db.prepare("UPDATE students SET name = ?, email = ?, course = ?, department = ?, year = ?, registration_no = ?, type = ? WHERE id = ?");
    stmt.run(name, email, course, department, year, registration_no, type, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
    // Get user_id before deleting so we can clean up the users table
    db.get("SELECT user_id FROM students WHERE id = ?", [req.params.id], (err, student) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        db.run("DELETE FROM students WHERE id = ?", req.params.id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            // Also delete the associated user record
            if (student.user_id) {
                db.run("DELETE FROM users WHERE id = ?", student.user_id);
            }
            res.json({ message: 'Deleted' });
        });
    });
});

// --- FACULTY ROUTES ---
app.get('/api/faculty', authenticateToken, (req, res) => {
    if (req.user.role === 'teacher') {
        db.all("SELECT * FROM faculty WHERE user_id = ? OR email = ?", [req.user.id, req.user.email], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        db.all("SELECT * FROM faculty", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

app.post('/api/faculty', authenticateToken, (req, res) => {
    let { name, email, department, designation, registration_no, password } = req.body;

    if (!password) {
        password = '123456';
    }

    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'User with this email already exists' });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const userStmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'teacher')");
            userStmt.run(name, email, hashedPassword, function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const userId = this.lastID;

                const stmt = db.prepare("INSERT INTO faculty (user_id, name, email, department, designation, registration_no) VALUES (?, ?, ?, ?, ?, ?)");
                stmt.run(userId, name, email, department, designation, registration_no, function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID, user_id: userId, ...req.body });
                });
            });
        } catch (e) {
            res.status(500).json({ error: 'Error creating user' });
        }
    });
});

app.put('/api/faculty/:id', authenticateToken, (req, res) => {
    const { name, email, department, designation, registration_no } = req.body;
    const stmt = db.prepare("UPDATE faculty SET name = ?, email = ?, department = ?, designation = ?, registration_no = ? WHERE id = ?");
    stmt.run(name, email, department, designation, registration_no, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/faculty/:id', authenticateToken, (req, res) => {
    // Get user_id before deleting so we can clean up the users table
    db.get("SELECT user_id FROM faculty WHERE id = ?", [req.params.id], (err, faculty) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

        db.run("DELETE FROM faculty WHERE id = ?", req.params.id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            // Also delete the associated user record
            if (faculty.user_id) {
                db.run("DELETE FROM users WHERE id = ?", faculty.user_id);
            }
            res.json({ message: 'Deleted' });
        });
    });
});

// --- ATTENDANCE ROUTES ---
app.get('/api/attendance', authenticateToken, (req, res) => {
    if (req.user.role === 'student') {
        // Find student profile for this user
        db.get("SELECT id FROM students WHERE user_id = ?", [req.user.id], (err, student) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!student) return res.json([]); // No profile, no attendance

            db.all("SELECT * FROM attendance WHERE student_id = ?", [student.id], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        });
    } else {
        db.all("SELECT * FROM attendance", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

app.post('/api/attendance', authenticateToken, (req, res) => {
    const { date, records } = req.body;

    // Attendance Restrictions
    if (req.user.role !== 'admin') {
        const today = new Date().toISOString().split('T')[0];
        if (date !== today) {
            return res.status(403).json({ error: 'Attendance can only be marked for the current date.' });
        }

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const startTime = 8 * 60 + 40; // 08:40 -> 520
        const endTime = 14 * 60 + 50;  // 14:50 -> 890

        if (currentTime < startTime || currentTime > endTime) {
            return res.status(403).json({ error: 'Attendance can only be marked between 08:40 AM and 02:50 PM.' });
        }
    }

    // Only delete attendance for the students included in this submission
    const studentIds = records.map(r => r.studentId);
    if (studentIds.length === 0) {
        return res.status(400).json({ error: 'No records provided' });
    }

    db.serialize(() => {
        const placeholders = studentIds.map(() => '?').join(',');
        db.run(`DELETE FROM attendance WHERE date = ? AND student_id IN (${placeholders})`, [date, ...studentIds], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            const stmt = db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)");
            records.forEach(r => {
                stmt.run(r.studentId, date, r.status);
            });
            stmt.finalize();
            res.json({ message: 'Attendance saved' });
        });
    });
});

// --- FEES ROUTES ---
app.get('/api/fees', authenticateToken, (req, res) => {
    db.all("SELECT f.*, s.name as student_name FROM fees f LEFT JOIN students s ON f.student_id = s.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fees', authenticateToken, (req, res) => {
    const { studentId, type, amount, dueDate, status } = req.body;
    const stmt = db.prepare("INSERT INTO fees (student_id, type, amount, due_date, status) VALUES (?, ?, ?, ?, ?)");
    stmt.run(studentId, type, amount, dueDate, status, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, studentId, type, amount, dueDate, status });
    });
});

app.put('/api/fees/:id', authenticateToken, (req, res) => {
    const { studentId, type, amount, dueDate, status } = req.body;
    const stmt = db.prepare("UPDATE fees SET student_id = ?, type = ?, amount = ?, due_date = ?, status = ? WHERE id = ?");
    stmt.run(studentId, type, amount, dueDate, status, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/fees/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM fees WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- ASSIGNMENTS ROUTES ---
app.get('/api/assignments', authenticateToken, (req, res) => {
    db.all("SELECT a.*, u.name as teacher_name FROM assignments a LEFT JOIN users u ON a.teacher_id = u.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/assignments', authenticateToken, (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.sendStatus(403);
    }
    const { title, description, course, dueDate, teacherId } = req.body;

    const stmt = db.prepare("INSERT INTO assignments (title, description, course, due_date, teacher_id) VALUES (?, ?, ?, ?, ?)");
    stmt.run(title, description, course, dueDate, req.user.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, description, course, dueDate, teacherId: req.user.id });
    });
});

// --- SUBMISSIONS ROUTES ---
app.post('/api/assignments/:id/submit', authenticateToken, (req, res) => {
    const { fileUrl, studentId } = req.body;

    db.get("SELECT id FROM students WHERE user_id = ?", [req.user.id], (err, student) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) return res.status(400).json({ error: 'Student profile not found' });

        const stmt = db.prepare("INSERT INTO submissions (assignment_id, student_id, file_url) VALUES (?, ?, ?)");
        stmt.run(req.params.id, student.id, fileUrl || 'mock_file.pdf', function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Assignment submitted successfully' });
        });
    });
});

app.get('/api/assignments/:id/submissions', authenticateToken, (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.sendStatus(403);
    }
    db.all(`SELECT s.*, st.name as student_name, st.email as student_email 
            FROM submissions s 
            JOIN students st ON s.student_id = st.id 
            WHERE s.assignment_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- NOTIFICATIONS ROUTES ---
app.get('/api/notifications', authenticateToken, (req, res) => {
    db.all("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/notifications', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.sendStatus(403);
    }
    const { userId, title, message } = req.body;
    const stmt = db.prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)");
    stmt.run(userId, title, message, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, userId, title, message });
    });
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
    const stmt = db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
    stmt.run(req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Marked as read' });
    });
});

// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const stats = {};

    db.serialize(() => {
        db.get("SELECT count(*) as count FROM students", (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.students = row ? row.count : 0;
        });
        db.get("SELECT count(*) as count FROM faculty", (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.faculty = row ? row.count : 0;
        });
        db.get("SELECT count(*) as count FROM fees WHERE status='Pending'", (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.feesPending = row ? row.count : 0;
            res.json(stats);
        });
    });
});

// --- COLLEGE INFO ROUTES ---
app.get('/api/college-info', authenticateToken, (req, res) => {
    db.all("SELECT key, value FROM college_info", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const info = {};
        rows.forEach(r => info[r.key] = r.value);
        res.json(info);
    });
});

app.put('/api/college-info/:key', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { key } = req.params;
    const { value } = req.body;
    db.run("INSERT OR REPLACE INTO college_info (key, value) VALUES (?, ?)", [key, value], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated', key, value });
    });
});

// --- ALUMNI ROUTES ---
app.get('/api/alumni', authenticateToken, (req, res) => {
    db.all("SELECT * FROM alumni ORDER BY batch_year DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/alumni', authenticateToken, upload.single('photo'), (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, batch_year, course, department, job_title, company, contact } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare("INSERT INTO alumni (name, batch_year, course, department, job_title, company, contact, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run(name, batch_year, course, department, job_title, company, contact, photo_url, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, batch_year, course, department, job_title, company, contact, photo_url });
    });
});

app.put('/api/alumni/:id', authenticateToken, upload.single('photo'), (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, batch_year, course, department, job_title, company, contact } = req.body;
    if (req.file) {
        const photo_url = `/uploads/${req.file.filename}`;
        const stmt = db.prepare("UPDATE alumni SET name=?, batch_year=?, course=?, department=?, job_title=?, company=?, contact=?, photo_url=? WHERE id=?");
        stmt.run(name, batch_year, course, department, job_title, company, contact, photo_url, req.params.id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated', photo_url });
        });
    } else {
        const stmt = db.prepare("UPDATE alumni SET name=?, batch_year=?, course=?, department=?, job_title=?, company=?, contact=? WHERE id=?");
        stmt.run(name, batch_year, course, department, job_title, company, contact, req.params.id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated' });
        });
    }
});

app.delete('/api/alumni/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.run("DELETE FROM alumni WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- STAFF CONTACTS ROUTES ---
app.get('/api/staff-contacts', authenticateToken, (req, res) => {
    db.all("SELECT * FROM staff_contacts ORDER BY department", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/staff-contacts', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, department, designation, phone, email } = req.body;
    const stmt = db.prepare("INSERT INTO staff_contacts (name, department, designation, phone, email) VALUES (?, ?, ?, ?, ?)");
    stmt.run(name, department, designation, phone, email, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, department, designation, phone, email });
    });
});

app.put('/api/staff-contacts/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, department, designation, phone, email } = req.body;
    const stmt = db.prepare("UPDATE staff_contacts SET name=?, department=?, designation=?, phone=?, email=? WHERE id=?");
    stmt.run(name, department, designation, phone, email, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/staff-contacts/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.run("DELETE FROM staff_contacts WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- ATTENDANCE REPORT ---
app.get('/api/attendance/report', authenticateToken, (req, res) => {
    const { startDate, endDate } = req.query;
    const query = `
        SELECT 
            s.id as student_id, s.name, s.course, s.department, s.year,
            COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
            COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_count,
            COUNT(a.id) as total_count
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        ${startDate && endDate ? "AND a.date BETWEEN ? AND ?" : ""}
        GROUP BY s.id, s.name, s.course, s.department, s.year
        ORDER BY s.name
    `;
    const params = startDate && endDate ? [startDate, endDate] : [];
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const report = rows.map(r => ({
            ...r,
            percentage: r.total_count > 0 ? Math.round((r.present_count / r.total_count) * 100) : 0,
            low_attendance: r.total_count > 0 && (r.present_count / r.total_count) < 0.75
        }));
        res.json(report);
    });
});

// --- FEE PAY & REMINDER ---
app.put('/api/fees/:id/pay', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.run("UPDATE fees SET status = 'Paid' WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Fee marked as paid' });
    });
});

app.post('/api/fees/remind', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.all(`SELECT DISTINCT f.student_id, s.user_id, s.name, f.amount, f.type
            FROM fees f JOIN students s ON f.student_id = s.id
            WHERE f.status = 'Pending'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.json({ message: 'No pending fees found' });

        const stmt = db.prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)");
        rows.forEach(r => {
            const msg = `Reminder: You have a pending ${r.type} fee of ₹${r.amount}. Please pay at the earliest.`;
            stmt.run(r.user_id, 'Fee Payment Reminder', msg);
        });
        stmt.finalize();
        res.json({ message: `Reminders sent to ${rows.length} students` });
    });
});

// --- DATA BACKUP ---
app.get('/api/backup', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const dbPath = resolve(__dirname, 'college_v2.db');
    const filename = `college_backup_${new Date().toISOString().split('T')[0]}.db`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = createReadStream(dbPath);
    stream.on('error', (err) => res.status(500).json({ error: 'Backup failed: ' + err.message }));
    stream.pipe(res);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
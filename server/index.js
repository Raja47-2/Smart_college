import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from './config.js';
import { createRequire } from 'module';
import { createReadStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from './database.js';
import aiRoutes from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname_backup = dirname(__filename);

const PORT = process.env.PORT || 5000;

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, resolve(__dirname_backup, 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(resolve(__dirname_backup, 'uploads')));


// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
    const { email, password, identifier } = req.body;
    const loginId = identifier || email;

    if (!loginId || !password) {
        return res.status(400).json({ error: 'Email/Registration No and password are required' });
    }

    // Step 1: Try to find user by email
    db.get("SELECT * FROM users WHERE email = ?", [loginId], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        if (user) {
                // ✅ VALIDATE PASSWORD (was missing before – critical bug fix)
                const valid = await bcrypt.compare(password, user.password);
                if (!valid) return res.status(400).json({ error: 'Invalid password' });
                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
                return res.json({ id: user.id, role: user.role, name: user.name, email: user.email, token });
            }

        // Step 2: Try student registration number
        db.get("SELECT user_id FROM students WHERE registration_no = ?", [loginId], (err, student) => {
            if (err) return res.status(500).json({ error: err.message });

            if (student) {
                db.get("SELECT * FROM users WHERE id = ?", [student.user_id], async (err, linkedUser) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (!linkedUser) return res.status(400).json({ error: 'User account not found' });
                    const valid = await bcrypt.compare(password, linkedUser.password);
                    if (!valid) return res.status(400).json({ error: 'Invalid password' });
                    const token = jwt.sign({ id: linkedUser.id, email: linkedUser.email, role: linkedUser.role }, SECRET_KEY, { expiresIn: '8h' });
                    return res.json({ id: linkedUser.id, role: linkedUser.role, name: linkedUser.name, email: linkedUser.email, token });
                });
                return;
            }

            // Step 3: Try faculty registration number
            db.get("SELECT user_id FROM faculty WHERE registration_no = ?", [loginId], (err, faculty) => {
                if (err) return res.status(500).json({ error: err.message });

                if (faculty) {
                    db.get("SELECT * FROM users WHERE id = ?", [faculty.user_id], async (err, linkedUser) => {
                        if (err) return res.status(500).json({ error: err.message });
                        if (!linkedUser) return res.status(400).json({ error: 'User account not found' });
                        const valid = await bcrypt.compare(password, linkedUser.password);
                        if (!valid) return res.status(400).json({ error: 'Invalid password' });
                        return res.json({ id: linkedUser.id, role: linkedUser.role, name: linkedUser.name, email: linkedUser.email });
                    });
                } else {
                    return res.status(400).json({ error: 'No account found with this email or registration number' });
                }
            });
        });
    });
});

// --- GET ALL USERS (admin only) ---
app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, email, role FROM users ORDER BY role, name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- CHANGE PASSWORD ---
app.put('/api/users/:id/password', async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
    try {
        const hashed = await bcrypt.hash(newPassword, 10);
        db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'Password changed successfully' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Error changing password' });
    }
});

// --- STUDENTS ROUTES ---
app.get('/api/students', (req, res) => {
    db.all("SELECT * FROM students", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/students', upload.single('photo'), (req, res) => {
    let { name, email, course, department, year, registration_no, type, password,
        address, dob, blood_group, father_name, mother_name, mobile, gender, parent_mobile } = req.body;

    if (!password) password = '123456';
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'User with this email already exists' });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userStmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')");
            userStmt.run(name, email, hashedPassword, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                const userId = this.lastID;
                const stmt = db.prepare(
                    "INSERT INTO students (user_id, name, email, course, department, year, registration_no, type, photo_url, address, dob, blood_group, father_name, mother_name, mobile, gender, parent_mobile) "
                    + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                );
                stmt.run(userId, name, email, course, department, year, registration_no, type,
                    photo_url, address || null, dob || null, blood_group || null, father_name || null, mother_name || null, mobile || null, gender || null, parent_mobile || null,
                    function (err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ id: this.lastID, user_id: userId, name, email, course, department, year, registration_no, type, photo_url });
                    });
            });
        } catch (e) {
            res.status(500).json({ error: 'Error creating user' });
        }
    });
});

app.put('/api/students/:id', upload.single('photo'), (req, res) => {
    const { name, email, course, department, year, registration_no, type,
        address, dob, blood_group, father_name, mother_name, mobile, gender, parent_mobile } = req.body;

    if (req.file) {
        const photo_url = `/uploads/${req.file.filename}`;
        const stmt = db.prepare(
            "UPDATE students SET name=?, email=?, course=?, department=?, year=?, registration_no=?, type=?, "
            + "photo_url=?, address=?, dob=?, blood_group=?, father_name=?, mother_name=?, mobile=?, gender=?, parent_mobile=? WHERE id=?"
        );
        stmt.run(name, email, course, department, year, registration_no, type,
            photo_url, address || null, dob || null, blood_group || null, father_name || null, mother_name || null, mobile || null, gender || null, parent_mobile || null,
            req.params.id, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Updated', photo_url });
            });
    } else {
        const stmt = db.prepare(
            "UPDATE students SET name=?, email=?, course=?, department=?, year=?, registration_no=?, type=?, "
            + "address=?, dob=?, blood_group=?, father_name=?, mother_name=?, mobile=?, gender=?, parent_mobile=? WHERE id=?"
        );
        stmt.run(name, email, course, department, year, registration_no, type,
            address || null, dob || null, blood_group || null, father_name || null, mother_name || null, mobile || null, gender || null, parent_mobile || null,
            req.params.id, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Updated' });
            });
    }
});

app.delete('/api/students/:id', (req, res) => {
    db.run("DELETE FROM students WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- FACULTY ROUTES ---
app.get('/api/faculty', (req, res) => {
    db.all("SELECT * FROM faculty", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/faculty', (req, res) => {
    const { name, email, department, designation, registration_no } = req.body;
    let password = req.body.password;

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

                const stmt = db.prepare("INSERT INTO faculty (user_id, name, email, department, designation) VALUES (?, ?, ?, ?, ?)");
                stmt.run(userId, name, email, department, designation, function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID, user_id: userId, ...req.body });
                });
            });
        } catch (e) {
            res.status(500).json({ error: 'Error creating user' });
        }
    });
});

app.put('/api/faculty/:id', (req, res) => {
    const { name, email, department, designation } = req.body;
    const stmt = db.prepare("UPDATE faculty SET name = ?, email = ?, department = ?, designation = ? WHERE id = ?");
    stmt.run(name, email, department, designation, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/faculty/:id', (req, res) => {
    db.run("DELETE FROM faculty WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- ATTENDANCE ROUTES ---
app.get('/api/attendance', (req, res) => {
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/attendance', (req, res) => {
    const { date, records, role } = req.body;

    // Attendance Restrictions (skip for admin)
    if (role !== 'admin') {
        const today = new Date().toISOString().split('T')[0];
        if (date !== today) {
            return res.status(403).json({ error: 'Attendance can only be marked for the current date.' });
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = 8 * 60 + 40;  // 08:40
        const endTime = 14 * 60 + 50;   // 14:50

        if (currentTime < startTime || currentTime > endTime) {
            return res.status(403).json({ error: 'Attendance can only be marked between 08:40 AM and 02:50 PM.' });
        }
    }

    db.serialize(() => {
        db.run("DELETE FROM attendance WHERE date = ?", date, (err) => {
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
app.get('/api/fees', (req, res) => {
    const sql = `
        SELECT f.*, s.name as student_name, s.type as student_type, s.department, s.year 
        FROM fees f 
        JOIN students s ON f.student_id = s.id 
        ORDER BY f.due_date DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fees', (req, res) => {
    const { studentId, type, amount, dueDate, status } = req.body;
    const stmt = db.prepare("INSERT INTO fees (student_id, type, amount, due_date, status) VALUES (?, ?, ?, ?, ?)");
    stmt.run(studentId, type, amount, dueDate, status, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, studentId, type, amount, dueDate, status });
    });
});

app.put('/api/fees/:id', (req, res) => {
    const { studentId, type, amount, dueDate, status } = req.body;
    const stmt = db.prepare("UPDATE fees SET student_id = ?, type = ?, amount = ?, due_date = ?, status = ? WHERE id = ?");
    stmt.run(studentId, type, amount, dueDate, status, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/fees/:id', (req, res) => {
    db.run("DELETE FROM fees WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- ASSIGNMENTS ROUTES ---
app.get('/api/assignments', (req, res) => {
    // If student, filter by their course? For now, fetch all or query param
    db.all("SELECT a.*, u.name as teacher_name FROM assignments a LEFT JOIN users u ON a.teacher_id = u.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/assignments', (req, res) => {
    const { title, description, course, dueDate, teacherId } = req.body;
    const stmt = db.prepare("INSERT INTO assignments (title, description, course, due_date, teacher_id) VALUES (?, ?, ?, ?, ?)");
    stmt.run(title, description, course, dueDate, teacherId || null, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, description, course, dueDate, teacherId });
    });
});

// --- SUBMISSIONS ROUTES ---
app.post('/api/assignments/:id/submit', (req, res) => {
    const { fileUrl, studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });
    const stmt = db.prepare("INSERT INTO submissions (assignment_id, student_id, file_url) VALUES (?, ?, ?)");
    stmt.run(req.params.id, studentId, fileUrl || 'mock_file.pdf', function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Assignment submitted successfully' });
    });
});

app.get('/api/assignments/:id/submissions', (req, res) => {
    db.all(`SELECT s.*, st.name as student_name, st.email as student_email 
            FROM submissions s 
            JOIN students st ON s.student_id = st.id 
            WHERE s.assignment_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- NOTIFICATIONS ROUTES ---
app.get('/api/notifications', (req, res) => {
    // Get notifications for this user OR global ones (user_id IS NULL)
    db.all("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/notifications', (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') { // Only admin/teacher can send?
        return res.sendStatus(403);
    }
    const { userId, title, message } = req.body; // userId can be null for broadcast
    const stmt = db.prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)");
    stmt.run(userId, title, message, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, userId, title, message });
    });
});

app.put('/api/notifications/:id/read', (req, res) => {
    const stmt = db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
    stmt.run(req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Marked as read' });
    });
});

// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', (req, res) => {
    const stats = {};
    db.serialize(() => {
        db.get("SELECT count(*) as count FROM students", (err, row) => stats.totalStudents = row ? row.count : 0);
        db.get("SELECT count(*) as count FROM faculty", (err, row) => stats.totalFaculty = row ? row.count : 0);
        db.get("SELECT count(*) as count FROM assignments", (err, row) => stats.totalAssignments = row ? row.count : 0);
        db.get("SELECT sum(amount) as total FROM fees WHERE status='Pending'", (err, row) => {
            stats.totalFees = row ? row.total || 0 : 0;
            res.json(stats);
        });
    });
});


// --- COLLEGE INFO ROUTES ---
app.get('/api/college-info', (req, res) => {
    db.all("SELECT key, value FROM college_info", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const info = {};
        rows.forEach(r => info[r.key] = r.value);
        res.json(info);
    });
});

app.put('/api/college-info/:key', (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    db.run("INSERT OR REPLACE INTO college_info (key, value) VALUES (?, ?)", [key, value], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated', key, value });
    });
});

// --- ALUMNI ROUTES ---
app.get('/api/alumni', (req, res) => {
    db.all("SELECT * FROM alumni ORDER BY batch_year DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/alumni', upload.single('photo'), (req, res) => {
    const { name, batch_year, course, department, job_title, company, contact } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare("INSERT INTO alumni (name, batch_year, course, department, job_title, company, contact, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run(name, batch_year, course, department, job_title, company, contact, photo_url, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, batch_year, course, department, job_title, company, contact, photo_url });
    });
});

app.put('/api/alumni/:id', upload.single('photo'), (req, res) => {
    const { name, batch_year, course, department, job_title, company, contact } = req.body;
    // If a new photo was uploaded, use it; otherwise keep existing
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

app.delete('/api/alumni/:id', (req, res) => {
    db.run("DELETE FROM alumni WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- STAFF CONTACTS ROUTES ---
app.get('/api/staff-contacts', (req, res) => {
    db.all("SELECT * FROM staff_contacts ORDER BY department", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/staff-contacts', (req, res) => {
    const { name, department, designation, phone, email } = req.body;
    const stmt = db.prepare("INSERT INTO staff_contacts (name, department, designation, phone, email) VALUES (?, ?, ?, ?, ?)");
    stmt.run(name, department, designation, phone, email, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, department, designation, phone, email });
    });
});

app.put('/api/staff-contacts/:id', (req, res) => {
    const { name, department, designation, phone, email } = req.body;
    const stmt = db.prepare("UPDATE staff_contacts SET name=?, department=?, designation=?, phone=?, email=? WHERE id=?");
    stmt.run(name, department, designation, phone, email, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/staff-contacts/:id', (req, res) => {
    db.run("DELETE FROM staff_contacts WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- ATTENDANCE REPORT ---
app.get('/api/attendance/report', (req, res) => {
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
app.put('/api/fees/:id/pay', (req, res) => {
    db.run("UPDATE fees SET status = 'Paid' WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Fee marked as paid' });
    });
});

app.post('/api/fees/remind', (req, res) => {
    // Get all students with pending fees and send them a notification
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


// ─── LOW ATTENDANCE ALERT ENDPOINTS ───────────────────────────────────────────

// GET /api/attendance/low-alert
// Returns Regular students with attendance below threshold (default 75%)
app.get('/api/attendance/low-alert', (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.sendStatus(403);
    const threshold = parseFloat(req.query.threshold) || 75;

    const sql = `
        SELECT
            s.id, s.name, s.email, s.registration_no, s.course, s.department,
            s.year, s.mobile, s.parent_mobile, s.photo_url,
            COUNT(a.id)                                            AS total_days,
            SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_days
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        WHERE s.type = 'Regular'
        GROUP BY s.id
        HAVING total_days > 0 AND (CAST(present_days AS REAL) / total_days * 100) < ?
        ORDER BY (CAST(present_days AS REAL) / total_days * 100) ASC
    `;
    db.all(sql, [threshold], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const result = rows.map(r => ({
            ...r,
            attendance_pct: r.total_days > 0
                ? parseFloat((r.present_days / r.total_days * 100).toFixed(1))
                : 0,
        }));
        res.json(result);
    });
});

// GET /api/sms-logs - return SMS alert history
app.get('/api/sms-logs', (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.sendStatus(403);
    const limit = parseInt(req.query.limit) || 100;
    db.all('SELECT * FROM sms_logs ORDER BY sent_at DESC LIMIT ?', [limit], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Helper: send SMS via Fast2SMS (India) or simulate
async function sendSMS(mobile, message, apiKey) {
    if (!apiKey || apiKey === 'DEMO') {
        // Simulation mode – pretend it was sent
        console.log(`[SMS SIMULATED] To: ${mobile} | Msg: ${message}`);
        return { status: 'simulated' };
    }
    // Fast2SMS REST API
    const url = 'https://www.fast2sms.com/dev/bulkV2';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'authorization': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            route: 'q',
            message,
            language: 'english',
            flash: 0,
            numbers: mobile,
        }),
    });
    const json = await response.json();
    if (!json.return) throw new Error(json.message || 'SMS API error');
    return json;
}

// POST /api/attendance/send-sms  – send SMS for one student
app.post('/api/attendance/send-sms', async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.sendStatus(403);
    const { student_id, student_name, parent_mobile, attendance_pct, month, api_key } = req.body;

    if (!parent_mobile) return res.status(400).json({ error: 'Parent mobile number not set for this student' });

    const monthLabel = month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const message = `Dear Parent, your ward ${student_name} has ${attendance_pct}% attendance in ${monthLabel}. Low attendance may affect exams. Please contact the college. - Smart College`;

    try {
        const smsKey = api_key || process.env.FAST2SMS_KEY || 'DEMO';
        await sendSMS(parent_mobile, message, smsKey);

        // Log to DB
        db.run(
            'INSERT INTO sms_logs (student_id, student_name, parent_mobile, attendance_pct, month, message, status) VALUES (?,?,?,?,?,?,?)',
            [student_id, student_name, parent_mobile, attendance_pct, monthLabel, message, smsKey === 'DEMO' ? 'simulated' : 'sent'],
            function (err) { if (err) console.error('Log error:', err.message); }
        );
        res.json({ success: true, message: 'SMS sent', sms_status: smsKey === 'DEMO' ? 'simulated' : 'sent' });
    } catch (e) {
        // Log failure
        db.run(
            'INSERT INTO sms_logs (student_id, student_name, parent_mobile, attendance_pct, month, message, status) VALUES (?,?,?,?,?,?,?)',
            [student_id, student_name, parent_mobile, attendance_pct, monthLabel || '', message, 'failed']
        );
        res.status(500).json({ error: e.message });
    }
});

// POST /api/attendance/send-sms-bulk – send SMS to ALL low-attendance Regular students
app.post('/api/attendance/send-sms-bulk', async (req, res) => {
    const { threshold = 75, api_key } = req.body;
    const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const smsKey = api_key || process.env.FAST2SMS_KEY || 'DEMO';

    const sql = `
        SELECT s.id, s.name, s.parent_mobile,
            COUNT(a.id) AS total_days,
            SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_days
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        WHERE s.type = 'Regular'
        GROUP BY s.id
        HAVING total_days > 0 AND (CAST(present_days AS REAL) / total_days * 100) < ?
    `;
    db.all(sql, [threshold], async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let sent = 0, skipped = 0, failed = 0;
        for (const r of rows) {
            if (!r.parent_mobile) { skipped++; continue; }
            const pct = parseFloat((r.present_days / r.total_days * 100).toFixed(1));
            const message = `Dear Parent, your ward ${r.name} has ${pct}% attendance in ${monthLabel}. Low attendance may affect exams. Please contact the college. - Smart College`;
            try {
                await sendSMS(r.parent_mobile, message, smsKey);
                db.run('INSERT INTO sms_logs (student_id, student_name, parent_mobile, attendance_pct, month, message, status) VALUES (?,?,?,?,?,?,?)',
                    [r.id, r.name, r.parent_mobile, pct, monthLabel, message, smsKey === 'DEMO' ? 'simulated' : 'sent']);
                sent++;
            } catch (e) {
                db.run('INSERT INTO sms_logs (student_id, student_name, parent_mobile, attendance_pct, month, message, status) VALUES (?,?,?,?,?,?,?)',
                    [r.id, r.name, r.parent_mobile, pct, monthLabel, message, 'failed']);
                failed++;
            }
        }
        res.json({ total: rows.length, sent, skipped, failed });
    });
});

// ──────────────────────────────────────────────────────────────────────────────

// --- DATA BACKUP ---
app.get('/api/backup', (req, res) => {
    const dbPath = resolve(__dirname_backup, 'college_v2.db');
    const filename = `college_backup_${new Date().toISOString().split('T')[0]}.db`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = createReadStream(dbPath);
    stream.on('error', (err) => res.status(500).json({ error: 'Backup failed: ' + err.message }));
    stream.pipe(res);
});

// ─── FEEDBACK ENDPOINTS ────────────────────────────────────────────────────────

// GET /api/feedback – returns all feedback
app.get('/api/feedback', (req, res) => {
    db.all('SELECT * FROM feedback ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /api/feedback/stats – admin only
app.get('/api/feedback/stats', (req, res) => {
    db.all(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status='reviewed' THEN 1 ELSE 0 END) as reviewed,
        SUM(CASE WHEN status='resolved' THEN 1 ELSE 0 END) as resolved,
        ROUND(AVG(CASE WHEN rating > 0 THEN rating END), 1) as avg_rating,
        SUM(CASE WHEN user_role='student' THEN 1 ELSE 0 END) as from_students,
        SUM(CASE WHEN user_role='teacher' THEN 1 ELSE 0 END) as from_teachers
    FROM feedback`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
    });
});

// POST /api/feedback – student or teacher submits feedback
app.post('/api/feedback', (req, res) => {
    const { category, subject, message, rating, is_anonymous, userId, userName, userRole } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
    const displayName = is_anonymous ? 'Anonymous' : userName || 'Unknown';
    db.run(
        'INSERT INTO feedback (user_id, user_name, user_role, category, subject, message, rating, is_anonymous) VALUES (?,?,?,?,?,?,?,?)',
        [userId || null, displayName, userRole || 'student', category || 'General', subject, message, rating || 0, is_anonymous ? 1 : 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Feedback submitted successfully' });
        }
    );
});

// PUT /api/feedback/:id – admin updates status and/or replies
app.put('/api/feedback/:id', (req, res) => {
    const { status, admin_reply } = req.body;
    db.run(
        "UPDATE feedback SET status=?, admin_reply=?, updated_at=datetime('now','localtime') WHERE id=?",
        [status, admin_reply || null, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Feedback not found' });
            res.json({ message: 'Updated' });
        }
    );
});

// DELETE /api/feedback/:id – admin only
app.delete('/api/feedback/:id', (req, res) => {
    db.run('DELETE FROM feedback WHERE id=?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// ──────────────────────────────────────────────────────────────────────────────

// --- TIMETABLES ROUTES ---
app.get('/api/timetables', (req, res) => {
    const { stream, department, year } = req.query;
    let sql = "SELECT * FROM timetables WHERE 1=1";
    const params = [];

    if (stream) { sql += " AND stream = ?"; params.push(stream); }
    if (department) { sql += " AND department = ?"; params.push(department); }
    if (year) { sql += " AND year = ?"; params.push(year); }

    sql += " ORDER BY day, time";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/timetables', (req, res) => {
    const { stream, department, year, day, time, subject, faculty_name } = req.body;
    const stmt = db.prepare("INSERT INTO timetables (stream, department, year, day, time, subject, faculty_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(stream, department, year, day, time, subject, faculty_name, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/timetables/:id', (req, res) => {
    db.run("DELETE FROM timetables WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- ONLINE CLASSES ROUTES ---
app.get('/api/online-classes', (req, res) => {
    db.all("SELECT oc.*, u.name as teacher_name FROM online_classes oc JOIN users u ON oc.teacher_id = u.id ORDER BY date, time", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const result = rows.map(r => ({
            ...r,
            departments: JSON.parse(r.departments),
            years: JSON.parse(r.years)
        }));
        res.json(result);
    });
});

app.post('/api/online-classes', (req, res) => {
    const { teacher_id, title, stream, departments, years, class_type, date, time, duration, meet_link, description } = req.body;
    const stmt = db.prepare("INSERT INTO online_classes (teacher_id, title, stream, departments, years, class_type, date, time, duration, meet_link, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run(teacher_id, title, stream, JSON.stringify(departments), JSON.stringify(years), class_type, date, time, duration, meet_link, description, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/online-classes/:id', (req, res) => {
    db.run("DELETE FROM online_classes WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- TEACHER PERMISSIONS ROUTES ---
app.get('/api/teacher-permissions/:teacherId', (req, res) => {
    db.get("SELECT permissions FROM teacher_permissions WHERE teacher_id = ?", [req.params.teacherId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row ? JSON.parse(row.permissions) : {});
    });
});

app.post('/api/teacher-permissions/:teacherId', (req, res) => {
    const { permissions } = req.body;
    const permsString = JSON.stringify(permissions);
    db.run("INSERT OR REPLACE INTO teacher_permissions (teacher_id, permissions) VALUES (?, ?)", [req.params.teacherId, permsString], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Permissions updated' });
    });
});

// --- STUDENT PERMISSIONS ROUTES ---
app.get('/api/student-permissions/all', (req, res) => {
    db.all("SELECT user_id, permissions FROM student_permissions", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const permsMap = {};
        rows.forEach(r => permsMap[r.user_id] = JSON.parse(r.permissions));
        res.json(permsMap);
    });
});

app.get('/api/student-permissions/:studentId', (req, res) => {
    db.get("SELECT permissions FROM student_permissions WHERE user_id = ?", [req.params.studentId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row ? JSON.parse(row.permissions) : {});
    });
});

app.post('/api/student-permissions/:studentId', (req, res) => {
    const { permissions } = req.body;
    const permsString = JSON.stringify(permissions);
    db.run("INSERT OR REPLACE INTO student_permissions (user_id, permissions) VALUES (?, ?)", [req.params.studentId, permsString], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Permissions updated' });
    });
});

// --- SEMESTER REGISTRATION ROUTES ---
app.get('/api/registrations', (req, res) => {
    const sql = `
        SELECT r.*, s.name as student_name, s.registration_no, s.department, s.year 
        FROM semester_registrations r
        JOIN students s ON r.student_id = s.id
        ORDER BY r.registration_date DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/registrations', (req, res) => {
    const { student_id, semester, registration_date, status, remarks } = req.body;
    const stmt = db.prepare("INSERT INTO semester_registrations (student_id, semester, registration_date, status, remarks) VALUES (?, ?, ?, ?, ?)");
    stmt.run(student_id, semester, registration_date, status, remarks, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/registrations/:id', (req, res) => {
    const { semester, registration_date, status, remarks } = req.body;
    const stmt = db.prepare("UPDATE semester_registrations SET semester=?, registration_date=?, status=?, remarks=? WHERE id=?");
    stmt.run(semester, registration_date, status, remarks, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/registrations/:id', (req, res) => {
    db.run("DELETE FROM semester_registrations WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- AI ROUTES ---
app.use('/api/ai', aiRoutes);

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './database.js';

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_secret_key_here';

app.use(cors());
app.use(express.json());

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

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ token, role: user.role, name: user.name });
        } else {
            // User not found by Email, check if it's a Registration No (for Students)
            // 1. Find the student with this Reg No
            db.get("SELECT user_id FROM students WHERE registration_no = ?", [loginId], (err, student) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!student) return res.status(400).json({ error: 'User not found' });

                // 2. Find the User record linked to this student
                db.get("SELECT * FROM users WHERE id = ?", [student.user_id], async (err, linkedUser) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (!linkedUser) return res.status(400).json({ error: 'User record not found' });

                    const validPassword = await bcrypt.compare(password, linkedUser.password);
                    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

                    const token = jwt.sign({ id: linkedUser.id, email: linkedUser.email, role: linkedUser.role }, SECRET_KEY, { expiresIn: '1h' });
                    res.json({ token, role: linkedUser.role, name: linkedUser.name });
                });
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
    const { name, email, course, department, year, registration_no, type, password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required for new students' });
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
    db.run("DELETE FROM students WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
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
    const { name, email, department, designation, password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required for new faculty' });
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

app.put('/api/faculty/:id', authenticateToken, (req, res) => {
    const { name, email, department, designation } = req.body;
    const stmt = db.prepare("UPDATE faculty SET name = ?, email = ?, department = ?, designation = ? WHERE id = ?");
    stmt.run(name, email, department, designation, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/faculty/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM faculty WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

// --- ATTENDANCE ROUTES ---
app.get('/api/attendance', authenticateToken, (req, res) => {
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/attendance', authenticateToken, (req, res) => {
    const { date, records } = req.body;

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
    // If student, filter by their course? For now, fetch all or query param
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
    // req.user.id is the user_id (auth). We might need to map it to teacher_id if they are separate tables, 
    // but in my schema 'teacher_id' in assignments refers to 'users(id)' directly? 
    // initDb.js says: FOREIGN KEY(teacher_id) REFERENCES users(id) -> Yes.

    const stmt = db.prepare("INSERT INTO assignments (title, description, course, due_date, teacher_id) VALUES (?, ?, ?, ?, ?)");
    stmt.run(title, description, course, dueDate, req.user.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, description, course, dueDate, teacherId: req.user.id });
    });
});

// --- SUBMISSIONS ROUTES ---
app.post('/api/assignments/:id/submit', authenticateToken, (req, res) => {
    const { fileUrl, studentId } = req.body; // studentId usually comes from logged in user
    // We need to find the student record associated with this user.
    // In simpler design, we might just use req.user.id if submissions linked to user, but schema says student_id.

    // First find student_id for this user
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
    // Get notifications for this user OR global ones (user_id IS NULL)
    db.all("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/notifications', authenticateToken, (req, res) => {
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
        db.get("SELECT count(*) as count FROM students", (err, row) => stats.students = row ? row.count : 0);
        db.get("SELECT count(*) as count FROM faculty", (err, row) => stats.faculty = row ? row.count : 0);
        db.get("SELECT count(*) as count FROM fees WHERE status='Pending'", (err, row) => {
            stats.feesPending = row ? row.count : 0;
            res.json(stats);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

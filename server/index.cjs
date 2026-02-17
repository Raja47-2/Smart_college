const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_secret_key_here'; // In prod, use env var

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
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, role: user.role, name: user.name });
    });
});

// --- STUDENTS ROUTES ---
app.get('/api/students', authenticateToken, (req, res) => {
    db.all("SELECT * FROM students", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/students', authenticateToken, (req, res) => {
    const { name, email, course, year } = req.body;
    const stmt = db.prepare("INSERT INTO students (name, email, course, year) VALUES (?, ?, ?, ?)");
    stmt.run(name, email, course, year, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, email, course, year });
    });
});

app.put('/api/students/:id', authenticateToken, (req, res) => {
    const { name, email, course, year } = req.body;
    const stmt = db.prepare("UPDATE students SET name = ?, email = ?, course = ?, year = ? WHERE id = ?");
    stmt.run(name, email, course, year, req.params.id, function (err) {
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
    db.all("SELECT * FROM faculty", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/faculty', authenticateToken, (req, res) => {
    const { name, email, department, designation } = req.body;
    const stmt = db.prepare("INSERT INTO faculty (name, email, department, designation) VALUES (?, ?, ?, ?)");
    stmt.run(name, email, department, designation, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

// --- ATTENDANCE ROUTES ---
app.get('/api/attendance', authenticateToken, (req, res) => {
    // Can filter by student_id or date if queries exist
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/attendance', authenticateToken, (req, res) => {
    const { date, records } = req.body; // records: [{studentId, status}]

    // Transaction-like approach (simplified)
    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)");
        records.forEach(r => {
            stmt.run(r.studentId, date, r.status);
        });
        stmt.finalize();
        res.json({ message: 'Attendance saved' });
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

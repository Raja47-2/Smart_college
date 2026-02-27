import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/students
router.get('/', authenticateToken, (req, res) => {
    if (req.user.role === 'student') {
        db.all(
            "SELECT * FROM students WHERE user_id = ? OR email = ?",
            [req.user.id, req.user.email],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            }
        );
    } else {
        db.all("SELECT * FROM students", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// POST /api/students
router.post('/', authenticateToken, (req, res) => {
    const { name, email, course, department, year, registration_no, type } = req.body;
    let { password } = req.body;

    // if password not supplied, default to a simple value so they can log in
    if (!password) {
        password = '123456';
    }

    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'User with this email already exists' });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const userStmt = db.prepare(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')"
            );
            userStmt.run(name, email, hashedPassword, function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const userId = this.lastID;

                const stmt = db.prepare(
                    "INSERT INTO students (user_id, name, email, course, department, year, registration_no, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                );
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

// PUT /api/students/:id
router.put('/:id', authenticateToken, (req, res) => {
    const { name, email, course, department, year, registration_no, type } = req.body;
    const stmt = db.prepare(
        "UPDATE students SET name = ?, email = ?, course = ?, department = ?, year = ?, registration_no = ?, type = ? WHERE id = ?"
    );
    stmt.run(name, email, course, department, year, registration_no, type, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

// DELETE /api/students/:id
router.delete('/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM students WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

export default router;

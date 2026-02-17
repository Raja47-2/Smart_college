import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/faculty
router.get('/', authenticateToken, (req, res) => {
    if (req.user.role === 'teacher') {
        db.all(
            "SELECT * FROM faculty WHERE user_id = ? OR email = ?",
            [req.user.id, req.user.email],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            }
        );
    } else {
        db.all("SELECT * FROM faculty", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// POST /api/faculty
router.post('/', authenticateToken, (req, res) => {
    const { name, email, department, designation, password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required for new faculty' });
    }

    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'User with this email already exists' });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const userStmt = db.prepare(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'teacher')"
            );
            userStmt.run(name, email, hashedPassword, function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const userId = this.lastID;

                const stmt = db.prepare(
                    "INSERT INTO faculty (user_id, name, email, department, designation) VALUES (?, ?, ?, ?, ?)"
                );
                stmt.run(userId, name, email, department, designation, function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID, user_id: userId, name, email, department, designation });
                });
            });
        } catch (e) {
            res.status(500).json({ error: 'Error creating user' });
        }
    });
});

// PUT /api/faculty/:id
router.put('/:id', authenticateToken, (req, res) => {
    const { name, email, department, designation } = req.body;
    const stmt = db.prepare(
        "UPDATE faculty SET name = ?, email = ?, department = ?, designation = ? WHERE id = ?"
    );
    stmt.run(name, email, department, designation, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

// DELETE /api/faculty/:id
router.delete('/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM faculty WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

export default router;

import { Router } from 'express';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/fees
router.get('/', authenticateToken, (req, res) => {
    db.all(
        "SELECT f.*, s.name as student_name FROM fees f LEFT JOIN students s ON f.student_id = s.id",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// POST /api/fees
router.post('/', authenticateToken, (req, res) => {
    const { studentId, type, amount, dueDate, status } = req.body;
    const stmt = db.prepare("INSERT INTO fees (student_id, type, amount, due_date, status) VALUES (?, ?, ?, ?, ?)");
    stmt.run(studentId, type, amount, dueDate, status, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, studentId, type, amount, dueDate, status });
    });
});

// PUT /api/fees/:id
router.put('/:id', authenticateToken, (req, res) => {
    const { studentId, type, amount, dueDate, status } = req.body;
    const stmt = db.prepare("UPDATE fees SET student_id = ?, type = ?, amount = ?, due_date = ?, status = ? WHERE id = ?");
    stmt.run(studentId, type, amount, dueDate, status, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

// DELETE /api/fees/:id
router.delete('/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM fees WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

export default router;

import { Router } from 'express';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/attendance
router.get('/', authenticateToken, (req, res) => {
    db.all("SELECT * FROM attendance", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST /api/attendance
router.post('/', authenticateToken, (req, res) => {
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

export default router;

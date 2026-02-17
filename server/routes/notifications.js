import { Router } from 'express';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
    db.all(
        "SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC",
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// POST /api/notifications
router.post('/', authenticateToken, (req, res) => {
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

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, (req, res) => {
    const stmt = db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
    stmt.run(req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Marked as read' });
    });
});

export default router;

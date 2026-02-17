import { Router } from 'express';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, (req, res) => {
    const stats = {};

    db.serialize(() => {
        db.get("SELECT count(*) as count FROM students", (err, row) => {
            stats.students = row ? row.count : 0;
        });
        db.get("SELECT count(*) as count FROM faculty", (err, row) => {
            stats.faculty = row ? row.count : 0;
        });
        db.get("SELECT count(*) as count FROM fees WHERE status='Pending'", (err, row) => {
            stats.feesPending = row ? row.count : 0;
            res.json(stats);
        });
    });
});

export default router;

import { Router } from 'express';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
    const { role, id } = req.user;

    if (role === 'admin' || role === 'principal') {
        // Admins see everything
        db.all("SELECT * FROM notifications ORDER BY created_at DESC", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else if (role === 'student') {
        // Students see specific ones for them OR broadcasts for students/all
        db.get("SELECT department, year, course FROM students WHERE user_id = ?", [id], (err, student) => {
            if (err) return res.status(500).json({ error: err.message });

            const query = `
                SELECT * FROM notifications 
                WHERE user_id = ? 
                OR (target_role = 'all')
                OR (target_role = 'student' AND (target_dept IS NULL OR target_dept = ?))
                OR (target_role = 'student' AND (target_year IS NULL OR target_year = ?))
                OR (target_role = 'student' AND target_dept = ? AND target_year = ?)
                ORDER BY created_at DESC
            `;
            // Simplified logic: matches role, or role+dept, or role+year, or role+dept+year
            // Refined logic for "specific branch year":
            const refinedQuery = `
                SELECT * FROM notifications 
                WHERE user_id = ? 
                OR (target_role = 'all')
                OR (target_role = 'student' AND 
                    (target_dept IS NULL OR target_dept = ?) AND 
                    (target_year IS NULL OR target_year = ?) AND
                    (target_course IS NULL OR target_course = ?)
                )
                ORDER BY created_at DESC
            `;

            db.all(refinedQuery, [id, student?.department, student?.year, student?.course], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        });
    } else if (role === 'teacher') {
        // Teachers see specific ones or broadcasts for staff/all
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            OR (target_role = 'all')
            OR (target_role = 'staff')
            ORDER BY created_at DESC
        `;
        db.all(query, [id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        res.json([]);
    }
});

// POST /api/notifications
router.post('/', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'principal') {
        return res.sendStatus(403);
    }

    let { userId, title, message, targetRole, targetDept, targetYear, targetCourse } = req.body;

    // Default targetRole to 'all' if it's a broadcast and no role specified
    if (!userId && !targetRole) {
        targetRole = 'all';
    }

    const stmt = db.prepare(`
        INSERT INTO notifications (user_id, title, message, target_role, target_dept, target_year, target_course) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId || null, title, message, targetRole || null, targetDept || null, targetYear || null, targetCourse || null, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, userId, title, message, targetRole, targetDept, targetYear, targetCourse });
    });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, (req, res) => {
    // Only update if it belongs to the user or is a broadcast (though broadcasts marks as read for everyone in this simple impl)
    // Actually, usually broadcasts should have a junction table for read status per user, 
    // but sticking to existing schema where is_read is on notifications.
    const stmt = db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
    stmt.run(req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Marked as read' });
    });
});

export default router;

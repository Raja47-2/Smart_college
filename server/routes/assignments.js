import { Router } from 'express';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// GET /api/assignments
router.get('/', authenticateToken, (req, res) => {
    db.all(
        "SELECT a.*, u.name as teacher_name FROM assignments a LEFT JOIN users u ON a.teacher_id = u.id",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// POST /api/assignments
router.post('/', authenticateToken, (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.sendStatus(403);
    }

    const { title, description, course, dueDate } = req.body;
    const stmt = db.prepare(
        "INSERT INTO assignments (title, description, course, due_date, teacher_id) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run(title, description, course, dueDate, req.user.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, description, course, dueDate, teacherId: req.user.id });
    });
});

// POST /api/assignments/:id/submit
router.post('/:id/submit', authenticateToken, (req, res) => {
    const { fileUrl } = req.body;

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

// GET /api/assignments/:id/submissions
router.get('/:id/submissions', authenticateToken, (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.sendStatus(403);
    }

    db.all(
        `SELECT s.*, st.name as student_name, st.email as student_email
         FROM submissions s
         JOIN students st ON s.student_id = st.id
         WHERE s.assignment_id = ?`,
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

export default router;

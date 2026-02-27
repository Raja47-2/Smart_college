import { Router } from 'express';
import db from '../database.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// ─── STUDENT PERMISSIONS ───────────────────────────────────────────────────────

// GET /api/student-permissions/all
router.get('/all', authenticateToken, (req, res) => {
    db.all(
        "SELECT student_id, permissions FROM student_permissions",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const result = {};
            rows.forEach(row => {
                try {
                    result[String(row.student_id)] = JSON.parse(row.permissions || '{}');
                } catch (e) {
                    result[String(row.student_id)] = {};
                }
            });
            res.json(result);
        }
    );
});

// GET /api/student-permissions/:studentId
router.get('/:studentId', authenticateToken, (req, res) => {
    const studentId = req.params.studentId;
    db.get(
        "SELECT permissions FROM student_permissions WHERE student_id = ?",
        [studentId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.json({});
            try {
                return res.json(JSON.parse(row.permissions || '{}'));
            } catch (e) {
                return res.json({});
            }
        }
    );
});

// POST /api/student-permissions/:studentId
router.post('/:studentId', authenticateToken, (req, res) => {
    // Only admin/principal or teacher with delegate_permissions can set
    if (req.user.role !== 'admin' && req.user.role !== 'principal') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const studentId = req.params.studentId;
    const { permissions } = req.body;

    const permissionsJson = JSON.stringify(permissions || {});

    // Insert or replace
    const stmt = db.prepare(
        "INSERT INTO student_permissions (student_id, permissions) VALUES (?, ?) ON CONFLICT(student_id) DO UPDATE SET permissions = ?"
    );
    stmt.run(studentId, permissionsJson, permissionsJson, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Permissions saved' });
    });
});

// ─── TEACHER PERMISSIONS ───────────────────────────────────────────────────────

// GET /api/teacher-permissions/all
router.get('/all', authenticateToken, (req, res) => {
    db.all(
        "SELECT teacher_id, permissions FROM teacher_permissions",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const result = {};
            rows.forEach(row => {
                try {
                    result[String(row.teacher_id)] = JSON.parse(row.permissions || '{}');
                } catch (e) {
                    result[String(row.teacher_id)] = {};
                }
            });
            res.json(result);
        }
    );
});

// GET /api/teacher-permissions/:teacherId
router.get('/:teacherId', authenticateToken, (req, res) => {
    const teacherId = req.params.teacherId;
    db.get(
        "SELECT permissions FROM teacher_permissions WHERE teacher_id = ?",
        [teacherId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.json({});
            try {
                return res.json(JSON.parse(row.permissions || '{}'));
            } catch (e) {
                return res.json({});
            }
        }
    );
});

// POST /api/teacher-permissions/:teacherId
router.post('/:teacherId', authenticateToken, (req, res) => {
    // Only admin/principal can set
    if (req.user.role !== 'admin' && req.user.role !== 'principal') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const teacherId = req.params.teacherId;
    const { permissions } = req.body;

    const permissionsJson = JSON.stringify(permissions || {});

    // Insert or replace
    const stmt = db.prepare(
        "INSERT INTO teacher_permissions (teacher_id, permissions) VALUES (?, ?) ON CONFLICT(teacher_id) DO UPDATE SET permissions = ?"
    );
    stmt.run(teacherId, permissionsJson, permissionsJson, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Permissions saved' });
    });
});

export default router;

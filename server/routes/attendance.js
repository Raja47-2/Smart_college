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

    if (!date || !records || records.length === 0) {
        return res.status(400).json({ error: 'Date and records are required' });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        // First delete old records for the date
        db.run("DELETE FROM attendance WHERE date = ?", [date], (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: 'Failed to clear old attendance: ' + err.message });
            }

            // Then insert new records
            const stmt = db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)");
            let hasError = false;
            
            records.forEach(r => {
                if (!hasError && r.studentId && r.status) {
                    stmt.run(r.studentId, date, r.status, (err) => {
                        if (err && !hasError) {
                            hasError = true;
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: 'Failed to insert attendance: ' + err.message });
                        }
                    });
                }
            });
            
            stmt.finalize((err) => {
                if (err || hasError) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: 'Failed to finalize: ' + (err?.message || 'Unknown error') });
                }
                
                db.run("COMMIT", (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: 'Failed to commit: ' + err.message });
                    }
                    res.json({ message: 'Attendance saved successfully' });
                });
            });
        });
    });
});

export default router;

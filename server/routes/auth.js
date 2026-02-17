import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { SECRET_KEY } from '../config.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password, identifier } = req.body;
    const loginId = identifier || email;

    // Try to find user by email first
    db.get("SELECT * FROM users WHERE email = ?", [loginId], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        if (user) {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                SECRET_KEY,
                { expiresIn: '1h' }
            );
            return res.json({ token, role: user.role, name: user.name });
        }

        // Not found by email — try registration number (students)
        db.get("SELECT user_id FROM students WHERE registration_no = ?", [loginId], (err, student) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!student) return res.status(400).json({ error: 'User not found' });

            db.get("SELECT * FROM users WHERE id = ?", [student.user_id], async (err, linkedUser) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!linkedUser) return res.status(400).json({ error: 'User record not found' });

                const validPassword = await bcrypt.compare(password, linkedUser.password);
                if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

                const token = jwt.sign(
                    { id: linkedUser.id, email: linkedUser.email, role: linkedUser.role },
                    SECRET_KEY,
                    { expiresIn: '1h' }
                );
                res.json({ token, role: linkedUser.role, name: linkedUser.name });
            });
        });
    });
});

export default router;

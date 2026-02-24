import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getTeacherPermissions } from '../services/api';

/**
 * Returns a `hasPermission(key)` function.
 * - Admin: always true
 * - Teacher: checks stored permissions
 * - Student/others: always false
 */
export const usePermissions = () => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState({});

    useEffect(() => {
        if (!user) return;

        if (user.role === 'student') {
            axios.get(`http://localhost:5000/api/student-permissions/${user.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then(res => setPermissions(res.data || {}));
        } else if (user.role === 'teacher') {
            getTeacherPermissions(user.id).then(perms => {
                setPermissions(perms || {});
            }).catch(err => console.error("Failed to fetch teacher permissions", err));
        }
    }, [user]);

    const hasPermission = (key) => {
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'principal') return true;
        if (user.role === 'teacher' || user.role === 'student') {
            return !!permissions[key];
        }
        return false;
    };

    return { hasPermission };
};

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
    const [studentPerms, setStudentPerms] = useState({});

    useEffect(() => {
        if (user?.role === 'student') {
            axios.get(`http://localhost:5000/api/student-permissions/${user.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then(res => setStudentPerms(res.data || {}));
        }
    }, [user]);

    const hasPermission = (key) => {
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'principal') return true;
        if (user.role === 'teacher') {
            const perms = getTeacherPermissions(user.id);
            return !!perms[key];
        }
        if (user.role === 'student') {
            return !!studentPerms[key];
        }
        return false;
    };

    return { hasPermission };
};

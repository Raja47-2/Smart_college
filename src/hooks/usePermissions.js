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

    const hasPermission = (key) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.role === 'teacher') {
            const perms = getTeacherPermissions(user.id);
            return !!perms[key];
        }
        return false;
    };

    return { hasPermission };
};

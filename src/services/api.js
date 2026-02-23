import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Local Storage-based Authentication (no backend needed) ───────────────────
const HARDCODED_ADMIN = {
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
    name: 'Admin',
};

export const loginUser = async (identifier, password) => {
    const id = (identifier || '').trim();
    const pwd = (password || '').trim();

    // 1. Check hardcoded admin account
    if (
        (id === HARDCODED_ADMIN.email) &&
        (pwd === '' || pwd === HARDCODED_ADMIN.password)
    ) {
        const userData = { ...HARDCODED_ADMIN, token: 'local-admin-token', id: 'admin-001' };
        delete userData.password;
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    }

    // 2. Check faculty stored in localStorage
    const db = JSON.parse(localStorage.getItem('smart_college_db') || '{}');
    const faculty = db.faculty || [];
    const matchedFaculty = faculty.find(
        (f) =>
            f.email &&
            f.email.toLowerCase() === id.toLowerCase() &&
            (pwd === '' || f.password === pwd || !f.password)
    );
    if (matchedFaculty) {
        const userData = {
            id: matchedFaculty.id,
            name: matchedFaculty.name,
            email: matchedFaculty.email,
            role: 'teacher',
            token: 'local-teacher-token-' + matchedFaculty.id,
        };
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    }

    // 3. Check students stored in localStorage (by registration number)
    const students = db.students || [];
    const matchedStudent = students.find(
        (s) =>
            (s.registrationNumber && s.registrationNumber === id) &&
            (pwd === '' || s.password === pwd || !s.password)
    );
    if (matchedStudent) {
        const userData = {
            id: matchedStudent.id,
            name: matchedStudent.name,
            email: matchedStudent.email || id,
            role: 'student',
            token: 'local-student-token-' + matchedStudent.id,
        };
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    }

    // No match found
    throw new Error('Invalid credentials');
};

export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// ─── localStorage helpers ─────────────────────────────────────────────────────
const getDB = () => JSON.parse(localStorage.getItem('smart_college_db') || '{}');
const saveDB = (db) => localStorage.setItem('smart_college_db', JSON.stringify(db));
const genId = () => Date.now() + Math.floor(Math.random() * 1000);

// ─── Students ─────────────────────────────────────────────────────────────────
export const getStudents = async () => {
    return (getDB().students || []);
};
export const addStudent = async (data) => {
    const db = getDB();
    db.students = db.students || [];
    const student = { ...data, id: genId(), createdAt: new Date().toISOString() };
    db.students.push(student);
    saveDB(db);
    return student;
};
export const updateStudent = async (id, data) => {
    const db = getDB();
    db.students = (db.students || []).map(s =>
        String(s.id) === String(id) ? { ...s, ...data } : s
    );
    saveDB(db);
    return data;
};
export const deleteStudent = async (id) => {
    const db = getDB();
    db.students = (db.students || []).filter(s => String(s.id) !== String(id));
    saveDB(db);
};

// ─── Faculty ──────────────────────────────────────────────────────────────────
export const getFaculty = async () => {
    return (getDB().faculty || []);
};
export const addFaculty = async (data) => {
    const db = getDB();
    db.faculty = db.faculty || [];
    const member = { ...data, id: genId(), createdAt: new Date().toISOString() };
    db.faculty.push(member);
    saveDB(db);
    return member;
};
export const updateFaculty = async (id, data) => {
    const db = getDB();
    db.faculty = (db.faculty || []).map(f =>
        String(f.id) === String(id) ? { ...f, ...data } : f
    );
    saveDB(db);
    return data;
};
export const deleteFaculty = async (id) => {
    const db = getDB();
    db.faculty = (db.faculty || []).filter(f => String(f.id) !== String(id));
    saveDB(db);
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const getAttendance = async () => (getDB().attendance || []);
export const saveAttendance = async (date, records) => {
    const db = getDB();
    db.attendance = db.attendance || [];
    // Remove existing entry for same date then add new
    db.attendance = db.attendance.filter(a => a.date !== date);
    db.attendance.push({ date, records, savedAt: new Date().toISOString() });
    saveDB(db);
};

// ─── Fees ─────────────────────────────────────────────────────────────────────
export const getFees = async () => (getDB().fees || []);
export const addFee = async (data) => {
    const db = getDB();
    db.fees = db.fees || [];
    const fee = { ...data, id: genId(), createdAt: new Date().toISOString() };
    db.fees.push(fee);
    saveDB(db);
    return fee;
};
export const updateFee = async (id, data) => {
    const db = getDB();
    db.fees = (db.fees || []).map(f =>
        String(f.id) === String(id) ? { ...f, ...data } : f
    );
    saveDB(db);
    return data;
};
export const deleteFee = async (id) => {
    const db = getDB();
    db.fees = (db.fees || []).filter(f => String(f.id) !== String(id));
    saveDB(db);
};

// ─── Assignments ──────────────────────────────────────────────────────────────
export const getAssignments = async () => (getDB().assignments || []);
export const createAssignment = async (data) => {
    const db = getDB();
    db.assignments = db.assignments || [];
    const assignment = { ...data, id: genId(), submissions: [], createdAt: new Date().toISOString() };
    db.assignments.push(assignment);
    saveDB(db);
    return assignment;
};
export const submitAssignment = async (id, data) => {
    const db = getDB();
    db.assignments = (db.assignments || []).map(a => {
        if (String(a.id) === String(id)) {
            return { ...a, submissions: [...(a.submissions || []), { ...data, submittedAt: new Date().toISOString() }] };
        }
        return a;
    });
    saveDB(db);
};
export const getSubmissions = async (id) => {
    const assignments = getDB().assignments || [];
    const found = assignments.find(a => String(a.id) === String(id));
    return found ? found.submissions || [] : [];
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = async () => (getDB().notifications || []);
export const sendNotification = async (data) => {
    const db = getDB();
    db.notifications = db.notifications || [];
    const notif = { ...data, id: genId(), read: false, createdAt: new Date().toISOString() };
    db.notifications.unshift(notif);
    saveDB(db);
    return notif;
};
export const markNotificationRead = async (id) => {
    const db = getDB();
    db.notifications = (db.notifications || []).map(n =>
        String(n.id) === String(id) ? { ...n, read: true } : n
    );
    saveDB(db);
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
    const db = getDB();
    return {
        totalStudents: (db.students || []).length,
        totalFaculty: (db.faculty || []).length,
        totalFees: (db.fees || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0),
        totalAssignments: (db.assignments || []).length,
    };
};

// ─── Teacher Permissions ──────────────────────────────────────────────────────
export const ALL_PERMISSIONS = [
    { key: 'manage_students', label: 'Manage Students' },
    { key: 'manage_fees', label: 'Manage Fees' },
    { key: 'manage_attendance', label: 'Manage Attendance' },
    { key: 'manage_assignments', label: 'Manage Assignments' },
    { key: 'manage_online_classes', label: 'Online Classes' },
    { key: 'view_analytics', label: 'View Analytics' },
    { key: 'manage_notifications', label: 'Notifications' },
    { key: 'view_reports', label: 'Attendance Reports' },
];

export const getTeacherPermissions = (teacherId) => {
    const db = getDB();
    const perms = db.teacher_permissions || {};
    return perms[String(teacherId)] || {};
};

export const setTeacherPermissions = (teacherId, permissions) => {
    const db = getDB();
    db.teacher_permissions = db.teacher_permissions || {};
    db.teacher_permissions[String(teacherId)] = permissions;
    saveDB(db);
};

export default api;

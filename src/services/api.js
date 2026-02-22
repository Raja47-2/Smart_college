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

// Students
export const getStudents = () => api.get('/students').then(res => res.data);
export const addStudent = (data) => api.post('/students', data).then(res => res.data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data).then(res => res.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then(res => res.data);

// Faculty
export const getFaculty = () => api.get('/faculty').then(res => res.data);
export const addFaculty = (data) => api.post('/faculty', data).then(res => res.data);
export const updateFaculty = (id, data) => api.put(`/faculty/${id}`, data).then(res => res.data);
export const deleteFaculty = (id) => api.delete(`/faculty/${id}`).then(res => res.data);

// Attendance
export const getAttendance = () => api.get('/attendance').then(res => res.data);
export const saveAttendance = (date, records) => api.post('/attendance', { date, records }).then(res => res.data);

// Fees
export const getFees = () => api.get('/fees').then(res => res.data);
export const addFee = (data) => api.post('/fees', data).then(res => res.data);
export const updateFee = (id, data) => api.put(`/fees/${id}`, data).then(res => res.data);
export const deleteFee = (id) => api.delete(`/fees/${id}`).then(res => res.data);

// Assignments
export const getAssignments = () => api.get('/assignments').then(res => res.data);
export const createAssignment = (data) => api.post('/assignments', data).then(res => res.data);
export const submitAssignment = (id, data) => api.post(`/assignments/${id}/submit`, data).then(res => res.data);
export const getSubmissions = (id) => api.get(`/assignments/${id}/submissions`).then(res => res.data);

// Notifications
export const getNotifications = () => api.get('/notifications').then(res => res.data);
export const sendNotification = (data) => api.post('/notifications', data).then(res => res.data);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`).then(res => res.data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats').then(res => res.data);

export default api;

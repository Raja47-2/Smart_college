import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// No token interceptor — auth removed

// ─── Authentication (no token, just user object in localStorage) ──────────────
const API = 'http://localhost:5000/api';
const tok = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// ─── Authentication ──────────────
export const loginUser = async (identifier, password) => {
    const res = await axios.post(`${API}/auth/login`, { identifier, password });
    const userData = {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
};

export const logoutUser = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const getStudents = async () => {
    const res = await axios.get(`${API}/students`, tok());
    return res.data;
};
export const addStudent = async (formData) => {
    const res = await axios.post(`${API}/students`, formData, {
        headers: { ...tok().headers, 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};
export const updateStudent = async (id, formData) => {
    const res = await axios.put(`${API}/students/${id}`, formData, {
        headers: { ...tok().headers, 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};
export const deleteStudent = async (id) => {
    await axios.delete(`${API}/students/${id}`, tok());
};

// ─── Faculty ──────────────────────────────────────────────────────────────────
export const getFaculty = async () => {
    const res = await axios.get(`${API}/faculty`, tok());
    return res.data;
};
export const addFaculty = async (data) => {
    const res = await axios.post(`${API}/faculty`, data, tok());
    return res.data;
};
export const updateFaculty = async (id, data) => {
    const res = await axios.put(`${API}/faculty/${id}`, data, tok());
    return res.data;
};
export const deleteFaculty = async (id) => {
    await axios.delete(`${API}/faculty/${id}`, tok());
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const getAttendance = async () => {
    const res = await axios.get(`${API}/attendance`, tok());
    return res.data;
};
export const saveAttendance = async (date, records) => {
    await axios.post(`${API}/attendance`, { date, records }, tok());
};
export const getAttendanceReport = async (startDate, endDate) => {
    const res = await axios.get(`${API}/attendance/report`, { ...tok(), params: { startDate, endDate } });
    return res.data;
};
export const getLowAttendanceAlerts = async (threshold = 75) => {
    const res = await axios.get(`${API}/attendance/low-alert`, { ...tok(), params: { threshold } });
    return res.data;
};
export const sendAttendanceSMS = async (data) => {
    const res = await axios.post(`${API}/attendance/send-sms`, data, tok());
    return res.data;
};
export const sendBulkAttendanceSMS = async (threshold, apiKey) => {
    const res = await axios.post(`${API}/attendance/send-sms-bulk`, { threshold, api_key: apiKey }, tok());
    return res.data;
};

// ─── Fees ─────────────────────────────────────────────────────────────────────
export const getFees = async () => {
    const res = await axios.get(`${API}/fees`, tok());
    return res.data;
};
export const addFee = async (data) => {
    const res = await axios.post(`${API}/fees`, data, tok());
    return res.data;
};
export const updateFee = async (id, data) => {
    const res = await axios.put(`${API}/fees/${id}`, data, tok());
    return res.data;
};
export const deleteFee = async (id) => {
    await axios.delete(`${API}/fees/${id}`, tok());
};
export const markFeePaid = async (id) => {
    await axios.put(`${API}/fees/${id}/pay`, {}, tok());
};
export const sendFeeReminders = async () => {
    const res = await axios.post(`${API}/fees/remind`, {}, tok());
    return res.data;
};

// ─── Assignments ──────────────────────────────────────────────────────────────
export const getAssignments = async () => {
    const res = await axios.get(`${API}/assignments`, tok());
    return res.data;
};
export const createAssignment = async (data) => {
    const res = await axios.post(`${API}/assignments`, data, tok());
    return res.data;
};
export const submitAssignment = async (id, data) => {
    await axios.post(`${API}/assignments/${id}/submit`, data, tok());
};
export const getSubmissions = async (id) => {
    const res = await axios.get(`${API}/assignments/${id}/submissions`, tok());
    return res.data;
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = async () => {
    const res = await axios.get(`${API}/notifications`, tok());
    return res.data;
};
export const sendNotification = async (data) => {
    const res = await axios.post(`${API}/notifications`, data, tok());
    return res.data;
};
export const markNotificationRead = async (id) => {
    await axios.put(`${API}/notifications/${id}/read`, {}, tok());
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
    const res = await axios.get(`${API}/dashboard/stats`, tok());
    return res.data;
};

// ─── Online Classes ───────────────────────────────────────────────────────────
export const getOnlineClasses = async () => {
    const res = await axios.get(`${API}/online-classes`, tok());
    return res.data;
};
export const addOnlineClass = async (data) => {
    const res = await axios.post(`${API}/online-classes`, data, tok());
    return res.data;
};
export const deleteOnlineClass = async (id) => {
    await axios.delete(`${API}/online-classes/${id}`, tok());
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
    { key: 'delegate_permissions', label: 'Delegate Permissions' },
    { key: 'manage_registrations', label: 'Manage Registrations' },
];

export const getTeacherPermissions = async (teacherId) => {
    const res = await axios.get(`${API}/teacher-permissions/${teacherId}`, tok());
    return res.data || {};
};

export const setTeacherPermissions = async (teacherId, permissions) => {
    await axios.post(`${API}/teacher-permissions/${teacherId}`, { permissions }, tok());
};

export const getStudentPermissionsAll = async () => {
    const res = await axios.get(`${API}/student-permissions/all`, tok());
    return res.data || {};
};

export const getStudentPermissions = async (studentId) => {
    const res = await axios.get(`${API}/student-permissions/${studentId}`, tok());
    return res.data || {};
};

export const setStudentPermissions = async (studentId, permissions) => {
    await axios.post(`${API}/student-permissions/${studentId}`, { permissions }, tok());
};

// ─── Alumni ───────────────────────────────────────────────────────────────────
export const getAlumni = async () => {
    const res = await axios.get(`${API}/alumni`, tok());
    return res.data;
};
export const addAlumni = async (formData) => {
    const res = await axios.post(`${API}/alumni`, formData, {
        headers: { ...tok().headers, 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};
export const deleteAlumni = async (id) => {
    await axios.delete(`${API}/alumni/${id}`, tok());
};

// ─── Staff Contacts ───────────────────────────────────────────────────────────
export const getStaffContacts = async () => {
    const res = await axios.get(`${API}/staff-contacts`, tok());
    return res.data;
};
export const addStaffContact = async (data) => {
    const res = await axios.post(`${API}/staff-contacts`, data, tok());
    return res.data;
};
export const deleteStaffContact = async (id) => {
    await axios.delete(`${API}/staff-contacts/${id}`, tok());
};

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const getFeedback = async () => {
    const res = await axios.get(`${API}/feedback`, tok());
    return res.data;
};
export const getFeedbackStats = async () => {
    const res = await axios.get(`${API}/feedback/stats`, tok());
    return res.data;
};
export const submitFeedback = async (data) => {
    await axios.post(`${API}/feedback`, data, tok());
};
export const updateFeedbackStatus = async (id, data) => {
    await axios.put(`${API}/feedback/${id}`, data, tok());
};
export const deleteFeedback = async (id) => {
    await axios.delete(`${API}/feedback/${id}`, tok());
};

// ─── Timetables ───────────────────────────────────────────────────────────────
export const getTimeTables = async (params) => {
    const res = await axios.get(`${API}/timetables`, { ...tok(), params });
    return res.data;
};
export const addTimeTable = async (data) => {
    const res = await axios.post(`${API}/timetables`, data, tok());
    return res.data;
};
export const deleteTimeTable = async (id) => {
    await axios.delete(`${API}/timetables/${id}`, tok());
};

// ─── Semester Registrations ──────────────────────────────────────────────────
export const getRegistrations = async () => {
    const res = await axios.get(`${API}/registrations`, tok());
    return res.data;
};
export const addRegistration = async (data) => {
    const res = await axios.post(`${API}/registrations`, data, tok());
    return res.data;
};
export const updateRegistration = async (id, data) => {
    const res = await axios.put(`${API}/registrations/${id}`, data, tok());
    return res.data;
};
export const deleteRegistration = async (id) => {
    await axios.delete(`${API}/registrations/${id}`, tok());
};

export default api;

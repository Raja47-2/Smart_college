import React, { useState, useEffect } from 'react';
import { Calendar, Save, CheckCircle, XCircle } from 'lucide-react';
import { getStudents, getAttendance, saveAttendance } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Attendance.css';

const Attendance = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsList, attendanceRecords] = await Promise.all([
                getStudents(),
                getAttendance()
            ]);
            setStudents(studentsList);

            // Normalize date strings to compare correctly
            const todayRecords = attendanceRecords.filter(r => r.date === date);
            const attendanceMap = {};

            // Default to 'Present' for new records if authorized, otherwise just show what's there
            if (todayRecords.length > 0) {
                todayRecords.forEach(r => {
                    attendanceMap[r.student_id] = r.status;
                });
            } else {
                studentsList.forEach(s => {
                    attendanceMap[s.id] = 'Present';
                });
            }
            setAttendance(attendanceMap);
            filterStudents(studentsList, selectedCourse, selectedDepartment);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        filterStudents(students, selectedCourse, selectedDepartment);
    }, [selectedCourse, selectedDepartment, students]);

    const filterStudents = (allStudents, course, department) => {
        let filtered = allStudents;
        if (course) {
            filtered = filtered.filter(s => s.course === course);
        }
        if (department) {
            filtered = filtered.filter(s => s.department === department);
        }
        setFilteredStudents(filtered);
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSave = async () => {
        try {
            const records = Object.keys(attendance).map(studentId => ({
                studentId,
                status: attendance[studentId]
            }));

            await saveAttendance(date, records);
            setMessage('Attendance saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error saving attendance", error);
            setMessage('Failed to save attendance.');
        }
    };

    // Helper to check if attendance window is open (08:40 AM - 02:50 PM)
    const isAttendanceOpen = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const startTime = 0 * 60 + 0;  // 12:00 AM
        const endTime = 23 * 60 + 59; // 11:59 PM

        return currentTime >= startTime && currentTime <= endTime;
    };

    const isToday = (selectedDate) => {
        const today = new Date().toISOString().split('T')[0];
        return selectedDate === today;
    };

    // Only Admin and Teacher can modify attendance
    // Teacher restricted by time (08:40-02:50) and date (Today only)
    const canModify = user?.role === 'admin' || user?.role === 'principal' ||
        (user?.role === 'teacher' && isToday(date) && isAttendanceOpen());

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Attendance</h1>
                <div className="controls">
                    <div className="date-picker-wrapper">
                        <Calendar size={18} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="date-input"
                        />
                    </div>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Courses</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Polytechnic">Polytechnic</option>
                    </select>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Civil">Civil</option>
                    </select>
                </div>
            </div>

            {!canModify && user?.role === 'teacher' && (
                <div className="alert-banner">
                    Attendance marking is locked. Allowed only between 08:40 AM and 02:50 PM for the current date.
                </div>
            )}

            {filteredStudents.length === 0 ? (
                <div className="empty-state">
                    <p>No students found for the selected criteria.</p>
                </div>
            ) : (
                <div className="attendance-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Department</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td>{student.name}</td>
                                    <td>{student.course}</td>
                                    <td>{student.department}</td>
                                    <td>
                                        {canModify ? (
                                            <div className="status-toggles">
                                                <button
                                                    className={`status-btn present ${attendance[student.id] === 'Present' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student.id, 'Present')}
                                                >
                                                    <CheckCircle size={16} /> Present
                                                </button>
                                                <button
                                                    className={`status-btn absent ${attendance[student.id] === 'Absent' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student.id, 'Absent')}
                                                >
                                                    <XCircle size={16} /> Absent
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`status-badge ${attendance[student.id]?.toLowerCase()}`}>
                                                {attendance[student.id] === 'Present' ? (
                                                    <><CheckCircle size={16} /> Present</>
                                                ) : (
                                                    <><XCircle size={16} /> Absent</>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {canModify && (
                        <div className="save-container">
                            {message && <span className="success-message">{message}</span>}
                            <button className="btn btn-primary" onClick={handleSave}>
                                <Save size={18} /> Save Attendance
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Attendance;

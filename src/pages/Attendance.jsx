import React, { useState, useEffect } from 'react';
import { Calendar, Save, CheckCircle, XCircle } from 'lucide-react';
import { getStudents, getAttendance, saveAttendance } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Attendance.css';

const Attendance = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

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
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
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

    // Only Admin and Teacher can modify attendance
    const canModify = user?.role === 'admin' || user?.role === 'teacher';

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Attendance</h1>
                <div className="date-picker-wrapper">
                    <Calendar size={18} />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="date-input"
                    />
                </div>
            </div>

            {students.length === 0 ? (
                <div className="empty-state">
                    <p>No students found. Please add students first.</p>
                </div>
            ) : (
                <div className="attendance-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td>{student.name}</td>
                                    <td>{student.course}</td>
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

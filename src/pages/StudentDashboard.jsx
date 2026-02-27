import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getStudents, getAttendance, getFees, getNotifications } from '../services/api';
import { User, Calendar, BookOpen, Clock, Award, Bell } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [studentProfile, setStudentProfile] = useState(null);
    const navigate = useNavigate();
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, total: 0 });
    const [pendingFees, setPendingFees] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadStudentData();
        }
    }, [user]);

    const loadStudentData = async () => {
        try {
            // Fetch students to find my profile
            const students = await getStudents();
            const myProfile = students.find(s => s.email === user.email); // Matching by email for now

            if (myProfile) {
                setStudentProfile(myProfile);

                // Fetch Attendance
                const attendanceData = await getAttendance();
                // Filter my attendance
                const myAttendance = attendanceData.filter(a => a.student_id === myProfile.id);
                const present = myAttendance.filter(a => a.status === 'Present').length;
                const absent = myAttendance.filter(a => a.status === 'Absent').length;
                setAttendanceStats({
                    present,
                    absent,
                    total: myAttendance.length,
                    percentage: myAttendance.length > 0 ? Math.round((present / myAttendance.length) * 100) : 0
                });

                // Fetch Fees
                const feesData = await getFees();
                const myFees = feesData.filter(f => f.student_id === myProfile.id && f.status === 'Pending');
                const totalPending = myFees.reduce((sum, fee) => sum + fee.amount, 0);
                setPendingFees(totalPending);

                // Fetch Notifications count
                const notifData = await getNotifications();
                const myUnread = notifData.filter(n => !n.is_read).length;
                setUnreadNotifications(myUnread);
            }
        } catch (error) {
            console.error("Error loading student data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading Dashboard...</div>;
    if (!studentProfile) return <div className="error">Profile not found. Please contact admin.</div>;

    return (
        <div className="student-dashboard">
            <div className="welcome-section">
                <h1>Welcome, {studentProfile.name}</h1>
                <p>{studentProfile.course} | {studentProfile.year}</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card attendance-card">
                    <div className="stat-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Attendance</h3>
                        <div className="progress-circle">
                            <span className="percentage">{attendanceStats.percentage}%</span>
                        </div>
                        <p>{attendanceStats.present} Present / {attendanceStats.total} Total</p>
                    </div>
                </div>

                <div className="stat-card fees-card">
                    <div className="stat-icon">
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Pending Fees</h3>
                        <div className="amount">${pendingFees}</div>
                        <p>{pendingFees > 0 ? 'Please pay locally' : 'No dues'}</p>
                    </div>
                </div>

                <div className="stat-card notifications-card" onClick={() => navigate('/notifications')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon">
                        <Bell size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Notifications</h3>
                        <div className="amount">{unreadNotifications}</div>
                        <p>{unreadNotifications > 0 ? 'Unread' : 'No new'}</p>
                    </div>
                </div>

                <div className="stat-card assignments-card">
                    <div className="stat-icon">
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Assignments</h3>
                        <div className="amount">0</div>
                        <p>Pending Submissions</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="section timetable">
                    <h2>Timetable (Mock)</h2>
                    <div className="timetable-grid">
                        <div className="day">Mon</div>
                        <div className="subject">Math</div>
                        <div className="subject">Physics</div>
                        <div className="day">Tue</div>
                        <div className="subject">CS</div>
                        <div className="subject">Eng</div>
                    </div>
                </div>

                {/* roadmap section added per user request */}
                <div className="section roadmap">
                    <h2>Roadmap</h2>
                    <div className="roadmap-content">
                        <p>This feature is not yet available.</p>
                        <p className="coming-soon">Coming soon &#x1F4C5;</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;

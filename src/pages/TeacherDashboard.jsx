import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/api';
import { Users, BookOpen, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ students: 0, faculty: 0, feesPending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Error loading stats", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    return (
        <div className="teacher-dashboard">
            <div className="welcome-section">
                <h1>Welcome, {user?.name || 'Teacher'}</h1>
                <p>Faculty Panel</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon students">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Total Students</h3>
                        <div className="value">{stats.students}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon attendance">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Attendance</h3>
                        <Link to="/attendance" className="action-link">Mark Today</Link>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon fees">
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Assignments</h3>
                        <div className="value">0</div>
                        <p>Pending Review</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="section quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="actions-grid">
                        <Link to="/students" className="action-btn">
                            <Users size={20} /> Manage Students
                        </Link>
                        <Link to="/attendance" className="action-btn">
                            <Calendar size={20} /> Take Attendance
                        </Link>
                        {/* Fees might be Admin only, but Teacher see it? */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;

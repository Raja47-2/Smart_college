import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, CalendarCheck, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const CARDS = [
    { key: 'students', title: 'Total Students', icon: Users, color: '#6366f1', accent: 'linear-gradient(90deg, #6366f1, #818cf8)' },
    { key: 'faculty', title: 'Faculty Members', icon: GraduationCap, color: '#10b981', accent: 'linear-gradient(90deg, #10b981, #34d399)' },
    { key: 'attendance', title: "Today's Attendance", icon: CalendarCheck, color: '#f59e0b', accent: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    { key: 'feesPending', title: 'Fees Pending', icon: Wallet, color: '#ef4444', accent: 'linear-gradient(90deg, #ef4444, #f87171)' },
];

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ students: 0, faculty: 0, attendance: 0, feesPending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="loading">Loading Stats...</div>;

    return (
        <div className="dashboard">
            {/* Welcome Banner */}
            <div className="dashboard-banner">
                <h2>Hello, <span className="banner-accent">{user?.name || 'User'}</span> 👋</h2>
                <p>Here's what's happening at Smart College today.</p>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                {CARDS.map(({ key, title, icon: Icon, color, accent }) => (
                    <div className="stat-card" key={key} style={{ '--card-accent': accent }}>
                        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
                            <Icon size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{title}</h3>
                            <p>{key === 'attendance' ? `${stats[key] || 0}%` : stats[key]}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content">
                <div className="recent-activity">
                    <h3>Recent Activity</h3>
                    <div className="empty-state" style={{ paddingTop: '1.5rem' }}>
                        <TrendingUp size={36} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
                        <p>No recent activity to display.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

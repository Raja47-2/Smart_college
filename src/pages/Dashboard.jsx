import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, CalendarCheck, Wallet } from 'lucide-react';
import { getDashboardStats } from '../services/api'; // Import API
import './Dashboard.css';

const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>
            <Icon size={24} />
        </div>
        <div className="stat-info">
            <h3>{title}</h3>
            <p>{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        faculty: 0,
        attendance: 0,
        feesPending: 0
    });
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

    if (loading) return <div className="loading">Loading Stats...</div>;

    return (
        <div className="dashboard">
            <div className="stats-grid">
                <StatCard icon={Users} title="Total Students" value={stats.students} color="#2563eb" />
                <StatCard icon={GraduationCap} title="Faculty Members" value={stats.faculty} color="#10b981" />
                {/* Attendance logic to be refined later if needed, for now keep 0 or server value */}
                <StatCard icon={CalendarCheck} title="Today's Attendance" value={`${stats.attendance || 0}%`} color="#f59e0b" />
                <StatCard icon={Wallet} title="Fees Pending" value={stats.feesPending} color="#ef4444" />
            </div>

            <div className="dashboard-content">
                <div className="recent-activity">
                    <h3>Recent Activity</h3>
                    <p className="empty-state">No recent activity to show.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

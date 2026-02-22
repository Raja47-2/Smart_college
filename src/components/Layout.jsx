import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, CalendarCheck, Wallet, BookOpen, Bell, BarChart2, LogOut, Info, Users2, Phone, Database, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navLink = (to, icon, label, end = false) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="layout">
            <aside className="sidebar">
                {/* Brand */}
                <div className="brand">
                    <div className="brand-logo">
                        <Zap size={20} color="white" />
                    </div>
                    <div>
                        <h1>Smart College</h1>
                        <span>Management System</span>
                    </div>
                </div>

                <nav>
                    {navLink('/', <LayoutDashboard size={19} />, 'Dashboard', true)}

                    {(user?.role === 'admin' || user?.role === 'teacher') && (<>
                        {navLink('/students', <Users size={19} />, 'Students')}
                        {navLink('/faculty', <GraduationCap size={19} />, 'Faculty')}
                    </>)}

                    {navLink('/assignments', <BookOpen size={19} />, 'Assignments')}
                    {navLink('/attendance', <CalendarCheck size={19} />, 'Attendance')}
                    {navLink('/fees', <Wallet size={19} />, 'Fees')}
                    {navLink('/notifications', <Bell size={19} />, 'Notifications')}
                    {navLink('/analytics', <BarChart2 size={19} />, 'Analytics')}
                    {navLink('/attendance-report', <TrendingUp size={19} />, 'Att. Report')}
                    {navLink('/about', <Info size={19} />, 'About')}
                    {navLink('/alumni', <Users2 size={19} />, 'Alumni')}
                    {navLink('/contact', <Phone size={19} />, 'Contact')}
                    {user?.role === 'admin' && navLink('/backup', <Database size={19} />, 'Backup')}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={19} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="header">
                    <h2>👋 Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</strong></h2>
                    <div className="user-profile">
                        <span>{user?.name}</span>
                        <span className="role-badge" data-role={user?.role}>{user?.role}</span>
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;

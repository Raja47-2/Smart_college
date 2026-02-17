import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, CalendarCheck, Wallet, BookOpen, Bell, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="brand">
                    <GraduationCap size={32} color="var(--primary-color)" />
                    <h1>Smart College</h1>
                </div>
                <nav>
                    <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <>
                            <NavLink to="/students" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                                <Users size={20} />
                                <span>Students</span>
                            </NavLink>
                            <NavLink to="/faculty" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                                <GraduationCap size={20} />
                                <span>Faculty</span>
                            </NavLink>
                        </>
                    )}
                    <NavLink to={user?.role === 'student' ? "/assignments" : "/assignments"} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        <BookOpen size={20} />
                        <span>Assignments</span>
                    </NavLink>
                    <NavLink to="/attendance" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        <CalendarCheck size={20} />
                        <span>Attendance</span>
                    </NavLink>
                    <NavLink to="/fees" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        <Wallet size={20} />
                        <span>Fees</span>
                    </NavLink>
                    <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        <Bell size={20} />
                        <span>Notifications</span>
                    </NavLink>
                    <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        <BarChart2 size={20} />
                        <span>Analytics</span>
                    </NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="nav-link logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <header className="header">
                    <h2>Welcome Back, {user?.name || 'User'}</h2>
                    <div className="user-profile">
                        <span className="role-badge">{user?.role}</span>
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

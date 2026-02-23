import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, CalendarCheck, Wallet, BookOpen, Bell, BarChart2, LogOut, Info, Users2, Phone, Database, TrendingUp, Zap, Video, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import './Layout.css';

const navLink = (to, icon, label, end = false, onNav = null) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        onClick={onNav}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); closeSidebar(); };
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const closeSidebar = () => setSidebarOpen(false);


    const isAdmin = user?.role === 'admin';
    const isTeacher = user?.role === 'teacher';
    const isStudent = user?.role === 'student';

    return (
        <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Mobile overlay */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                    {/* Dashboard – everyone */}
                    {navLink('/', <LayoutDashboard size={19} />, 'Dashboard', true)}

                    {/* Students – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('manage_students'))) && <>
                        {navLink('/students', <Users size={19} />, 'Students')}
                    </>}

                    {/* Faculty – admin only */}
                    {isAdmin && navLink('/faculty', <GraduationCap size={19} />, 'Faculty')}

                    {/* Attendance – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('manage_attendance'))) &&
                        navLink('/attendance', <CalendarCheck size={19} />, 'Attendance')
                    }

                    {/* Fees – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('manage_fees'))) &&
                        navLink('/fees', <Wallet size={19} />, 'Fees')
                    }

                    {/* Assignments – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('manage_assignments')) || isStudent) &&
                        navLink('/assignments', <BookOpen size={19} />, 'Assignments')
                    }

                    {/* Notifications – admin always, teacher if granted, student always */}
                    {(isAdmin || (isTeacher && hasPermission('manage_notifications')) || isStudent) &&
                        navLink('/notifications', <Bell size={19} />, 'Notifications')
                    }

                    {/* Analytics – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('view_analytics'))) &&
                        navLink('/analytics', <BarChart2 size={19} />, 'Analytics')
                    }

                    {/* Attendance Report – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('view_reports'))) &&
                        navLink('/attendance-report', <TrendingUp size={19} />, 'Att. Report')
                    }

                    {/* Online Classes – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('manage_online_classes'))) &&
                        navLink('/online-classes', <Video size={19} />, 'Online Classes')
                    }

                    {/* Static pages – everyone */}
                    {navLink('/about', <Info size={19} />, 'About')}
                    {navLink('/alumni', <Users2 size={19} />, 'Alumni')}
                    {navLink('/contact', <Phone size={19} />, 'Contact')}

                    {/* Admin-only */}
                    {isAdmin && navLink('/permissions', <ShieldCheck size={19} />, 'Permissions')}
                    {isAdmin && navLink('/backup', <Database size={19} />, 'Backup')}
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
                    <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
                        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
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


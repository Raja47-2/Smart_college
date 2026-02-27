import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, Calendar, CalendarCheck, Wallet, BookOpen, Bell, BarChart2, LogOut, Info, Users2, Phone, Database, TrendingUp, Zap, Video, ShieldCheck, Menu, X, Key, BellDot, MessageSquare, ShieldAlert, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getNotifications } from '../services/api';
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
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        }
    }, [user, location.pathname]);

    const fetchUnreadCount = async () => {
        try {
            const data = await getNotifications();
            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch notifications count', err);
        }
    };
    const closeSidebar = () => setSidebarOpen(false);
    const handleLogout = () => { logout(); navigate('/login'); closeSidebar(); };


    const isAdmin = user?.role === 'admin';
    const isPrincipal = user?.role === 'principal';
    const isTeacher = user?.role === 'teacher';
    const isStudent = user?.role === 'student';

    const canSeeAdminMenu = isAdmin || isPrincipal;

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
                    {/* 1. Dashboard */}
                    {navLink('/', <LayoutDashboard size={19} />, 'Dashboard', true, closeSidebar)}

                    {/* Student Dashboard (direct link for students) */}
                    {isStudent && navLink('/student-dashboard', <GraduationCap size={19} />, 'Student Dashboard', false, closeSidebar)}

                    {/* 2. Students */}
                    {(isAdmin || (isTeacher && hasPermission('manage_students'))) &&
                        navLink('/students', <Users size={19} />, 'Students', false, closeSidebar)
                    }

                    {/* 3. Faculty */}
                    {canSeeAdminMenu && navLink('/faculty', <GraduationCap size={19} />, 'Faculty', false, closeSidebar)}

                    {/* 4. Registration */}
                    {(canSeeAdminMenu || isTeacher) &&
                        navLink('/registration', <BookOpen size={19} />, 'Registration', false, closeSidebar)
                    }

                    {/* 5. Time Table */}
                    {navLink('/timetable', <Calendar size={19} />, 'Time Table', false, closeSidebar)}

                    {/* 6. Attendance */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_attendance'))) &&
                        navLink('/attendance', <CalendarCheck size={19} />, 'Attendance', false, closeSidebar)
                    }

                    {/* 7. Low Attendance Alert */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_attendance'))) &&
                        navLink('/attendance-alert', <BellDot size={19} />, 'Low Att. Alert', false, closeSidebar)
                    }

                    {/* 8. Attendance Report */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('view_reports'))) &&
                        navLink('/attendance-report', <TrendingUp size={19} />, 'Att. Report', false, closeSidebar)
                    }

                    {/* 9. Assignments */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_assignments')) || isStudent) &&
                        navLink('/assignments', <BookOpen size={19} />, 'Assignments', false, closeSidebar)
                    }

                    {/* 10. Online Classes */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_online_classes'))) &&
                        navLink('/online-classes', <Video size={19} />, 'Online Classes', false, closeSidebar)
                    }

                    {/* 11. Fees */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_fees'))) &&
                        navLink('/fees', <Wallet size={19} />, 'Fees', false, closeSidebar)
                    }

                    {/* 12. Notifications */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_notifications')) || isStudent) && (
                        <NavLink
                            to="/notifications"
                            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            onClick={closeSidebar}
                        >
                            <div className="nav-icon-wrapper">
                                <Bell size={19} />
                                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            </div>
                            <span>Notifications</span>
                        </NavLink>
                    )}

                    {/* 13. AI Assistant */}
                    {navLink('/ai-doubt', <Lightbulb size={19} />, 'AI Assistant', false, closeSidebar)}

                    {/* 14. Feedback */}
                    {navLink('/feedback', <MessageSquare size={19} />, 'Feedback', false, closeSidebar)}

                    {/* 15. Alumni */}
                    {navLink('/alumni', <Users2 size={19} />, 'Alumni', false, closeSidebar)}

                    {/* 16. Permissions */}
                    {canSeeAdminMenu && navLink('/permissions', <ShieldCheck size={19} />, 'Permissions', false, closeSidebar)}

                    {/* 17. Student Permissions */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('delegate_permissions'))) &&
                        navLink('/student-permissions', <ShieldAlert size={19} />, 'Student Perms', false, closeSidebar)
                    }

                    {/* 18. Passwords */}
                    {canSeeAdminMenu && navLink('/change-password', <Key size={19} />, 'Passwords', false, closeSidebar)}

                    {/* 19. Backup */}
                    {canSeeAdminMenu && navLink('/backup', <Database size={19} />, 'Backup', false, closeSidebar)}

                    {/* 20. About */}
                    {navLink('/about', <Info size={19} />, 'About', false, closeSidebar)}

                    {/* 21. Contact */}
                    {navLink('/contact', <Phone size={19} />, 'Contact', false, closeSidebar)}
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
                    <div className="header-right">
                        <div className="user-profile">
                            <span>{user?.name}</span>
                            <span className="role-badge" data-role={user?.role}>
                                {user?.role === 'admin' || user?.role === 'principal' ? 'Administrator' : user?.role}
                            </span>
                        </div>
                        <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
                            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="mobile-bottom-nav">
                    <NavLink to="/" end className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={closeSidebar}>
                        <LayoutDashboard size={20} />
                        <span>Home</span>
                    </NavLink>

                    {isStudent ? (
                        <NavLink to="/assignments" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={closeSidebar}>
                            <BookOpen size={20} />
                            <span>Work</span>
                        </NavLink>
                    ) : (
                        <NavLink to="/students" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={closeSidebar}>
                            <Users size={20} />
                            <span>Students</span>
                        </NavLink>
                    )}

                    <NavLink to="/notifications" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={closeSidebar}>
                        <div className="nav-icon-wrapper">
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </div>
                        <span>Alerts</span>
                    </NavLink>

                    <button className={`mobile-nav-item ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu size={20} />
                        <span>Menu</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Layout;


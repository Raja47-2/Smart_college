import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, Calendar, CalendarCheck, Wallet, BookOpen, Bell, BarChart2, LogOut, Info, Users2, Phone, Database, TrendingUp, Zap, Video, ShieldCheck, Menu, X, Key, BellDot, MessageSquare, ShieldAlert } from 'lucide-react';
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

    const [sidebarOpen, setSidebarOpen] = useState(false);
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
                    {/* Dashboard – everyone */}
                    {navLink('/', <LayoutDashboard size={19} />, 'Dashboard', true, closeSidebar)}

                    {/* Students – admin always, teacher if granted */}
                    {(isAdmin || (isTeacher && hasPermission('manage_students'))) && <>
                        {navLink('/students', <Users size={19} />, 'Students', false, closeSidebar)}
                    </>}

                    {/* Faculty – admin/principal only */}
                    {canSeeAdminMenu && navLink('/faculty', <GraduationCap size={19} />, 'Faculty', false, closeSidebar)}

                    {/* Time Table – everyone */}
                    {navLink('/timetable', <Calendar size={19} />, 'Time Table', false, closeSidebar)}

                    {/* Student Permissions – admins or teachers with delegation right */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('delegate_permissions'))) &&
                        navLink('/student-permissions', <ShieldAlert size={19} />, 'Student Perms', false, closeSidebar)
                    }

                    {/* Attendance – admin/principal always, teacher if granted */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_attendance'))) &&
                        navLink('/attendance', <CalendarCheck size={19} />, 'Attendance', false, closeSidebar)
                    }

                    {/* Registration — admin/principal/teacher */}
                    {(canSeeAdminMenu || isTeacher) &&
                        navLink('/registration', <BookOpen size={19} />, 'Registration', false, closeSidebar)
                    }

                    {/* Fees – admin/principal always, teacher if granted */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_fees'))) &&
                        navLink('/fees', <Wallet size={19} />, 'Fees', false, closeSidebar)
                    }

                    {/* Assignments – admin/principal always, teacher if granted */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_assignments')) || isStudent) &&
                        navLink('/assignments', <BookOpen size={19} />, 'Assignments', false, closeSidebar)
                    }

                    {/* Notifications – admin/principal always, teacher if granted, student always */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_notifications')) || isStudent) &&
                        navLink('/notifications', <Bell size={19} />, 'Notifications', false, closeSidebar)
                    }

                    {/* Analytics – admin/principal always, teacher if granted */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('view_analytics'))) &&
                        navLink('/analytics', <BarChart2 size={19} />, 'Analytics', false, closeSidebar)
                    }

                    {/* Attendance Report – admin/principal always, teacher if granted */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('view_reports'))) &&
                        navLink('/attendance-report', <TrendingUp size={19} />, 'Att. Report', false, closeSidebar)
                    }

                    {/* Attendance Alert – admin/principal always, teacher if granted */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_attendance'))) &&
                        navLink('/attendance-alert', <BellDot size={19} />, 'Low Att. Alert', false, closeSidebar)
                    }

                    {/* Online Classes – admin/principal always, teacher if granted */}
                    {(canSeeAdminMenu || (isTeacher && hasPermission('manage_online_classes'))) &&
                        navLink('/online-classes', <Video size={19} />, 'Online Classes', false, closeSidebar)
                    }

                    {/* Static pages – everyone */}
                    {navLink('/about', <Info size={19} />, 'About', false, closeSidebar)}
                    {navLink('/alumni', <Users2 size={19} />, 'Alumni', false, closeSidebar)}
                    {navLink('/contact', <Phone size={19} />, 'Contact', false, closeSidebar)}
                    {navLink('/feedback', <MessageSquare size={19} />, 'Feedback', false, closeSidebar)}

                    {/* Admin/Principal-only */}
                    {canSeeAdminMenu && navLink('/permissions', <ShieldCheck size={19} />, 'Permissions', false, closeSidebar)}
                    {canSeeAdminMenu && navLink('/change-password', <Key size={19} />, 'Passwords', false, closeSidebar)}
                    {canSeeAdminMenu && navLink('/backup', <Database size={19} />, 'Backup', false, closeSidebar)}
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
                        <Bell size={20} />
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


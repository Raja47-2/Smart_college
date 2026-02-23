import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, ToggleLeft, ToggleRight, RefreshCw, CheckCircle } from 'lucide-react';
import { getFaculty, getTeacherPermissions, setTeacherPermissions, ALL_PERMISSIONS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Permissions.css';

const Permissions = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [permissions, setPermissions] = useState({});  // { teacherId: { key: bool } }
    const [saved, setSaved] = useState(null); // teacherId that was just saved

    // Redirect non-admins
    useEffect(() => {
        if (user && user.role !== 'admin') navigate('/');
    }, [user, navigate]);

    // Load teachers + their permissions
    useEffect(() => {
        getFaculty().then(faculty => {
            setTeachers(faculty);
            const map = {};
            faculty.forEach(f => {
                map[String(f.id)] = getTeacherPermissions(f.id);
            });
            setPermissions(map);
        });
    }, []);

    const togglePerm = (teacherId, key) => {
        const tid = String(teacherId);
        setPermissions(prev => ({
            ...prev,
            [tid]: {
                ...prev[tid],
                [key]: !prev[tid]?.[key],
            }
        }));
    };

    const grantAll = (teacherId) => {
        const tid = String(teacherId);
        const all = {};
        ALL_PERMISSIONS.forEach(p => all[p.key] = true);
        setPermissions(prev => ({ ...prev, [tid]: all }));
    };

    const revokeAll = (teacherId) => {
        const tid = String(teacherId);
        setPermissions(prev => ({ ...prev, [tid]: {} }));
    };

    const savePerms = (teacherId) => {
        setTeacherPermissions(teacherId, permissions[String(teacherId)] || {});
        setSaved(teacherId);
        setTimeout(() => setSaved(null), 2000);
    };

    if (teachers.length === 0) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1><ShieldCheck size={22} /> Teacher Permissions</h1>
                </div>
                <div className="perm-empty">
                    <Users size={48} opacity={0.25} />
                    <p>No faculty added yet.</p>
                    <p className="sub">Add teachers first via the <strong>Faculty</strong> section, then manage their permissions here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><ShieldCheck size={22} /> Teacher Permissions</h1>
                <p className="page-subtitle">Grant or revoke section access for each teacher</p>
            </div>

            <div className="perm-grid">
                {teachers.map(teacher => {
                    const tid = String(teacher.id);
                    const perms = permissions[tid] || {};
                    const grantedCount = ALL_PERMISSIONS.filter(p => perms[p.key]).length;

                    return (
                        <div key={tid} className="perm-card">
                            {/* Teacher header */}
                            <div className="perm-card-header">
                                <div className="perm-avatar">
                                    {(teacher.name || 'T').charAt(0).toUpperCase()}
                                </div>
                                <div className="perm-teacher-info">
                                    <h3>{teacher.name}</h3>
                                    <span>{teacher.email || teacher.department || 'Faculty'}</span>
                                </div>
                                <div className="perm-count">
                                    <span>{grantedCount}</span>
                                    <small>/ {ALL_PERMISSIONS.length}</small>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="perm-progress">
                                <div
                                    className="perm-progress-fill"
                                    style={{ width: `${(grantedCount / ALL_PERMISSIONS.length) * 100}%` }}
                                />
                            </div>

                            {/* Toggles */}
                            <div className="perm-toggles">
                                {ALL_PERMISSIONS.map(({ key, label }) => {
                                    const enabled = !!perms[key];
                                    return (
                                        <div
                                            key={key}
                                            className={`perm-toggle-row ${enabled ? 'enabled' : ''}`}
                                            onClick={() => togglePerm(tid, key)}
                                        >
                                            <span className="perm-label">{label}</span>
                                            {enabled
                                                ? <ToggleRight size={26} className="toggle-icon on" />
                                                : <ToggleLeft size={26} className="toggle-icon off" />
                                            }
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="perm-actions">
                                <button className="btn-text grant" onClick={() => grantAll(tid)}>Grant All</button>
                                <button className="btn-text revoke" onClick={() => revokeAll(tid)}>Revoke All</button>
                                <button
                                    className={`btn btn-primary perm-save-btn ${saved === teacher.id ? 'saved' : ''}`}
                                    onClick={() => savePerms(teacher.id)}
                                >
                                    {saved === teacher.id
                                        ? <><CheckCircle size={15} /> Saved!</>
                                        : <><RefreshCw size={15} /> Save</>
                                    }
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Permissions;

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, ToggleLeft, ToggleRight, RefreshCw, CheckCircle, Search } from 'lucide-react';
import { getStudents, getStudentPermissionsAll, setStudentPermissions, ALL_PERMISSIONS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import './StudentPermissions.css';

const StudentPermissions = () => {
    const { user } = useAuth();
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [allPermissions, setAllPermissions] = useState({}); // { studentId: { key: bool } }
    const [searchTerm, setSearchTerm] = useState('');
    const [saved, setSaved] = useState(null);
    const [loading, setLoading] = useState(true);

    // Authorization: Admin, Principal, or Teacher with delegate_permissions
    useEffect(() => {
        if (user) {
            const canAccess = user.role === 'admin' || user.role === 'principal' || hasPermission('delegate_permissions');
            if (!canAccess) navigate('/');
        }
    }, [user, navigate, hasPermission]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentList, permsMap] = await Promise.all([
                getStudents(),
                getStudentPermissionsAll()
            ]);
            setStudents(studentList);
            setAllPermissions(permsMap);
        } catch (e) {
            console.error('Error loading permissions:', e);
        } finally {
            setLoading(false);
        }
    };

    const togglePerm = (studentId, key) => {
        const sid = String(studentId);
        setAllPermissions(prev => ({
            ...prev,
            [sid]: {
                ...prev[sid],
                [key]: !prev[sid]?.[key],
            }
        }));
    };

    const grantAll = (studentId) => {
        const sid = String(studentId);
        const all = {};
        ALL_PERMISSIONS.forEach(p => all[p.key] = true);
        setAllPermissions(prev => ({ ...prev, [sid]: all }));
    };

    const revokeAll = (studentId) => {
        const sid = String(studentId);
        setAllPermissions(prev => ({ ...prev, [sid]: {} }));
    };

    const savePerms = async (studentId) => {
        try {
            await setStudentPermissions(studentId, allPermissions[String(studentId)] || {});
            setSaved(studentId);
            setTimeout(() => setSaved(null), 2000);
        } catch (e) {
            alert('Failed to save permissions');
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page-container sp-page">
            <div className="page-header">
                <h1><ShieldAlert size={22} /> Student Permissions</h1>
                <p className="page-subtitle">Delegate management tasks to responsible students</p>
            </div>

            <div className="sp-search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Search by name, reg no, or department..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="perm-grid">
                {filteredStudents.length === 0 ? (
                    <div className="perm-empty">No students found.</div>
                ) : (
                    filteredStudents.map(student => {
                        const sid = String(student.user_id);
                        const perms = allPermissions[sid] || {};
                        const grantedCount = ALL_PERMISSIONS.filter(p => perms[p.key]).length;

                        return (
                            <div key={student.id} className="perm-card">
                                <div className="perm-card-header">
                                    <div className="perm-avatar student">
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="perm-teacher-info">
                                        <h3>{student.name}</h3>
                                        <span>{student.department} ({student.year})</span>
                                        <small>{student.registration_no}</small>
                                    </div>
                                    <div className="perm-count">
                                        <span>{grantedCount}</span>
                                        <small>/ {ALL_PERMISSIONS.length}</small>
                                    </div>
                                </div>

                                <div className="perm-progress">
                                    <div
                                        className="perm-progress-fill student"
                                        style={{ width: `${(grantedCount / ALL_PERMISSIONS.length) * 100}%` }}
                                    />
                                </div>

                                <div className="perm-toggles">
                                    {ALL_PERMISSIONS.map(({ key, label }) => {
                                        const enabled = !!perms[key];
                                        return (
                                            <div
                                                key={key}
                                                className={`perm-toggle-row ${enabled ? 'enabled' : ''}`}
                                                onClick={() => togglePerm(student.user_id, key)}
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

                                <div className="perm-actions">
                                    <button className="btn-text grant" onClick={() => grantAll(student.user_id)}>Grant All</button>
                                    <button className="btn-text revoke" onClick={() => revokeAll(student.user_id)}>Revoke All</button>
                                    <button
                                        className={`btn btn-primary perm-save-btn ${saved === student.user_id ? 'saved' : ''}`}
                                        onClick={() => savePerms(student.user_id)}
                                    >
                                        {saved === student.user_id
                                            ? <><CheckCircle size={15} /> Saved!</>
                                            : <><RefreshCw size={15} /> Save</>
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentPermissions;

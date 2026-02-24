import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, Search, Eye, EyeOff, CheckCircle, User2, GraduationCap, Users } from 'lucide-react';
import axios from 'axios';
import './ChangePassword.css';

const API = 'http://localhost:5000/api';

const roleIcon = (role) => {
    if (role === 'teacher') return <GraduationCap size={16} />;
    if (role === 'student') return <Users size={16} />;
    return <User2 size={16} />;
};

const ChangePassword = () => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [newPwd, setNewPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { loadUsers(); }, []);

    useEffect(() => {
        let list = users;
        if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
        if (search.trim()) list = list.filter(u =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(list);
    }, [search, roleFilter, users]);

    const loadUsers = async () => {
        try {
            const res = await axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
            // Admin can't change their own password from here — filter out admins except show name
            setUsers(res.data.filter(u => u.role !== 'admin'));
        } catch (e) {
            setError('Failed to load users: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError(''); setSuccess('');
        if (!selected) return;
        if (!newPwd || newPwd.length < 4) { setError('Password must be at least 4 characters'); return; }
        setSaving(true);
        try {
            await axios.put(`${API}/users/${selected.id}/password`, { newPassword: newPwd }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`Password for ${selected.name} changed successfully!`);
            setNewPwd('');
            setSelected(null);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const roleColors = {
        student: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
        teacher: { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.2)' },
    };

    if (user?.role !== 'admin') {
        return (
            <div className="page-container">
                <div className="empty-state">🔒 Admin access only.</div>
            </div>
        );
    }

    if (loading) return <div className="loading">Loading users...</div>;

    return (
        <div className="page-container chpwd-page">
            <div className="page-header">
                <h1><Key size={24} /> Password Manager</h1>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                    <CheckCircle size={18} /> {success}
                </div>
            )}
            {error && (
                <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                    {error}
                </div>
            )}

            <div className="chpwd-layout">
                {/* Left panel – user list */}
                <div className="chpwd-list-panel">
                    <div className="chpwd-search-bar">
                        <div className="search-bar" style={{ maxWidth: '100%' }}>
                            <Search size={16} className="search-icon" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name or email…"
                            />
                        </div>
                        <div className="role-tabs">
                            {['all', 'student', 'teacher'].map(r => (
                                <button
                                    key={r}
                                    className={`role-tab ${roleFilter === r ? 'active' : ''}`}
                                    onClick={() => setRoleFilter(r)}
                                >
                                    {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="chpwd-user-list">
                        {filtered.length === 0 ? (
                            <div className="empty-state" style={{ padding: '2rem' }}><p>No users found.</p></div>
                        ) : filtered.map(u => (
                            <button
                                key={u.id}
                                className={`chpwd-user-item ${selected?.id === u.id ? 'selected' : ''}`}
                                onClick={() => { setSelected(u); setNewPwd(''); setSuccess(''); setError(''); }}
                            >
                                <div className="chpwd-avatar" style={{ background: roleColors[u.role]?.bg, color: roleColors[u.role]?.color, border: `1px solid ${roleColors[u.role]?.border}` }}>
                                    {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="chpwd-user-info">
                                    <span className="chpwd-name">{u.name}</span>
                                    <span className="chpwd-email">{u.email}</span>
                                </div>
                                <span className="chpwd-role-badge" style={{ background: roleColors[u.role]?.bg, color: roleColors[u.role]?.color, border: `1px solid ${roleColors[u.role]?.border}` }}>
                                    {roleIcon(u.role)} {u.role}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right panel – change form */}
                <div className="chpwd-form-panel">
                    {!selected ? (
                        <div className="chpwd-placeholder">
                            <Key size={48} style={{ opacity: 0.15 }} />
                            <p>Select a user from the list to change their password</p>
                        </div>
                    ) : (
                        <div className="chpwd-form">
                            <div className="chpwd-form-header">
                                <div className="chpwd-form-avatar" style={{ background: roleColors[selected.role]?.bg, color: roleColors[selected.role]?.color }}>
                                    {selected.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2>{selected.name}</h2>
                                    <span>{selected.email}</span>
                                    <span className="chpwd-role-badge small" style={{ background: roleColors[selected.role]?.bg, color: roleColors[selected.role]?.color, border: `1px solid ${roleColors[selected.role]?.border}`, marginLeft: '0.5rem' }}>
                                        {selected.role}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '2rem' }}>
                                <label>New Password</label>
                                <div className="pwd-input-wrapper">
                                    <input
                                        type={showPwd ? 'text' : 'password'}
                                        placeholder="Enter new password (min 4 chars)"
                                        value={newPwd}
                                        onChange={e => setNewPwd(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                                        autoFocus
                                    />
                                    <button className="pwd-toggle" onClick={() => setShowPwd(p => !p)} type="button">
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Strength indicator */}
                            <div className="pwd-strength">
                                {[4, 7, 10].map((min, i) => (
                                    <div key={i} className={`pwd-bar ${newPwd.length >= min ? ['weak', 'medium', 'strong'][i] : ''}`} />
                                ))}
                                <span className="pwd-strength-label">
                                    {newPwd.length === 0 ? '' : newPwd.length < 4 ? 'Too short' : newPwd.length < 7 ? 'Weak' : newPwd.length < 10 ? 'Medium' : 'Strong'}
                                </span>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', padding: '0.8rem' }}
                                onClick={handleSave}
                                disabled={saving || !newPwd}
                            >
                                {saving ? 'Saving…' : <><Key size={16} /> Set Password</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;

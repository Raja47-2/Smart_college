import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Send, MessageSquare, AlertTriangle, CheckCircle, Clock, Settings, RefreshCw, Users, Smartphone } from 'lucide-react';
import './AttendanceAlert.css';

const API = 'http://localhost:5000/api';
const UPLOADS = 'http://localhost:5000';
const TOKEN = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${TOKEN()}` });

const AttendanceAlert = () => {
    const [students, setStudents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(75);
    const [sending, setSending] = useState({}); // { [studentId]: true }
    const [bulkSending, setBulkSending] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('fast2sms_key') || '');
    const [showSettings, setShowSettings] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'logs'

    useEffect(() => { loadData(); }, [threshold]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [alertRes, logRes] = await Promise.all([
                axios.get(`${API}/attendance/low-alert?threshold=${threshold}`, { headers: headers() }),
                axios.get(`${API}/sms-logs?limit=50`, { headers: headers() }),
            ]);
            setStudents(alertRes.data);
            setLogs(logRes.data);
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const sendSMS = async (s) => {
        if (!s.parent_mobile) {
            showToast(`No parent mobile set for ${s.name}. Edit student profile first.`, 'error');
            return;
        }
        setSending(p => ({ ...p, [s.id]: true }));
        try {
            const res = await axios.post(`${API}/attendance/send-sms`, {
                student_id: s.id,
                student_name: s.name,
                parent_mobile: s.parent_mobile,
                attendance_pct: s.attendance_pct,
                api_key: apiKey || 'DEMO',
            }, { headers: headers() });
            const isDemo = res.data.sms_status === 'simulated';
            showToast(`${isDemo ? '📱 Simulated' : '✅ Sent'} SMS to parent of ${s.name}`, isDemo ? 'info' : 'success');
            loadData();
        } catch (e) {
            showToast(e.response?.data?.error || 'SMS failed', 'error');
        } finally {
            setSending(p => ({ ...p, [s.id]: false }));
        }
    };

    const sendBulk = async () => {
        if (!window.confirm(`Send SMS alerts to ALL ${students.length} low-attendance students?`)) return;
        setBulkSending(true);
        try {
            const res = await axios.post(`${API}/attendance/send-sms-bulk`, {
                threshold,
                api_key: apiKey || 'DEMO',
            }, { headers: headers() });
            showToast(`Bulk done: ${res.data.sent} sent, ${res.data.skipped} skipped (no mobile), ${res.data.failed} failed`);
            loadData();
        } catch (e) {
            showToast(e.response?.data?.error || 'Bulk send failed', 'error');
        } finally {
            setBulkSending(false);
        }
    };

    const saveApiKey = () => {
        localStorage.setItem('fast2sms_key', apiKey);
        setShowSettings(false);
        showToast('API key saved');
    };

    const pctColor = (pct) => {
        if (pct < 50) return '#ef4444';
        if (pct < 65) return '#f97316';
        return '#f59e0b';
    };

    return (
        <div className="page-container alert-page">
            {/* Toast */}
            {toast && (
                <div className={`att-toast att-toast-${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : toast.type === 'error' ? <AlertTriangle size={16} /> : <Bell size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Settings modal */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <div className="modal-header"><h2><Settings size={20} /> SMS Settings</h2></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Fast2SMS API Key</label>
                                <input
                                    type="text"
                                    placeholder="Leave blank to use Simulation mode"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                    Get your key at <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>fast2sms.com</a>.  Leave blank to run in <strong>simulation mode</strong> (no real SMS sent, useful for testing).
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveApiKey}>Save Key</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="page-header">
                <h1><Bell size={22} /> Low Attendance Alerts</h1>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
                        <Settings size={16} /> SMS Settings
                    </button>
                    <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    {students.length > 0 && (
                        <button className="btn btn-danger" onClick={sendBulk} disabled={bulkSending}>
                            <Send size={16} /> {bulkSending ? 'Sending…' : `Send All (${students.length})`}
                        </button>
                    )}
                </div>
            </div>

            {/* Summary stats */}
            <div className="alert-stats">
                <div className="alert-stat-card critical">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>{students.filter(s => s.attendance_pct < 50).length}</strong>
                        <span>Critical (&lt;50%)</span>
                    </div>
                </div>
                <div className="alert-stat-card warning">
                    <Bell size={20} />
                    <div>
                        <strong>{students.filter(s => s.attendance_pct >= 50 && s.attendance_pct < 65).length}</strong>
                        <span>Warning (50–65%)</span>
                    </div>
                </div>
                <div className="alert-stat-card low">
                    <Clock size={20} />
                    <div>
                        <strong>{students.filter(s => s.attendance_pct >= 65).length}</strong>
                        <span>Low (65–{threshold}%)</span>
                    </div>
                </div>
                <div className="alert-stat-card no-mobile">
                    <Smartphone size={20} />
                    <div>
                        <strong>{students.filter(s => !s.parent_mobile).length}</strong>
                        <span>No Parent Mobile</span>
                    </div>
                </div>
            </div>

            {/* Threshold control */}
            <div className="threshold-bar">
                <label><AlertTriangle size={14} /> Alert threshold:</label>
                <input
                    type="range" min="40" max="90" step="5"
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    style={{ flex: 1, maxWidth: 200 }}
                />
                <span className="threshold-val">{threshold}%</span>
                <span className="threshold-desc">Showing Regular students below {threshold}% attendance</span>
            </div>

            {/* Tabs */}
            <div className="alert-tabs">
                <button className={`alert-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
                    <Users size={15} /> Students ({students.length})
                </button>
                <button className={`alert-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                    <MessageSquare size={15} /> SMS History ({logs.length})
                </button>
            </div>

            {/* ALERTS TAB */}
            {activeTab === 'alerts' && (
                <div className="table-container">
                    {loading ? (
                        <div className="loading">Calculating attendance…</div>
                    ) : students.length === 0 ? (
                        <div className="empty-state">
                            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '0.75rem' }} />
                            <p style={{ color: '#10b981', fontWeight: 600 }}>All Regular students have attendance ≥ {threshold}% 🎉</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Branch / Year</th>
                                    <th>Attendance</th>
                                    <th>Days Present / Total</th>
                                    <th>Parent Mobile</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id} className={s.attendance_pct < 50 ? 'critical-row' : s.attendance_pct < 65 ? 'warning-row' : ''}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                                {s.photo_url
                                                    ? <img src={`${UPLOADS}${s.photo_url}`} alt={s.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${pctColor(s.attendance_pct)}` }} />
                                                    : <div className="student-avatar" style={{ background: pctColor(s.attendance_pct) + '22', color: pctColor(s.attendance_pct), border: `2px solid ${pctColor(s.attendance_pct)}` }}>{s.name?.charAt(0)}</div>
                                                }
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.registration_no}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.department}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.course} · {s.year}</div>
                                        </td>
                                        <td>
                                            <div className="att-pct-bar">
                                                <div className="att-pct-fill" style={{ width: `${s.attendance_pct}%`, background: pctColor(s.attendance_pct) }} />
                                            </div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: pctColor(s.attendance_pct) }}>{s.attendance_pct}%</span>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {s.present_days} / {s.total_days} days
                                        </td>
                                        <td>
                                            {s.parent_mobile
                                                ? <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{s.parent_mobile}</span>
                                                : <span style={{ fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic' }}>Not set — edit student</span>
                                            }
                                        </td>
                                        <td>
                                            <button
                                                className={`btn btn-sm ${s.parent_mobile ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => sendSMS(s)}
                                                disabled={sending[s.id]}
                                                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                            >
                                                {sending[s.id] ? '…' : <><Send size={13} /> Send SMS</>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
                <div className="table-container">
                    {logs.length === 0 ? (
                        <div className="empty-state"><p>No SMS alerts sent yet.</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Parent Mobile</th>
                                    <th>Attendance</th>
                                    <th>Month</th>
                                    <th>Status</th>
                                    <th>Sent At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 600 }}>{l.student_name}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{l.parent_mobile}</td>
                                        <td style={{ color: pctColor(l.attendance_pct), fontWeight: 700 }}>{l.attendance_pct}%</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{l.month}</td>
                                        <td>
                                            <span className={`badge ${l.status === 'sent' ? 'badge-success' : l.status === 'simulated' ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.sent_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Info box about simulation */}
            {!apiKey && (
                <div className="alert-info-box">
                    <Bell size={16} />
                    <div>
                        <strong>Simulation Mode Active</strong> — SMS will be logged but not actually sent to phone.
                        Click <strong>SMS Settings</strong> and enter your Fast2SMS API key to send real SMS messages.
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceAlert;

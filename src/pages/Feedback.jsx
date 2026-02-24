import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, CheckCircle, Clock, AlertTriangle, Filter, Eye, Trash2, Reply, User, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFeedback, getFeedbackStats, submitFeedback, updateFeedbackStatus, deleteFeedback } from '../services/api';
import './Feedback.css';

const CATEGORIES = ['General', 'Academic', 'Faculty', 'Facilities', 'Administration', 'Technical', 'Other'];
const STATUS_COLORS = { pending: '#f59e0b', reviewed: '#6366f1', resolved: '#10b981' };
const STATUS_BADGES = { pending: 'badge-warning', reviewed: 'badge-primary', resolved: 'badge-success' };

const StarRating = ({ value, onChange }) => (
    <div className="star-row">
        {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" className={`star-btn ${n <= value ? 'filled' : ''}`} onClick={() => onChange && onChange(n)}>★</button>
        ))}
        {value > 0 && onChange && <span className="star-label">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}</span>}
    </div>
);

const Feedback = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'principal';

    /* ── shared ── */
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    /* ── admin ── */
    const [stats, setStats] = useState({});
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyStatus, setReplyStatus] = useState('reviewed');
    const [saving, setSaving] = useState(false);

    /* ── student/teacher form ── */
    const [form, setForm] = useState({ category: 'General', subject: '', message: '', rating: 0, is_anonymous: false });
    const [submitting, setSubmitting] = useState(false);
    const [tab, setTab] = useState(isAdmin ? 'review' : 'submit'); // 'submit' | 'my' | 'review'

    const toast_ = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getFeedback();
            setFeedbacks(data);
            if (isAdmin) {
                const s = await getFeedbackStats();
                setStats(s);
            }
        } catch (e) { toast_(e.response?.data?.error || 'Load failed', 'error'); }
        finally { setLoading(false); }
    };

    /* ── SUBMIT FEEDBACK ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.message.trim()) { toast_('Subject and message are required', 'error'); return; }
        setSubmitting(true);
        try {
            await submitFeedback(form);
            toast_('✅ Feedback submitted! Thank you.');
            setForm({ category: 'General', subject: '', message: '', rating: 0, is_anonymous: false });
            load();
            setTab('my');
        } catch (e) { toast_(e.response?.data?.error || 'Submit failed', 'error'); }
        finally { setSubmitting(false); }
    };

    /* ── ADMIN REPLY ── */
    const handleReply = async () => {
        setSaving(true);
        try {
            await updateFeedbackStatus(selected.id, { status: replyStatus, admin_reply: replyText });
            toast_('Reply sent & status updated');
            setSelected(null); setReplyText('');
            load();
        } catch (e) { toast_(e.response?.data?.error || 'Update failed', 'error'); }
        finally { setSaving(false); }
    };

    /* ── ADMIN DELETE ── */
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this feedback?')) return;
        try {
            await deleteFeedback(id);
            toast_('Deleted');
            if (selected?.id === id) setSelected(null);
            load();
        } catch (e) { toast_(e.response?.data?.error || 'Delete failed', 'error'); }
    };

    const filtered = feedbacks.filter(f =>
        (filterStatus === 'all' || f.status === filterStatus) &&
        (filterRole === 'all' || f.user_role === filterRole)
    );

    return (
        <div className="page-container fb-page">

            {/* Toast */}
            {toast && <div className={`fb-toast fb-toast-${toast.type}`}>{toast.msg}</div>}

            {/* Reply/Detail modal (admin) */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal fb-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Reply size={18} /> Reply to Feedback</h2>
                        </div>
                        <div className="modal-body">
                            <div className="fb-detail-meta">
                                <span className={`badge ${selected.user_role === 'student' ? 'badge-primary' : 'badge-accent'}`}>
                                    {selected.user_role === 'student' ? <User size={12} /> : <GraduationCap size={12} />}
                                    {selected.user_name}
                                </span>
                                <span className="badge badge-secondary">{selected.category}</span>
                                {selected.rating > 0 && <StarRating value={selected.rating} />}
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selected.created_at}</span>
                            </div>
                            <h3 style={{ margin: '0.75rem 0 0.5rem', color: 'var(--text-primary)' }}>{selected.subject}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{selected.message}</p>

                            {selected.admin_reply && (
                                <div className="fb-prev-reply">
                                    <strong>Previous Reply:</strong> {selected.admin_reply}
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '1.25rem' }}>
                                <label>Admin Reply</label>
                                <textarea rows={3} placeholder="Write your reply…" value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Update Status</label>
                                <div className="fb-status-btns">
                                    {['pending', 'reviewed', 'resolved'].map(s => (
                                        <button key={s} type="button"
                                            className={`fb-status-btn ${replyStatus === s ? 'active' : ''}`}
                                            style={{ '--sc': STATUS_COLORS[s] }}
                                            onClick={() => setReplyStatus(s)}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleReply} disabled={saving}>
                                <Send size={15} /> {saving ? 'Saving…' : 'Send Reply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="page-header">
                <h1><MessageSquare size={22} /> Feedback</h1>
            </div>

            {/* Admin stats */}
            {isAdmin && (
                <div className="fb-stats">
                    {[
                        { label: 'Total', val: stats.total || 0, color: '#818cf8' },
                        { label: 'Pending', val: stats.pending || 0, color: '#f59e0b' },
                        { label: 'Reviewed', val: stats.reviewed || 0, color: '#6366f1' },
                        { label: 'Resolved', val: stats.resolved || 0, color: '#10b981' },
                        { label: 'Avg Rating', val: stats.avg_rating ? `${stats.avg_rating}★` : '—', color: '#f59e0b' },
                        { label: 'Students', val: stats.from_students || 0, color: '#60a5fa' },
                        { label: 'Teachers', val: stats.from_teachers || 0, color: '#34d399' },
                    ].map(c => (
                        <div key={c.label} className="fb-stat" style={{ '--sc': c.color }}>
                            <strong>{c.val}</strong><span>{c.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="fb-tabs">
                {!isAdmin && <button className={`fb-tab ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}><Send size={15} /> Submit</button>}
                {!isAdmin && <button className={`fb-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => { setTab('my'); load(); }}><Clock size={15} /> My Feedback ({feedbacks.length})</button>}
                {isAdmin && <button className={`fb-tab ${tab === 'review' ? 'active' : ''}`} onClick={() => setTab('review')}><Eye size={15} /> Review All ({feedbacks.length})</button>}
            </div>

            {/* ── SUBMIT TAB ── */}
            {tab === 'submit' && !isAdmin && (
                <div className="fb-form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="fb-form-grid">
                            <div className="form-group">
                                <label>Category</label>
                                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Rating <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(optional)</span></label>
                                <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: p.rating === v ? 0 : v }))} />
                            </div>
                            <div className="form-group full">
                                <label>Subject <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief subject of your feedback" required />
                            </div>
                            <div className="form-group full">
                                <label>Message <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <textarea rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your feedback in detail…" required style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-group full">
                                <label className="fb-anon-label">
                                    <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm(p => ({ ...p, is_anonymous: e.target.checked }))} />
                                    Submit anonymously (your name will be hidden from admin)
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                <Send size={16} /> {submitting ? 'Submitting…' : 'Submit Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── MY FEEDBACK TAB ── */}
            {tab === 'my' && !isAdmin && (
                <div className="table-container">
                    {loading ? <div className="loading">Loading…</div>
                        : feedbacks.length === 0 ? <div className="empty-state"><p>You haven't submitted any feedback yet.</p></div>
                            : (
                                <div className="fb-card-list">
                                    {feedbacks.map(f => (
                                        <div key={f.id} className="fb-card">
                                            <div className="fb-card-top">
                                                <div>
                                                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{f.category}</span>
                                                    <h3>{f.subject}</h3>
                                                </div>
                                                <span className={`badge ${STATUS_BADGES[f.status]}`}>{f.status}</span>
                                            </div>
                                            <p className="fb-msg">{f.message}</p>
                                            {f.rating > 0 && <StarRating value={f.rating} />}
                                            {f.admin_reply && (
                                                <div className="fb-admin-reply">
                                                    <strong>Admin replied:</strong> {f.admin_reply}
                                                </div>
                                            )}
                                            <div className="fb-card-footer">
                                                <span>{f.created_at}</span>
                                                {f.is_anonymous === 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>🕵️ Anonymous</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                </div>
            )}

            {/* ── ADMIN REVIEW TAB ── */}
            {tab === 'review' && isAdmin && (
                <>
                    {/* Filter bar */}
                    <div className="fb-filter-bar">
                        <Filter size={15} style={{ color: 'var(--text-muted)' }} />
                        <div className="fb-filter-group">
                            <label>Status:</label>
                            {['all', 'pending', 'reviewed', 'resolved'].map(s => (
                                <button key={s} className={`fb-filter-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</button>
                            ))}
                        </div>
                        <div className="fb-filter-group">
                            <label>Role:</label>
                            {['all', 'student', 'teacher'].map(r => (
                                <button key={r} className={`fb-filter-btn ${filterRole === r ? 'active' : ''}`} onClick={() => setFilterRole(r)}>{r}</button>
                            ))}
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} items</span>
                    </div>

                    <div className="table-container">
                        {loading ? <div className="loading">Loading…</div>
                            : filtered.length === 0 ? <div className="empty-state"><p>No feedback found.</p></div>
                                : (
                                    <div className="fb-card-list">
                                        {filtered.map(f => (
                                            <div key={f.id} className={`fb-card admin ${f.status}`}>
                                                <div className="fb-card-top">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                        <span className={`badge ${f.user_role === 'student' ? 'badge-primary' : 'badge-accent'}`} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            {f.user_role === 'student' ? <User size={11} /> : <GraduationCap size={11} />} {f.user_name}
                                                        </span>
                                                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{f.category}</span>
                                                        {f.rating > 0 && <StarRating value={f.rating} />}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <span className={`badge ${STATUS_BADGES[f.status]}`}>{f.status}</span>
                                                        <button className="icon-btn edit" onClick={() => { setSelected(f); setReplyText(f.admin_reply || ''); setReplyStatus(f.status); }}>
                                                            <Reply size={16} />
                                                        </button>
                                                        <button className="icon-btn delete" onClick={() => handleDelete(f.id)}><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <h3>{f.subject}</h3>
                                                <p className="fb-msg">{f.message}</p>
                                                {f.admin_reply && <div className="fb-admin-reply"><strong>Your reply:</strong> {f.admin_reply}</div>}
                                                <div className="fb-card-footer"><span>{f.created_at}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Feedback;

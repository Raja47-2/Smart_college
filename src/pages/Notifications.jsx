import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead, sendNotification } from '../services/api';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: 1 } : n
            ));
        } catch (error) {
            console.error(error);
        }
    };

    const [targetRole, setTargetRole] = useState('all');
    const [targetDept, setTargetDept] = useState('');
    const [targetYear, setTargetYear] = useState('');

    const handleSend = async () => {
        if (!newTitle.trim() || !newMessage.trim()) return;
        setSending(true);
        try {
            await sendNotification({
                title: newTitle,
                message: newMessage,
                targetRole,
                targetDept: targetRole === 'student' ? targetDept : null,
                targetYear: targetRole === 'student' ? targetYear : null
            });
            setNewTitle('');
            setNewMessage('');
            setTargetRole('all');
            setTargetDept('');
            setTargetYear('');
            loadNotifications();
        } catch (err) {
            console.error('Failed to send notification', err);
        } finally {
            setSending(false);
        }
    };

    const DEPARTMENTS = ['Computer Science', 'Electronic & Communication', 'Mechanical', 'Civil', 'Electrical', 'Information Technology'];
    const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Notifications</h1>
            </div>
            {user?.role === 'admin' && (
                <div className="broadcast-form">
                    <h2>Send Targeted Broadcast</h2>
                    <div className="targeting-options">
                        <div className="form-group">
                            <label>Target Group</label>
                            <select value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                                <option value="all">All (Students & Staff)</option>
                                <option value="student">Only Students</option>
                                <option value="staff">Only Staff / Faculty</option>
                            </select>
                        </div>

                        {targetRole === 'student' && (
                            <>
                                <div className="form-group">
                                    <label>Branch (Optional)</label>
                                    <select value={targetDept} onChange={e => setTargetDept(e.target.value)}>
                                        <option value="">All Branches</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Year (Optional)</label>
                                    <select value={targetYear} onChange={e => setTargetYear(e.target.value)}>
                                        <option value="">All Years</option>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Notification Title"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                    />
                    <textarea
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        rows={3}
                    />
                    <button className="broadcast-btn" onClick={handleSend} disabled={sending || !newTitle || !newMessage}>
                        {sending ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </div>
            )}

            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <p>No notifications.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}>
                            <div className="notif-icon">
                                <Bell size={20} />
                            </div>
                            <div className="notif-content">
                                <h3>{notif.title}</h3>
                                <p>{notif.message}</p>
                                <span className="timestamp">{new Date(notif.created_at).toLocaleString()}</span>
                            </div>
                            {!notif.is_read && (
                                <button onClick={() => handleMarkRead(notif.id)} className="mark-read-btn" title="Mark as read">
                                    <Check size={18} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;

import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../services/api';
import { Bell, Check } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Notifications</h1>
            </div>

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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../utils/api';
import './Notifications.css';

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchNotifications();
    }, [page]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications({ page, limit: 15 });
            setNotifications(prev => page === 1 ? response.data.notifications : [...prev, ...response.data.notifications]);
            setTotalPages(response.data.pagination.pages);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await notificationAPI.deleteNotification(id);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'like': return '❤️';
            case 'comment':
            case 'reply': return '💬';
            case 'follow': return '👤';
            case 'message': return '✉️';
            case 'job_application':
            case 'job_status':
            case 'job_posted': return '💼';
            default: return '🔔';
        }
    };

    const getLink = (notification) => {
        switch (notification.type) {
            case 'like':
            case 'comment':
            case 'reply':
                return `/post/${notification.post?._id || ''}`;
            case 'follow':
                return `/profile/${notification.sender?._id || ''}`;
            case 'message':
                return `/messages?user=${notification.sender?._id || ''}`;
            case 'job_application':
            case 'job_status':
            case 'job_posted':
                return `/jobs/${notification.job?._id || ''}`;
            default:
                return '#';
        }
    };

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <h2>Notifications</h2>
                {notifications.some(n => !n.read) && (
                    <button onClick={handleMarkAllRead} className="btn-text">
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notifications-list">
                {notifications.map(notification => (
                    <Link
                        to={getLink(notification)}
                        key={notification._id}
                        className={`notification-item glass-card ${!notification.read ? 'unread' : ''}`}
                        onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                    >
                        <div className="notification-icon">{getIcon(notification.type)}</div>
                        <div className="notification-content">
                            <div className="notification-user">
                                {notification.sender?.avatar ? (
                                    <img src={notification.sender.avatar} alt={notification.sender.username} />
                                ) : (
                                    <div className="avatar-placeholder">{notification.sender?.username?.charAt(0)}</div>
                                )}
                            </div>
                            <div className="notification-text">
                                <span className="username">{notification.sender?.username}</span>
                                <p>{notification.message}</p>
                                <span className="time">{new Date(notification.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button className="delete-notification" onClick={(e) => handleDelete(e, notification._id)}>
                            &times;
                        </button>
                    </Link>
                ))}

                {loading && <div className="loading-spinner"><div className="spinner" /></div>}

                {!loading && notifications.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <h3>No notifications yet</h3>
                        <p>When people interact with you, you'll see it here.</p>
                    </div>
                )}

                {!loading && page < totalPages && (
                    <button onClick={() => setPage(p => p + 1)} className="btn btn-outline load-more">
                        Load More
                    </button>
                )}
            </div>
        </div>
    );
}

export default Notifications;

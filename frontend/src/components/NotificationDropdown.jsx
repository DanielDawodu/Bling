import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { normalizeUrl } from '../utils/api';
import './NotificationDropdown.css';

function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const dropdownRef = useRef(null);

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        requestPermission,
        fetchNotifications
    } = useNotifications();

    // Check if we should show permission banner
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            setShowPermissionBanner(true);
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await markAsRead(notification._id);
        }
        setIsOpen(false);
    };

    const handleEnableNotifications = async () => {
        const result = await requestPermission();
        if (result) {
            setShowPermissionBanner(false);
        }
    };

    const getNotificationLink = (notification) => {
        switch (notification.type) {
            case 'like':
            case 'comment':
            case 'reply':
                return notification.post ? `/post/${notification.post._id || notification.post}` : '/';
            case 'follow':
                return notification.sender ? `/profile/${notification.sender._id}` : '/';
            case 'message':
                return notification.sender ? `/messages?user=${notification.sender._id}` : '/messages';
            case 'job_application':
            case 'job_status':
                return notification.job ? `/jobs/${notification.job._id || notification.job}` : '/jobs';
            default:
                return '/';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'like':
                return '❤️';
            case 'comment':
                return '💬';
            case 'reply':
                return '↩️';
            case 'follow':
                return '👤';
            case 'message':
                return '✉️';
            case 'job_application':
                return '📄';
            case 'job_status':
                return '💼';
            default:
                return '🔔';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getAvatarUrl = (notification) => {
        return normalizeUrl(notification.sender?.avatar);
    };

    return (
        <div className="notification-dropdown-wrapper" ref={dropdownRef}>
            <button className="notification-bell" onClick={handleBellClick} aria-label="Notifications">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-read"
                                onClick={markAllAsRead}
                                disabled={loading}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {showPermissionBanner && (
                        <div className="notification-permission-banner">
                            <p>Enable push notifications to stay updated</p>
                            <button
                                className="enable-notifications-btn"
                                onClick={handleEnableNotifications}
                            >
                                Enable
                            </button>
                        </div>
                    )}

                    <div className="notification-list">
                        {loading && notifications.length === 0 ? (
                            <div className="notification-empty">
                                <p>Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((notification) => (
                                <Link
                                    key={notification._id}
                                    to={getNotificationLink(notification)}
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`notification-type-icon ${notification.type}`}>
                                        {getTypeIcon(notification.type)}
                                    </div>
                                    {getAvatarUrl(notification) ? (
                                        <img
                                            src={getAvatarUrl(notification)}
                                            alt=""
                                            className="notification-avatar"
                                        />
                                    ) : (
                                        <div className="notification-avatar">
                                            {notification.sender?.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div className="notification-content">
                                        <p className="notification-message">
                                            {notification.message}
                                        </p>
                                        <span className="notification-time">
                                            {formatTime(notification.createdAt)}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <Link to="/notifications" onClick={() => setIsOpen(false)}>
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationDropdown;

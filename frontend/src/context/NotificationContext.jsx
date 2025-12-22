import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './auth-context';

const NotificationContext = createContext();

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            const response = await axios.get('/api/notifications', {
                withCredentials: true
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await axios.get('/api/notifications/unread-count', {
                withCredentials: true
            });
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [isAuthenticated]);

    // Mark single notification as read
    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(`/api/notifications/${notificationId}/read`, {}, {
                withCredentials: true
            });

            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            await axios.patch('/api/notifications/read-all', {}, {
                withCredentials: true
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Delete a notification
    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`/api/notifications/${notificationId}`, {
                withCredentials: true
            });

            const notification = notifications.find(n => n._id === notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Subscribe to push notifications
    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            // Get VAPID public key
            const vapidResponse = await axios.get('/api/notifications/vapid-public-key');
            const vapidPublicKey = vapidResponse.data.publicKey;

            if (!vapidPublicKey) {
                console.log('VAPID keys not configured');
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Send subscription to server
            await axios.post('/api/notifications/subscribe', {
                subscription: subscription.toJSON()
            }, {
                withCredentials: true
            });

            console.log('Push subscription successful');
            return true;
        } catch (error) {
            console.error('Push subscription error:', error);
            return false;
        }
    };

    // Request notification permission
    const requestPermission = async () => {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return subscribeToPush();
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                return subscribeToPush();
            }
        }

        return false;
    };

    // Helper to convert VAPID key
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Initial fetch and polling
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            fetchUnreadCount();

            // Poll for new notifications every 5 seconds
            const interval = setInterval(() => {
                fetchUnreadCount();
                // Also fetch notifications slightly less frequently or just use the same interval if needed
                // For simplicity and responsiveness, let's keep unread count check fast
            }, 5000);

            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        requestPermission,
        subscribeToPush
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export default NotificationContext;

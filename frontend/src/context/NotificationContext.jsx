import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../utils/api';
import { useAuth } from './auth-context';

const NotificationContext = createContext();

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated || authLoading) return;

        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications({ limit: 15 });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            // Silently ignore 401 errors — user may not be logged in yet
            if (error?.response?.status !== 401) {
                console.error('Error fetching notifications:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated || authLoading) return;

        try {
            const response = await notificationAPI.getUnreadCount();
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            // Silently ignore 401 errors — user may not be logged in yet
            if (error?.response?.status !== 401) {
                console.error('Error fetching unread count:', error);
            }
        }
    }, [isAuthenticated, authLoading]);

    // Mark single notification as read
    const markAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);

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
            await notificationAPI.markAllAsRead();

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Delete a notification
    const deleteNotification = async (notificationId) => {
        try {
            await notificationAPI.deleteNotification(notificationId);

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
            const vapidResponse = await notificationAPI.getVapidPublicKey();
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
            await notificationAPI.subscribe(subscription.toJSON());

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

    // Initial fetch and polling — only starts once auth loading is complete and user is authenticated
    useEffect(() => {
        if (authLoading) return; // Wait until auth check is done

        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Initial fetch once confirmed authenticated
        fetchNotifications();
        fetchUnreadCount();

        // Poll every 30 seconds (reduced from 5s to avoid excessive API calls)
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated, authLoading, fetchNotifications, fetchUnreadCount]);

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

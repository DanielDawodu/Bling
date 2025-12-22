import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// VAPID keys for web push - generate these once and store in .env
// Run: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@bling-app.dev';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        vapidMailto,
        vapidPublicKey,
        vapidPrivateKey
    );
}

/**
 * Send a push notification to a user's subscription
 * @param {Object} subscription - The push subscription object
 * @param {Object} payload - The notification payload { title, body, icon, url }
 * @returns {Promise}
 */
export async function sendPushNotification(subscription, payload) {
    if (!subscription || !vapidPublicKey || !vapidPrivateKey) {
        return null;
    }

    try {
        const notificationPayload = JSON.stringify({
            title: payload.title || 'BlogForge',
            body: payload.body || 'You have a new notification',
            icon: payload.icon || '/favicon.ico',
            url: payload.url || '/',
            timestamp: Date.now()
        });

        await webpush.sendNotification(subscription, notificationPayload);
        return true;
    } catch (error) {
        console.error('Push notification error:', error);
        // If subscription is no longer valid, return false to indicate removal
        if (error.statusCode === 410 || error.statusCode === 404) {
            return false; // Subscription expired or invalid
        }
        return null;
    }
}

/**
 * Get the public VAPID key for the frontend
 */
export function getVapidPublicKey() {
    return vapidPublicKey;
}

export default {
    sendPushNotification,
    getVapidPublicKey
};

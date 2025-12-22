import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import { sendPushNotification, getVapidPublicKey } from '../config/pushService.js';

const router = express.Router();

// Get VAPID public key for frontend
router.get('/vapid-public-key', (req, res) => {
    const publicKey = getVapidPublicKey();
    res.json({ publicKey });
});

// Get all notifications for current user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'username avatar')
            .populate('post', 'content')
            .populate('job', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ recipient: req.user.id });

        res.json({
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
});

// Get unread notification count
router.get('/unread-count', isAuthenticated, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            read: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Server error fetching unread count' });
    }
});

// Mark single notification as read
router.patch('/:id/read', isAuthenticated, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        notification.read = true;
        await notification.save();

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Server error marking notification as read' });
    }
});

// Mark all notifications as read
router.patch('/read-all', isAuthenticated, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Server error marking notifications as read' });
    }
});

// Delete a notification
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Server error deleting notification' });
    }
});

// Subscribe to push notifications
router.post('/subscribe', isAuthenticated, async (req, res) => {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription' });
        }

        await User.findByIdAndUpdate(req.user.id, {
            pushSubscription: subscription
        });

        res.json({ message: 'Push subscription saved successfully' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Server error saving subscription' });
    }
});

// Unsubscribe from push notifications
router.delete('/subscribe', isAuthenticated, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $unset: { pushSubscription: 1 }
        });

        res.json({ message: 'Push subscription removed' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Server error removing subscription' });
    }
});

// Helper function to create notification and send push
export async function createNotification({
    recipientId,
    senderId,
    type,
    message,
    postId = null,
    commentId = null,
    jobId = null,
    snippetId = null
}) {
    // Don't notify yourself
    if (recipientId.toString() === senderId.toString()) {
        return null;
    }

    try {
        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type,
            message,
            post: postId,
            comment: commentId,
            job: jobId,
            snippet: snippetId
        });

        await notification.save();
        await notification.populate('sender', 'username avatar');

        // Send push notification if user has subscription
        const recipient = await User.findById(recipientId);
        if (recipient?.pushSubscription) {
            const pushResult = await sendPushNotification(recipient.pushSubscription, {
                title: 'Bling',
                body: message,
                url: getNotificationUrl(type, { postId, jobId, senderId })
            });

            // If subscription is expired, remove it
            if (pushResult === false) {
                await User.findByIdAndUpdate(recipientId, {
                    $unset: { pushSubscription: 1 }
                });
            }
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
}

// Helper to get URL for notification
function getNotificationUrl(type, { postId, jobId, senderId }) {
    switch (type) {
        case 'like':
        case 'comment':
        case 'reply':
            return postId ? `/post/${postId}` : '/';
        case 'follow':
            return senderId ? `/profile/${senderId}` : '/';
        case 'message':
            return senderId ? `/messages?user=${senderId}` : '/messages';
        case 'job_application':
        case 'job_status':
        case 'job_posted':
            return jobId ? `/jobs/${jobId}` : '/jobs';
        default:
            return '/';
    }
}

export default router;

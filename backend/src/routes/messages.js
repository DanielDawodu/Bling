import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import { uploadMedia } from '../middleware/upload-middleware.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', isAuthenticated, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate('participants', 'username avatar')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        // Get unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    recipient: req.user.id,
                    sender: conv.participants.find(p => p._id.toString() !== req.user.id)?._id,
                    read: false
                });
                return {
                    ...conv.toObject(),
                    unreadCount
                };
            })
        );

        res.json({ conversations: conversationsWithUnread });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Server error fetching conversations' });
    }
});

// Get messages with a specific user
router.get('/conversation/:userId', isAuthenticated, async (req, res) => {
    try {
        const { userId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: req.user.id, recipient: userId },
                { sender: userId, recipient: req.user.id }
            ]
        })
            .populate('sender', 'username avatar')
            .populate('recipient', 'username avatar')
            .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { sender: userId, recipient: req.user.id, read: false },
            { read: true }
        );

        // Also mark related notifications as read
        await Notification.updateMany(
            {
                sender: userId,
                recipient: req.user.id,
                type: 'message',
                read: false
            },
            { read: true }
        );

        res.json({ messages });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Server error fetching messages' });
    }
});

// Send a new message
router.post('/send', isAuthenticated, async (req, res) => {
    try {
        const { recipientId, content } = req.body;

        if (!recipientId || !content) {
            return res.status(400).json({ error: 'Recipient and content are required' });
        }

        if (!content.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // Create message
        const message = new Message({
            sender: req.user.id,
            recipient: recipientId,
            content: content.trim()
        });

        await message.save();
        await message.populate('sender', 'username avatar');
        await message.populate('recipient', 'username avatar');

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, recipientId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.user.id, recipientId],
                lastMessage: message._id
            });
        } else {
            conversation.lastMessage = message._id;
            conversation.updatedAt = Date.now();
        }

        await conversation.save();

        // Send notification to recipient
        await createNotification({
            recipientId: recipientId,
            senderId: req.user.id,
            type: 'message',
            message: `${req.user.username} sent you a message`
        });

        res.status(201).json({ message: 'Message sent successfully', data: message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error sending message' });
    }
});

// Upload message attachments
router.post('/upload-attachments', isAuthenticated, uploadMedia.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const fileUrls = req.files.map(file =>
            file.path && file.path.startsWith('http') ? file.path : `/uploads/${file.filename}`
        );
        res.json({ files: fileUrls });
    } catch (error) {
        console.error('Upload attachments error:', error);
        res.status(500).json({ error: 'Server error uploading files' });
    }
});

// Send a new message with attachments
router.post('/send-with-attachments', isAuthenticated, async (req, res) => {
    try {
        const { recipientId, content, attachments } = req.body;

        if (!recipientId) {
            return res.status(400).json({ error: 'Recipient is required' });
        }

        if (!content && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ error: 'Message must have content or attachments' });
        }

        // Create message
        const message = new Message({
            sender: req.user.id,
            recipient: recipientId,
            content: content?.trim() || '',
            attachments: attachments || []
        });

        await message.save();
        await message.populate('sender', 'username avatar');
        await message.populate('recipient', 'username avatar');

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, recipientId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.user.id, recipientId],
                lastMessage: message._id
            });
        } else {
            conversation.lastMessage = message._id;
            conversation.updatedAt = Date.now();
        }

        await conversation.save();

        // Send notification to recipient
        await createNotification({
            recipientId: recipientId,
            senderId: req.user.id,
            type: 'message',
            message: `${req.user.username} sent you a message`
        });

        res.status(201).json({ message: 'Message sent successfully', data: message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error sending message' });
    }
});

// Mark message as read
router.patch('/:id/read', isAuthenticated, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.recipient.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        message.read = true;
        await message.save();

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Server error marking message as read' });
    }
});

// Delete a message
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        await Message.findByIdAndDelete(req.params.id);

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Server error deleting message' });
    }
});

// Get unread message count
router.get('/unread-count', isAuthenticated, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            recipient: req.user.id,
            read: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Server error fetching unread count' });
    }
});

export default router;

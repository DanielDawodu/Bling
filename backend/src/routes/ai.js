import express from 'express';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { auditUserVerification, chatWithBlingAI } from '../services/gemini.js';

const router = express.Router();

/**
 * Audit current user for verification
 */
router.post('/audit-verification', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const postsCount = await Post.countDocuments({ author: req.user.id });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const auditData = {
            username: user.username,
            bio: user.bio,
            socialLinks: user.socialLinks,
            createdAt: user.createdAt,
            postsCount: postsCount,
            followersCount: user.followers.length
        };

        const result = await auditUserVerification(auditData);

        // Auto-verify if score is high (85+)
        if (result.score >= 85 && result.status === 'approved') {
            user.isVerified = true;
            await user.save();
            result.autoVerified = true;
        } else {
            result.autoVerified = false;
        }

        res.json(result);
    } catch (error) {
        console.error('AI Verification Audit Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Chat with Bling AI
 */
router.post('/chat', isAuthenticated, async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const reply = await chatWithBlingAI(message, history || []);
        res.json({ reply });
    } catch (error) {
        console.error('Bling AI Chat Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

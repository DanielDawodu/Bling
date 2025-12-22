import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import { uploadAvatar } from '../middleware/upload-middleware.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Get current user dashboard stats
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const postsCount = await Post.countDocuments({ author: req.user.id });

        // Use mongoose.Types.ObjectId to ensure proper matching
        const totalLikes = await Post.aggregate([
            { $match: { author: user._id } },
            { $project: { likesCount: { $size: "$likes" } } },
            { $group: { _id: null, total: { $sum: "$likesCount" } } }
        ]);

        res.json({
            postsCount: postsCount,
            totalLikes: totalLikes[0]?.total || 0,
            followersCount: user.followers.length,
            followingCount: user.following.length
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Server error fetching dashboard stats' });
    }
});

import Comment from '../models/Comment.js';

// Search users (MUST be before /:id route)
router.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        if (!q.trim()) {
            return res.json({ users: [] });
        }
        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        }).select('-password').limit(20);
        res.json({ users });
    } catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ error: 'Server error searching users' });
    }
});

// Get follow suggestions
router.get('/suggestions', isAuthenticated, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const currentUser = await User.findById(currentUserId);

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get IDs of users already followed (as strings for comparison)
        const followingIds = (currentUser.following || []).map(id => id.toString());

        // Build exclude list: self + followed users
        const excludeIds = [currentUserId, ...followingIds];

        // Simply get users that aren't in the exclude list, sorted by followers count
        const suggestions = await User.find({
            _id: { $nin: excludeIds }
        })
            .select('username avatar bio followers isVerified')
            .limit(10)
            .lean();

        // Sort by follower count (descending)
        suggestions.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));

        res.json({ suggestions });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ error: 'Server error fetching suggestions', suggestions: [] });
    }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await User.findById(req.params.id).select('-password').lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's posts count
        let postsCount = 0;
        try {
            postsCount = await Post.countDocuments({ author: user._id });
        } catch (postError) {
            console.error('Error counting posts:', postError);
        }

        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            coverPhoto: user.coverPhoto,
            bio: user.bio,
            dateOfBirth: user.dateOfBirth,
            socialLinks: user.socialLinks,
            createdAt: user.createdAt,
            postsCount,
            followersCount: user.followers?.length || 0,
            followingCount: user.following?.length || 0
        };

        res.json({ user: userResponse });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error fetching user' });
    }
});

// Update user profile
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        // Check if user is updating their own profile
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }

        const { bio, dateOfBirth, socialLinks } = req.body;

        const updateData = {};
        if (bio !== undefined) updateData.bio = bio;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
        if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

// Upload avatar
router.post('/:id/avatar', isAuthenticated, (req, res) => {
    // Check if user is updating their own avatar
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only update your own avatar' });
    }

    uploadAvatar(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            // Update user's avatar field
            const avatarUrl = req.file.path && req.file.path.startsWith('http')
                ? req.file.path
                : `/uploads/${req.file.filename}`;

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { avatar: avatarUrl },
                { new: true }
            ).select('-password');

            res.json({
                message: 'Avatar uploaded successfully',
                avatar: avatarUrl,
                user: updatedUser
            });
        } catch (error) {
            console.error('Avatar upload error:', error);
            res.status(500).json({ error: 'Server error uploading avatar' });
        }
    });
});

// Upload cover photo
router.post('/:id/cover', isAuthenticated, (req, res) => {
    // Check if user is updating their own cover
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only update your own cover photo' });
    }

    uploadAvatar(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            // Update user's coverPhoto field
            const coverUrl = req.file.path && req.file.path.startsWith('http')
                ? req.file.path
                : `/uploads/${req.file.filename}`;

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { coverPhoto: coverUrl },
                { new: true }
            ).select('-password');

            res.json({
                message: 'Cover photo uploaded successfully',
                coverPhoto: coverUrl,
                user: updatedUser
            });
        } catch (error) {
            console.error('Cover upload error:', error);
            res.status(500).json({ error: 'Server error uploading cover photo' });
        }
    });
});

// Get user's posts
router.get('/:id/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find({ author: req.params.id })
            .populate('author', 'username avatar isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({ author: req.params.id });

        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Server error fetching posts' });
    }
});

// Follow a user
router.post('/:id/follow', isAuthenticated, async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userToFollow.followers.includes(req.user.id)) {
            return res.status(400).json({ error: 'You are already following this user' });
        }

        await userToFollow.updateOne({ $push: { followers: req.user.id } });
        await currentUser.updateOne({ $push: { following: req.params.id } });

        // Send notification to the user being followed
        await createNotification({
            recipientId: req.params.id,
            senderId: req.user.id,
            type: 'follow',
            message: `${req.user.username} started following you`
        });

        res.json({ message: 'User followed successfully' });
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: 'Server error following user' });
    }
});

// Unfollow a user
router.post('/:id/unfollow', isAuthenticated, async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: 'You cannot unfollow yourself' });
        }

        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToUnfollow) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!userToUnfollow.followers.includes(req.user.id)) {
            return res.status(400).json({ error: 'You are not following this user' });
        }

        await userToUnfollow.updateOne({ $pull: { followers: req.user.id } });
        await currentUser.updateOne({ $pull: { following: req.params.id } });

        res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ error: 'Server error unfollowing user' });
    }
});

// Get followers of a user
router.get('/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers', 'username avatar isVerified');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ followers: user.followers });
    } catch (err) {
        console.error('Get followers error:', err);
        res.status(500).json({ error: 'Server error fetching followers' });
    }
});



export default router;

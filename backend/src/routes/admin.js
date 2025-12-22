import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Snippet from '../models/Snippet.js';
import Job from '../models/Job.js';
import Report from '../models/Report.js';
import Comment from '../models/Comment.js';
import { isAdmin } from '../middleware/auth-middleware.js';

const router = express.Router();

// ==================== DASHBOARD STATS ====================

// Get comprehensive dashboard statistics
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // User stats
        const totalUsers = await User.countDocuments();
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
        const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: thisWeek } });
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonth } });
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const suspendedUsers = await User.countDocuments({ isSuspended: true });

        // Content stats
        const totalPosts = await Post.countDocuments();
        const postsToday = await Post.countDocuments({ createdAt: { $gte: today } });
        const postsThisWeek = await Post.countDocuments({ createdAt: { $gte: thisWeek } });

        const totalSnippets = await Snippet.countDocuments();
        const snippetsThisWeek = await Snippet.countDocuments({ createdAt: { $gte: thisWeek } });

        const totalJobs = await Job.countDocuments();
        const activeJobs = await Job.countDocuments({ isActive: true });
        const jobsThisWeek = await Job.countDocuments({ createdAt: { $gte: thisWeek } });

        const totalComments = await Comment.countDocuments();
        const commentsThisWeek = await Comment.countDocuments({ createdAt: { $gte: thisWeek } });

        // Reports stats
        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const resolvedReports = await Report.countDocuments({ status: 'resolved' });
        const dismissedReports = await Report.countDocuments({ status: 'dismissed' });

        // Growth calculation (comparing this month to last month)
        const usersLastMonth = await User.countDocuments({
            createdAt: { $gte: lastMonth, $lt: thisMonth }
        });
        const userGrowth = usersLastMonth > 0
            ? (((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1)
            : 100;

        res.json({
            users: {
                total: totalUsers,
                today: newUsersToday,
                thisWeek: newUsersThisWeek,
                thisMonth: newUsersThisMonth,
                verified: verifiedUsers,
                suspended: suspendedUsers,
                growth: parseFloat(userGrowth)
            },
            content: {
                posts: { total: totalPosts, today: postsToday, thisWeek: postsThisWeek },
                snippets: { total: totalSnippets, thisWeek: snippetsThisWeek },
                jobs: { total: totalJobs, active: activeJobs, thisWeek: jobsThisWeek },
                comments: { total: totalComments, thisWeek: commentsThisWeek }
            },
            reports: {
                total: totalReports,
                pending: pendingReports,
                resolved: resolvedReports,
                dismissed: dismissedReports
            },
            timestamp: now
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
});

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filters
router.get('/users', isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, filter } = req.query;
        const skip = (page - 1) * limit;

        let query = {};

        // Search by username or email
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by status
        if (filter === 'verified') query.isVerified = true;
        if (filter === 'suspended') query.isSuspended = true;
        if (filter === 'admin') query.isAdmin = true;

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Get single user details
router.get('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's content counts
        const postsCount = await Post.countDocuments({ author: req.params.id });
        const snippetsCount = await Snippet.countDocuments({ author: req.params.id });
        const jobsCount = await Job.countDocuments({ postedBy: req.params.id });
        const reportsAgainst = await Report.countDocuments({ targetId: req.params.id });

        res.json({
            user,
            stats: { postsCount, snippetsCount, jobsCount, reportsAgainst }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user details' });
    }
});

// Verify user
router.put('/users/:id/verify', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isVerified = !user.isVerified;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error modifying user verification' });
    }
});

// Suspend user
router.put('/users/:id/suspend', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isSuspended = !user.isSuspended;
        user.suspendedAt = user.isSuspended ? new Date() : null;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error modifying user suspension' });
    }
});

// Make/remove admin
router.put('/users/:id/admin', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isAdmin = !user.isAdmin;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error modifying admin status' });
    }
});

// Delete user and all their content
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Delete user's content
        await Post.deleteMany({ author: userId });
        await Snippet.deleteMany({ author: userId });
        await Job.deleteMany({ postedBy: userId });
        await Comment.deleteMany({ author: userId });

        // Delete the user
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User and all content deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
});

// ==================== CONTENT MODERATION ====================

// Get all posts with pagination
router.get('/posts', isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query.content = { $regex: search, $options: 'i' };
        }

        const posts = await Post.find(query)
            .populate('author', 'username avatar isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Post.countDocuments(query);

        res.json({
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Delete post by admin
router.delete('/posts/:id', isAdmin, async (req, res) => {
    try {
        // Also delete comments on the post
        await Comment.deleteMany({ postId: req.params.id });

        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ message: 'Post and comments deleted by admin' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting post' });
    }
});

// Get all snippets with pagination
router.get('/snippets', isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const snippets = await Snippet.find(query)
            .populate('author', 'username avatar isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Snippet.countDocuments(query);

        res.json({
            snippets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching snippets' });
    }
});

// Delete snippet by admin
router.delete('/snippets/:id', isAdmin, async (req, res) => {
    try {
        const snippet = await Snippet.findByIdAndDelete(req.params.id);
        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        res.json({ message: 'Snippet deleted by admin' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting snippet' });
    }
});

// Get all jobs with pagination
router.get('/jobs', isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        const jobs = await Job.find(query)
            .populate('postedBy', 'username avatar isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Job.countDocuments(query);

        res.json({
            jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching jobs' });
    }
});

// Delete job by admin
router.delete('/jobs/:id', isAdmin, async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json({ message: 'Job deleted by admin' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting job' });
    }
});

// ==================== REPORTS MANAGEMENT ====================

// Get all reports with filtering
router.get('/reports', isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (status && status !== 'all') query.status = status;
        if (type && type !== 'all') query.targetType = type;

        const reports = await Report.find(query)
            .populate('reporter', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Report.countDocuments(query);

        res.json({
            reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reports' });
    }
});

// Update report status
router.patch('/reports/:id', isAdmin, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            {
                status,
                adminNotes,
                reviewedBy: req.user._id,
                reviewedAt: new Date()
            },
            { new: true }
        ).populate('reporter', 'username avatar');

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Error updating report status' });
    }
});

// Delete reported content and resolve report
router.post('/reports/:id/action', isAdmin, async (req, res) => {
    try {
        const { action } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        if (action === 'delete') {
            // Delete the reported content
            switch (report.targetType) {
                case 'post':
                    await Post.findByIdAndDelete(report.targetId);
                    await Comment.deleteMany({ postId: report.targetId });
                    break;
                case 'comment':
                    await Comment.findByIdAndDelete(report.targetId);
                    break;
                case 'snippet':
                    await Snippet.findByIdAndDelete(report.targetId);
                    break;
                case 'job':
                    await Job.findByIdAndDelete(report.targetId);
                    break;
                case 'user':
                    await User.findByIdAndUpdate(report.targetId, { isSuspended: true });
                    break;
            }
        }

        // Update report status
        report.status = action === 'delete' ? 'resolved' : 'dismissed';
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();
        await report.save();

        res.json({ message: 'Report action completed', report });
    } catch (error) {
        res.status(500).json({ error: 'Error processing report action' });
    }
});

// ==================== ACTIVITY LOGS ====================

// Get recent activity (last 50 actions across the platform)
router.get('/activity', isAdmin, async (req, res) => {
    try {
        const recentUsers = await User.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('username avatar createdAt');

        const recentPosts = await Post.find({})
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('content author createdAt');

        const recentReports = await Report.find({})
            .populate('reporter', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(10);

        // Combine and sort by date
        const activity = [
            ...recentUsers.map(u => ({
                type: 'user_joined',
                message: `${u.username} joined Bling`,
                user: { username: u.username, avatar: u.avatar },
                timestamp: u.createdAt
            })),
            ...recentPosts.map(p => ({
                type: 'post_created',
                message: `${p.author?.username} created a post`,
                user: p.author,
                content: p.content?.substring(0, 50) + '...',
                timestamp: p.createdAt
            })),
            ...recentReports.map(r => ({
                type: 'report_filed',
                message: `${r.reporter?.username} reported a ${r.targetType}`,
                user: r.reporter,
                reason: r.reason,
                timestamp: r.createdAt
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 30);

        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching activity' });
    }
});

export default router;

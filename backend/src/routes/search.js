import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Snippet from '../models/Snippet.js';
import Job from '../models/Job.js';

const router = express.Router();

router.get('/global', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json({ results: { users: [], posts: [], snippets: [], jobs: [] } });
        }

        const searchRegex = new RegExp(q, 'i');

        // Parallel search across all models
        const [users, posts, snippets, jobs] = await Promise.all([
            User.find({
                $or: [
                    { username: searchRegex },
                    { bio: searchRegex }
                ]
            })
                .select('username avatar isVerified bio followers')
                .limit(5),

            Post.find({
                $or: [
                    { title: searchRegex },
                    { content: searchRegex },
                    { tags: searchRegex }
                ]
            })
                .populate('author', 'username avatar isVerified')
                .sort({ createdAt: -1 })
                .limit(5),

            Snippet.find({
                $or: [
                    { title: searchRegex },
                    { description: searchRegex },
                    { tags: searchRegex },
                    { language: searchRegex }
                ]
            })
                .populate('author', 'username avatar isVerified')
                .limit(5),

            Job.find({
                $or: [
                    { title: searchRegex },
                    { company: searchRegex },
                    { description: searchRegex },
                    { location: searchRegex }
                ],
                isActive: true
            })
                .limit(5)
        ]);

        res.json({
            results: {
                users,
                posts,
                snippets,
                jobs
            }
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ error: 'Server error during global search' });
    }
});

export default router;

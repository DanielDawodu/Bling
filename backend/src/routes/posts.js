import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import { uploadPostMedia } from '../middleware/upload-middleware.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Get all posts (with pagination and filtering)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const tag = req.query.tag;
        const search = req.query.search;

        // Build query
        const query = {};
        if (tag) {
            query.tags = tag;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const posts = await Post.find(query)
            .populate('author', 'username avatar isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments(query);

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
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Server error fetching posts' });
    }
});

// Get feed posts from followed users
router.get('/feed', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Assuming req.user has following array of IDs (from Passport deserialization)
        const currentUser = req.user;

        const posts = await Post.find({ author: { $in: currentUser.following } })
            .populate('author', 'username avatar isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({ author: { $in: currentUser.following } });

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
        console.error('Get feed error:', error);
        res.status(500).json({ error: 'Server error fetching feed' });
    }
});

import Snippet from '../models/Snippet.js';
import Job from '../models/Job.js';

// Get unified trending items (Posts, Snippets, Jobs)
router.get('/trending', async (req, res) => {
    try {
        // 1. Get Top Posts (by interactions)
        const topPosts = await Post.aggregate([
            {
                $addFields: {
                    interactions: {
                        $add: [
                            { $size: { $ifNull: ['$likes', []] } },
                            { $size: { $ifNull: ['$reposts', []] } },
                            { $size: { $ifNull: ['$comments', []] } }
                        ]
                    },
                    type: 'post'
                }
            },
            { $sort: { interactions: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: '$author' },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    interactions: 1,
                    type: 1,
                    'author.username': 1,
                    'author.avatar': 1,
                    'author.isVerified': 1
                }
            }
        ]);

        // 2. Get Top Snippets (by likes)
        const topSnippets = await Snippet.aggregate([
            {
                $addFields: {
                    interactions: { $size: { $ifNull: ['$likes', []] } },
                    type: 'snippet'
                }
            },
            { $sort: { interactions: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: '$author' },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    language: 1,
                    interactions: 1,
                    type: 1,
                    'author.username': 1,
                    'author.isVerified': 1
                }
            }
        ]);

        // 3. Get Top Jobs (by applicants)
        const topJobs = await Job.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $addFields: {
                    interactions: { $size: { $ifNull: ['$applicants', []] } },
                    type: 'job'
                }
            },
            { $sort: { interactions: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    company: 1,
                    location: 1,
                    interactions: 1,
                    type: 1
                }
            }
        ]);

        // Combine and sort by interactions
        const allTrending = [...topPosts, ...topSnippets, ...topJobs]
            .sort((a, b) => b.interactions - a.interactions)
            .slice(0, 6); // Top 6 mixed items

        res.json({ trending: allTrending });
    } catch (error) {
        console.error('Get trending error:', error);
        res.status(500).json({ error: 'Server error fetching trending items' });
    }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username avatar bio socialLinks isVerified')
            .populate('likes', 'username avatar');

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ post });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Server error fetching post' });
    }
});

// Create new post
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { title, content, codeSnippet, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const newPost = new Post({
            author: req.user.id,
            title,
            content,
            codeSnippet: codeSnippet || { code: '', language: 'javascript' },
            tags: tags || []
        });

        await newPost.save();

        // Populate author info
        await newPost.populate('author', 'username avatar isVerified');

        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Server error creating post' });
    }
});

// Update post
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if user is the author
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own posts' });
        }

        const { title, content, codeSnippet, tags } = req.body;

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (codeSnippet !== undefined) post.codeSnippet = codeSnippet;
        if (tags !== undefined) post.tags = tags;

        await post.save();
        await post.populate('author', 'username avatar isVerified');

        res.json({ message: 'Post updated successfully', post });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Server error updating post' });
    }
});

// Delete post
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if user is the author
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Server error deleting post' });
    }
});

// Like/unlike post
router.post('/:id/like', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userIndex = post.likes.indexOf(req.user.id);

        if (userIndex === -1) {
            // User hasn't liked the post, add like
            post.likes.push(req.user.id);

            // Send notification to post author
            await createNotification({
                recipientId: post.author,
                senderId: req.user.id,
                type: 'like',
                message: `${req.user.username} liked your post`,
                postId: post._id
            });
        } else {
            // User has liked the post, remove like
            post.likes.splice(userIndex, 1);
        }

        await post.save();
        await post.populate('likes', 'username avatar');

        res.json({
            message: userIndex === -1 ? 'Post liked' : 'Post unliked',
            likes: post.likes,
            likesCount: post.likes.length
        });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Server error liking post' });
    }
});

// Repost/unrepost post
router.post('/:id/repost', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userIndex = post.reposts.indexOf(req.user.id);

        if (userIndex === -1) {
            // User hasn't reposted, add repost
            post.reposts.push(req.user.id);
        } else {
            // User has reposted, remove repost
            post.reposts.splice(userIndex, 1);
        }

        await post.save();

        res.json({
            message: userIndex === -1 ? 'Post reposted' : 'Repost removed',
            repostsCount: post.reposts.length
        });
    } catch (error) {
        console.error('Repost error:', error);
        res.status(500).json({ error: 'Server error reposting' });
    }
});

// Upload media to post
router.post('/:id/upload', isAuthenticated, (req, res) => {
    uploadPostMedia(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Check if user is the author
            if (post.author.toString() !== req.user.id) {
                return res.status(403).json({ error: 'You can only upload media to your own posts' });
            }

            // Add uploaded files to post
            if (req.files.images) {
                const imageUrls = req.files.images.map(file =>
                    file.path && file.path.startsWith('http') ? file.path : `/uploads/${file.filename}`
                );
                post.images.push(...imageUrls);
            }

            if (req.files.videos) {
                const videoUrls = req.files.videos.map(file =>
                    file.path && file.path.startsWith('http') ? file.path : `/uploads/${file.filename}`
                );
                post.videos.push(...videoUrls);
            }

            await post.save();

            res.json({
                message: 'Media uploaded successfully',
                images: post.images,
                videos: post.videos
            });
        } catch (error) {
            console.error('Upload media error:', error);
            res.status(500).json({ error: 'Server error uploading media' });
        }
    });
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.id })
            .populate('author', 'username avatar isVerified')
            .sort({ createdAt: -1 });
        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Server error fetching comments' });
    }
});

// Add comment to post
router.post('/:id/comments', isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const newComment = new Comment({
            content,
            author: req.user.id,
            post: req.params.id
        });

        await newComment.save();

        // Add comment to post's comments array
        post.comments.push(newComment._id);
        await post.save();

        await newComment.populate('author', 'username avatar isVerified');

        // Send notification to post author
        await createNotification({
            recipientId: post.author,
            senderId: req.user.id,
            type: 'comment',
            message: `${req.user.username} commented on your post`,
            postId: post._id,
            commentId: newComment._id
        });

        res.status(201).json({ message: 'Comment added', comment: newComment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Server error adding comment' });
    }
});

export default router;

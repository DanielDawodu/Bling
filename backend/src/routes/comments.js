import express from 'express';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Get all comments for a post
router.get('/:postId/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 });

        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Server error fetching comments' });
    }
});

// Add comment to post
router.post('/:postId/comments', isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        // Check if post exists
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const newComment = new Comment({
            post: req.params.postId,
            author: req.user.id,
            content: content.trim()
        });

        await newComment.save();
        await newComment.populate('author', 'username avatar');

        // Send notification to post author
        await createNotification({
            recipientId: post.author,
            senderId: req.user.id,
            type: 'comment',
            message: `${req.user.username} commented on your post`,
            postId: post._id,
            commentId: newComment._id
        });

        res.status(201).json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Server error adding comment' });
    }
});

// Delete comment
router.delete('/comments/:id', isAuthenticated, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user is the author
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        await Comment.findByIdAndDelete(req.params.id);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Server error deleting comment' });
    }
});

// Like/Unlike comment
router.post('/comments/:id/like', isAuthenticated, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const userIndex = comment.likes.indexOf(req.user.id);

        if (userIndex === -1) {
            comment.likes.push(req.user.id);

            // Send notification to comment author
            await createNotification({
                recipientId: comment.author,
                senderId: req.user.id,
                type: 'like',
                message: `${req.user.username} liked your comment`,
                postId: comment.post,
                commentId: comment._id
            });
        } else {
            comment.likes.splice(userIndex, 1);
        }

        await comment.save();

        res.json({
            message: userIndex === -1 ? 'Comment liked' : 'Comment unliked',
            likes: comment.likes
        });
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({ error: 'Server error liking comment' });
    }
});

// Reply to comment
router.post('/comments/:id/reply', isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        const parentComment = await Comment.findById(req.params.id);

        if (!parentComment) {
            return res.status(404).json({ error: 'Parent comment not found' });
        }

        const reply = new Comment({
            content,
            author: req.user.id,
            post: parentComment.post,
            parentComment: parentComment._id
        });

        await reply.save();

        // Add reply to parent comment's replies array
        parentComment.replies.push(reply._id);
        await parentComment.save();

        await reply.populate('author', 'username avatar');

        // Send notification to parent comment author
        await createNotification({
            recipientId: parentComment.author,
            senderId: req.user.id,
            type: 'reply',
            message: `${req.user.username} replied to your comment`,
            postId: parentComment.post,
            commentId: reply._id
        });

        res.status(201).json({ message: 'Reply added', reply });
    } catch (error) {
        console.error('Reply comment error:', error);
        res.status(500).json({ error: 'Server error replying to comment' });
    }
});

export default router;

import express from 'express';
import Snippet from '../models/Snippet.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';

const router = express.Router();

// Get all snippets (feed)
router.get('/', async (req, res) => {
    try {
        const { language, tag, search, page = 1, limit = 10 } = req.query;
        const query = {};

        if (language) query.language = language;
        if (tag) query.tags = tag;
        if (req.query.author) query.author = req.query.author;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

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
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get snippets error:', error);
        res.status(500).json({ error: 'Server error fetching snippets' });
    }
});

// Get single snippet
router.get('/:id', async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id)
            .populate('author', 'username avatar bio isVerified');

        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        res.json({ snippet });
    } catch (error) {
        console.error('Get snippet error:', error);
        res.status(500).json({ error: 'Server error fetching snippet' });
    }
});

// Create new snippet or project
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { title, description, code, language, tags, type, files, previewUrl, copyRestricted } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Validation for single snippet vs project
        if (type === 'project') {
            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'Project must have at least one file' });
            }
        } else {
            if (!code) {
                return res.status(400).json({ error: 'Code is required for single snippets' });
            }
        }

        const newSnippet = new Snippet({
            author: req.user._id,
            title,
            description,
            code: code || (files && files[0]?.content) || '', // Fallback for project preview
            language,
            tags,
            type: type || 'single',
            files: files || [],
            previewUrl,
            copyRestricted: copyRestricted || false
        });

        await newSnippet.save();

        // Populate author info
        await newSnippet.populate('author', 'username avatar isVerified');

        res.status(201).json({ message: 'Snippet created successfully', snippet: newSnippet });
    } catch (error) {
        console.error('Error creating snippet:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update snippet
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);

        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        if (snippet.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own snippets' });
        }

        const { title, description, code, language, tags, previewUrl, copyRestricted } = req.body;

        if (title !== undefined) snippet.title = title;
        if (description !== undefined) snippet.description = description;
        if (code !== undefined) snippet.code = code;
        if (language !== undefined) snippet.language = language;
        if (tags !== undefined) snippet.tags = tags;
        if (previewUrl !== undefined) snippet.previewUrl = previewUrl;
        if (copyRestricted !== undefined) snippet.copyRestricted = copyRestricted;

        await snippet.save();
        await snippet.populate('author', 'username avatar isVerified');

        res.json({ message: 'Snippet updated successfully', snippet });
    } catch (error) {
        console.error('Update snippet error:', error);
        res.status(500).json({ error: 'Server error updating snippet' });
    }
});

// Delete snippet
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);

        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        if (snippet.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own snippets' });
        }

        await Snippet.findByIdAndDelete(req.params.id);

        res.json({ message: 'Snippet deleted successfully' });
    } catch (error) {
        console.error('Delete snippet error:', error);
        res.status(500).json({ error: 'Server error deleting snippet' });
    }
});

// Like/Unlike snippet
router.post('/:id/like', isAuthenticated, async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);

        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        const likeIndex = snippet.likes.indexOf(req.user.id);

        if (likeIndex === -1) {
            // Like
            snippet.likes.push(req.user.id);
        } else {
            // Unlike
            snippet.likes.splice(likeIndex, 1);
        }

        await snippet.save();

        res.json({
            message: likeIndex === -1 ? 'Snippet liked' : 'Snippet unliked',
            likes: snippet.likes
        });
    } catch (error) {
        console.error('Like snippet error:', error);
        res.status(500).json({ error: 'Server error liking snippet' });
    }
});

export default router;

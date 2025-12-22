import express from 'express';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import Report from '../models/Report.js';

const router = express.Router();

// Create a new report
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ error: 'Target type, ID, and reason are required' });
        }

        const report = new Report({
            reporter: req.user.id,
            targetType,
            targetId,
            reason,
            description
        });

        await report.save();

        res.status(201).json({
            message: 'Thank you for your report. Our moderators will review it shortly.',
            reportId: report._id
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Server error creating report' });
    }
});

export default router;

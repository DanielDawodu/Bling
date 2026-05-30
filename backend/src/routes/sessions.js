import express from 'express';
import Session from '../models/Session.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';

const router = express.Router();

// Get active sessions for the logged-in user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id, active: true })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ sessions });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// Revoke a specific session by its sessionId
router.delete('/:sessionId', isAuthenticated, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const result = await Session.findOneAndUpdate(
      { user: req.user._id, sessionId },
      { active: false },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session revoked', session: result });
  } catch (err) {
    console.error('Error revoking session:', err);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

export default router;

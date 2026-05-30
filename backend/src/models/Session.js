// backend/src/models/Session.js
import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true }, // matches express-session ID
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  device: { type: String }, // parsed from userAgent (optional)
  location: { type: String }, // placeholder for geo lookup
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true }
});

// Index for efficient lookup of active sessions per user
SessionSchema.index({ user: 1, active: 1 });

export default mongoose.model('Session', SessionSchema);

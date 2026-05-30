import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    fiverr: { type: String, default: '' },
    upwork: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  githubId: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  pushSubscription: {
    endpoint: { type: String },
    keys: {
      p256dh: { type: String },
      auth: { type: String }
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  isSuspended: {
    type: Boolean,
    default: false
  },
  displayName: {
    type: String,
    default: ''
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorBackupCodes: {
    type: [String],
    default: []
  },
  developerMode: {
    type: Boolean,
    default: false
  },
  developerApiKey: {
    type: String,
    default: null
  },
  developerWebhookUrl: {
    type: String,
    default: ''
  },
  notificationSettings: {
    newFollowers: { type: Boolean, default: true },
    postLikes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    dms: { type: Boolean, default: true },
    jobApplications: { type: Boolean, default: true },
    blingAIUpdates: { type: Boolean, default: true }
  },
  privacyPreferences: {
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    dmPermission: { type: String, enum: ['everyone', 'following', 'nobody'], default: 'everyone' },
    showSynkId: { type: Boolean, default: true }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;

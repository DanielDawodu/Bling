import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure exactly 2 participants
conversationSchema.pre('save', function (next) {
    if (this.participants.length !== 2) {
        next(new Error('A conversation must have exactly 2 participants'));
    }
    next();
});

// Index for faster queries
conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

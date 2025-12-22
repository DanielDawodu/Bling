import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    code: {
        type: String
    },
    language: {
        type: String,
        required: true,
        default: 'javascript'
    },
    tags: [{
        type: String,
        trim: true
    }],
    type: {
        type: String,
        enum: ['single', 'project'],
        default: 'single'
    },
    files: [{
        path: { type: String, required: true },
        content: { type: String, required: true },
        language: { type: String, default: 'text' }
    }],
    previewUrl: {
        type: String,
        trim: true
    },
    copyRestricted: {
        type: Boolean,
        default: false
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
snippetSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for faster queries
snippetSchema.index({ author: 1, createdAt: -1 });
snippetSchema.index({ tags: 1 });
snippetSchema.index({ language: 1 });

const Snippet = mongoose.model('Snippet', snippetSchema);

export default Snippet;

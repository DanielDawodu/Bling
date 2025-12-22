import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    company: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'freelance'],
        required: true
    },
    salaryRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
    },
    requirements: [{
        type: String
    }],
    skills: [{
        type: String
    }],
    applicationDeadline: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicants: [{
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
jobSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ isActive: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;

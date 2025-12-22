import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resume: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'interview', 'offer', 'accepted', 'rejected'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    }
});

// Prevent duplicate applications
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Index for faster queries
jobApplicationSchema.index({ applicant: 1, appliedAt: -1 });
jobApplicationSchema.index({ job: 1, status: 1 });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

export default JobApplication;

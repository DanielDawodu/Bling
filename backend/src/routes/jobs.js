import express from 'express';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import multer from 'multer';
import path from 'path';
import { createNotification } from './notifications.js';

const router = express.Router();

import { storage as cloudinaryStorage } from '../config/cloudinary.js';

// Configure local storage (fallback)
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const storage = process.env.CLOUDINARY_CLOUD_NAME ? cloudinaryStorage : localStorage;

const uploadResume = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
}).single('resume');

// Get all jobs with optional filters
router.get('/', async (req, res) => {
    try {
        const { type, location, minSalary, maxSalary, search, page = 1, limit = 10 } = req.query;

        const query = { isActive: true };

        if (type) query.jobType = type;
        if (location) query.location = { $regex: location, $options: 'i' };
        if (minSalary) query['salaryRange.min'] = { $gte: parseInt(minSalary) };
        if (maxSalary) query['salaryRange.max'] = { $lte: parseInt(maxSalary) };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const jobs = await Job.find(query)
            .populate('postedBy', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Job.countDocuments(query);

        res.json({
            jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Server error fetching jobs' });
    }
});

// Get single job by ID
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('postedBy', 'username avatar bio');

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ job });
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Server error fetching job' });
    }
});

// Create new job
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { title, company, description, location, jobType, salaryRange, requirements, skills, applicationDeadline } = req.body;

        if (!title || !company || !description || !location || !jobType) {
            return res.status(400).json({ error: 'Required fields: title, company, description, location, jobType' });
        }

        const newJob = new Job({
            postedBy: req.user.id,
            title,
            company,
            description,
            location,
            jobType,
            salaryRange: salaryRange || { min: 0, max: 0, currency: 'USD' },
            requirements: requirements || [],
            skills: skills || [],
            applicationDeadline: applicationDeadline || null
        });

        await newJob.save();
        await newJob.populate('postedBy', 'username avatar');

        // Notify followers about new job
        const postedByUser = await User.findById(req.user.id);
        const followers = postedByUser.followers || [];

        for (const followerId of followers) {
            await createNotification({
                recipientId: followerId,
                senderId: req.user.id,
                type: 'job_posted',
                message: `${req.user.username} posted a new job: ${newJob.title}`,
                jobId: newJob._id
            });
        }

        res.status(201).json({ message: 'Job created successfully', job: newJob });
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Server error creating job' });
    }
});

// Update job
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own job postings' });
        }

        const { title, company, description, location, jobType, salaryRange, requirements, skills, applicationDeadline, isActive } = req.body;

        if (title !== undefined) job.title = title;
        if (company !== undefined) job.company = company;
        if (description !== undefined) job.description = description;
        if (location !== undefined) job.location = location;
        if (jobType !== undefined) job.jobType = jobType;
        if (salaryRange !== undefined) job.salaryRange = salaryRange;
        if (requirements !== undefined) job.requirements = requirements;
        if (skills !== undefined) job.skills = skills;
        if (applicationDeadline !== undefined) job.applicationDeadline = applicationDeadline;
        if (isActive !== undefined) job.isActive = isActive;

        await job.save();
        await job.populate('postedBy', 'username avatar');

        res.json({ message: 'Job updated successfully', job });
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ error: 'Server error updating job' });
    }
});

// Delete job
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own job postings' });
        }

        await Job.findByIdAndDelete(req.params.id);
        // Also delete associated applications
        await JobApplication.deleteMany({ job: req.params.id });

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Server error deleting job' });
    }
});

// Apply to a job
router.post('/:id/apply', isAuthenticated, (req, res) => {
    uploadResume(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Resume file is required' });
        }

        try {
            const job = await Job.findById(req.params.id);

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            if (!job.isActive) {
                return res.status(400).json({ error: 'This job is no longer accepting applications' });
            }

            // Check if already applied
            const existingApplication = await JobApplication.findOne({
                job: req.params.id,
                applicant: req.user.id
            });

            if (existingApplication) {
                return res.status(400).json({ error: 'You have already applied to this job' });
            }

            const resumeUrl = req.file.path && req.file.path.startsWith('http')
                ? req.file.path
                : `/uploads/resumes/${req.file.filename}`;

            const application = new JobApplication({
                job: req.params.id,
                applicant: req.user.id,
                resume: resumeUrl,
                coverLetter: req.body.coverLetter || ''
            });

            await application.save();

            // Add applicant to job's applicants array
            job.applicants.push(req.user.id);
            await job.save();

            // Send notification to job poster
            await createNotification({
                recipientId: job.postedBy,
                senderId: req.user.id,
                type: 'job_application',
                message: `${req.user.username} applied to your job: ${job.title}`,
                jobId: job._id
            });

            res.status(201).json({ message: 'Application submitted successfully', application });
        } catch (error) {
            console.error('Apply to job error:', error);
            if (error.code === 11000) {
                return res.status(400).json({ error: 'You have already applied to this job' });
            }
            res.status(500).json({ error: 'Server error submitting application' });
        }
    });
});

// Get applications for a job (owner only)
router.get('/:id/applications', isAuthenticated, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only job owner can view applications' });
        }

        const applications = await JobApplication.find({ job: req.params.id })
            .populate('applicant', 'username avatar email bio')
            .sort({ appliedAt: -1 });

        res.json({ applications });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Server error fetching applications' });
    }
});

// Update application status (owner only)
router.patch('/:id/applications/:appId', isAuthenticated, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only job owner can update application status' });
        }

        const application = await JobApplication.findById(req.params.appId);

        if (!application || application.job.toString() !== req.params.id) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const { status } = req.body;

        if (!['pending', 'under_review', 'interview', 'offer', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        application.status = status;
        if (status !== 'pending') {
            application.reviewedAt = Date.now();
        }

        await application.save();

        // Send notification to applicant about status change
        const statusMessages = {
            under_review: 'is now under review',
            interview: 'has moved to interview stage',
            offer: 'has received an offer',
            accepted: 'has been accepted',
            rejected: 'was not selected'
        };

        if (statusMessages[status]) {
            await createNotification({
                recipientId: application.applicant,
                senderId: req.user.id,
                type: 'job_status',
                message: `Your application for ${job.title} ${statusMessages[status]}`,
                jobId: job._id
            });
        }

        res.json({ message: 'Application status updated', application });
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ error: 'Server error updating application' });
    }
});

// Get user's posted jobs
router.get('/user/my-jobs', isAuthenticated, async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.id })
            .populate('postedBy', 'username avatar')
            .sort({ createdAt: -1 });

        // Get application counts for each job
        const jobsWithCounts = await Promise.all(
            jobs.map(async (job) => {
                const applicationCount = await JobApplication.countDocuments({ job: job._id });
                return {
                    ...job.toObject(),
                    applicationCount
                };
            })
        );

        res.json({ jobs: jobsWithCounts });
    } catch (error) {
        console.error('Get my jobs error:', error);
        res.status(500).json({ error: 'Server error fetching your jobs' });
    }
});

// Get user's applications
router.get('/user/my-applications', isAuthenticated, async (req, res) => {
    try {
        const applications = await JobApplication.find({ applicant: req.user.id })
            .populate({
                path: 'job',
                populate: {
                    path: 'postedBy',
                    select: 'username avatar'
                }
            })
            .sort({ appliedAt: -1 });

        res.json({ applications });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ error: 'Server error fetching your applications' });
    }
});

export default router;

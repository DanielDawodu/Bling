import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import ApplicationModal from '../components/ApplicationModal';
import ShareButton from '../components/ShareButton';
import './JobDetails.css';

function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const response = await jobAPI.getJob(id);
            setJob(response.data.job);

            // Check if user has already applied
            if (user && response.data.job.applicants) {
                setHasApplied(response.data.job.applicants.includes(user.id));
            }
        } catch (error) {
            console.error('Error fetching job:', error);
            alert('Job not found');
            navigate('/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleApplicationSuccess = () => {
        setHasApplied(true);
        setShowApplicationModal(false);
        fetchJobDetails(); // Refresh job data
    };

    const formatSalary = (salaryRange) => {
        if (!salaryRange || salaryRange.min === 0) return 'Salary not specified';
        return `${salaryRange.currency} ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()} per year`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner" />
            </div>
        );
    }

    if (!job) return null;

    const isOwner = user && job.postedBy && user.id === job.postedBy._id;

    return (
        <div className="job-details-page">
            <div className="job-details-header sticky-header">
                <button onClick={() => navigate(-1)} className="btn btn-icon">
                    <svg viewBox="0 0 24 24" className="icon-sm">
                        <path d="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-6 6c-.39.39-.39 1.023 0 1.414l6 6c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L7.414 13H20c.553 0 1-.447 1-1s-.447-1-1-1z" />
                    </svg>
                </button>
                <h1>Job Details</h1>
            </div>

            <div className="job-details-content">
                <div className="job-main">
                    <div className="job-header-card">
                        <div className="job-title-section">
                            <h1 className="job-title">{job.title}</h1>
                            <p className="job-company">{job.company}</p>

                            <div className="job-meta">
                                <span className="job-meta-item">
                                    <svg viewBox="0 0 24 24" className="icon-sm">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                    {job.location}
                                </span>
                                <span className="job-meta-item">
                                    <svg viewBox="0 0 24 24" className="icon-sm">
                                        <path d="M20 6h-3V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5 0H9V4h6v2z" />
                                    </svg>
                                    {job.jobType.replace('-', ' ')}
                                </span>
                                <span className="job-meta-item">
                                    <svg viewBox="0 0 24 24" className="icon-sm">
                                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                                    </svg>
                                    {formatSalary(job.salaryRange)}
                                </span>
                            </div>

                            <div className="job-posted">
                                Posted on {formatDate(job.createdAt)} by{' '}
                                <Link to={`/profile/${job.postedBy._id}`} className="poster-link">
                                    {job.postedBy.username}
                                </Link>
                            </div>
                        </div>

                        {!isOwner && user && (
                            <div className="job-actions">
                                {job.isActive ? (
                                    <button
                                        className={`btn ${hasApplied ? 'btn-outline' : 'btn-primary'} btn-lg apply-btn`}
                                        onClick={() => setShowApplicationModal(true)}
                                        disabled={hasApplied}
                                    >
                                        <svg viewBox="0 0 24 24" className="icon-sm" style={{ marginRight: '8px' }}>
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                        {hasApplied ? 'Applied' : 'Easy Apply'}
                                    </button>
                                ) : (
                                    <button className="btn btn-outline btn-lg apply-btn" disabled>
                                        Applications Closed
                                    </button>
                                )}
                                <ShareButton
                                    url={`/jobs/${id}`}
                                    title={`${job.title} at ${job.company}`}
                                    text={`Job opportunity: ${job.title} at ${job.company} - ${job.location}. Check it out on Bling!`}
                                    type="job"
                                />
                            </div>
                        )}
                    </div>

                    <div className="job-section">
                        <h2>Job Description</h2>
                        <div className="job-description">
                            {job.description}
                        </div>
                    </div>

                    {job.requirements && job.requirements.length > 0 && (
                        <div className="job-section">
                            <h2>Requirements</h2>
                            <ul className="requirements-list">
                                {job.requirements.map((req, idx) => (
                                    <li key={idx}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {job.skills && job.skills.length > 0 && (
                        <div className="job-section">
                            <h2>Skills & Technologies</h2>
                            <div className="skills-list">
                                {job.skills.map((skill, idx) => (
                                    <span key={idx} className="skill-badge">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {job.applicationDeadline && (
                        <div className="job-section">
                            <h2>Application Deadline</h2>
                            <p className="deadline-text">
                                Applications close on {formatDate(job.applicationDeadline)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="job-sidebar">
                    <div className="sidebar-card">
                        <h3>About the company</h3>
                        <p className="company-name">{job.company}</p>
                        <p className="company-location">{job.location}</p>
                    </div>

                    {job.applicants && job.applicants.length > 0 && (
                        <div className="sidebar-card">
                            <h3>Applicants</h3>
                            <p className="applicants-count">
                                {job.applicants.length} {job.applicants.length === 1 ? 'applicant' : 'applicants'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showApplicationModal && (
                <ApplicationModal
                    jobId={id}
                    jobTitle={job.title}
                    company={job.company}
                    onClose={() => setShowApplicationModal(false)}
                    onSuccess={handleApplicationSuccess}
                />
            )}
        </div>
    );
}

export default JobDetails;

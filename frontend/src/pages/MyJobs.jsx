import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../utils/api';
import './MyJobs.css';

function MyJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posted'); // 'posted' or 'applications'
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        if (activeTab === 'posted') {
            fetchMyJobs();
        } else {
            fetchMyApplications();
        }
    }, [activeTab]);

    const fetchMyJobs = async () => {
        try {
            setLoading(true);
            const response = await jobAPI.getMyJobs();
            setJobs(response.data.jobs);
        } catch (error) {
            console.error('Error fetching my jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyApplications = async () => {
        try {
            setLoading(true);
            const response = await jobAPI.getMyApplications();
            setApplications(response.data.applications);
        } catch (error) {
            console.error('Error fetching my applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
            try {
                await jobAPI.deleteJob(jobId);
                setJobs(jobs.filter(job => job._id !== jobId));
            } catch (error) {
                console.error('Error deleting job:', error);
                alert('Failed to delete job');
            }
        }
    };

    const handleToggleStatus = async (job) => {
        const newStatus = !job.isActive;
        const action = newStatus ? 'reopen' : 'close';

        if (window.confirm(`Are you sure you want to ${action} applications for this job?`)) {
            try {
                await jobAPI.updateJob(job._id, { isActive: newStatus });
                setJobs(jobs.map(j => j._id === job._id ? { ...j, isActive: newStatus } : j));
            } catch (error) {
                console.error('Error updating job status:', error);
                alert('Failed to update job status');
            }
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'accepted': return 'status-accepted';
            case 'rejected': return 'status-rejected';
            case 'under_review': return 'status-review';
            default: return 'status-pending';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="my-jobs-page">
            <div className="my-jobs-header sticky-header">
                <h1>My Career</h1>
                <div className="my-jobs-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'posted' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posted')}
                    >
                        Posted Jobs
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('applications')}
                    >
                        My Applications
                    </button>
                </div>
            </div>

            <div className="my-jobs-content">
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner" />
                    </div>
                ) : activeTab === 'posted' ? (
                    // Posted Jobs List
                    <div className="jobs-list">
                        {jobs.length === 0 ? (
                            <div className="empty-state">
                                <h3>You haven't posted any jobs yet</h3>
                                <Link to="/create-job" className="btn btn-primary">Post a Job</Link>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job._id} className="manage-job-card">
                                    <div className="manage-job-info">
                                        <Link to={`/jobs/${job._id}`} className="manage-job-title">
                                            {job.title}
                                        </Link>
                                        <p className="manage-job-company">{job.company} • {job.location}</p>
                                        <div className="manage-job-meta">
                                            <span>Posted {formatDate(job.createdAt)}</span>
                                            <span className="bullet">•</span>
                                            <span>{job.applicationCount || 0} Applicants</span>
                                            <span className="bullet">•</span>
                                            <span className={`status-badge ${job.isActive ? 'active' : 'closed'}`}>
                                                {job.isActive ? 'Active' : 'Closed'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="manage-job-actions">
                                        <Link to={`/jobs/${job._id}/applications`} className="btn btn-primary btn-sm">
                                            Manage Applications
                                        </Link>
                                        <button
                                            onClick={() => handleToggleStatus(job)}
                                            className={`btn btn-sm ${job.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                        >
                                            {job.isActive ? 'End Applications' : 'Reopen Job'}
                                        </button>
                                        <Link to={`/jobs/${job._id}`} className="btn btn-outline btn-sm">
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteJob(job._id)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // Applications List
                    <div className="applications-list">
                        {applications.length === 0 ? (
                            <div className="empty-state">
                                <h3>You haven't applied to any jobs yet</h3>
                                <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
                            </div>
                        ) : (
                            applications.map(app => (
                                <div key={app._id} className="application-card">
                                    <div className="app-info">
                                        <h3 className="app-job-title">
                                            {app.job ? (
                                                <Link to={`/jobs/${app.job._id}`}>{app.job.title}</Link>
                                            ) : (
                                                'Job Unavailable'
                                            )}
                                        </h3>
                                        <p className="app-company">
                                            {app.job ? app.job.company : 'Unknown Company'}
                                        </p>
                                        <p className="app-date">Applied on {formatDate(app.appliedAt)}</p>
                                    </div>
                                    <div className="app-status">
                                        <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                                            {app.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyJobs;

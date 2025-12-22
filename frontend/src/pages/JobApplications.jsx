import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobAPI } from '../utils/api';
import './JobApplications.css';

function JobApplications() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [jobRes, appsRes] = await Promise.all([
                jobAPI.getJob(id),
                jobAPI.getJobApplications(id)
            ]);
            setJob(jobRes.data.job);
            setApplications(appsRes.data.applications);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await jobAPI.updateApplicationStatus(id, appId, newStatus);
            setApplications(apps => apps.map(app =>
                app._id === appId ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'under_review': return 'status-review';
            case 'interview': return 'status-interview';
            case 'offer': return 'status-offer';
            case 'accepted': return 'status-accepted';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!job) return <div className="error-state">Job not found</div>;

    return (
        <div className="applications-page">
            <div className="applications-header sticky-header">
                <div className="header-left">
                    <button onClick={() => navigate('/my-jobs')} className="btn btn-icon">
                        <svg viewBox="0 0 24 24" className="icon-sm">
                            <path d="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-6 6c-.39.39-.39 1.023 0 1.414l6 6c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L7.414 13H20c.553 0 1-.447 1-1s-.447-1-1-1z" />
                        </svg>
                    </button>
                    <div>
                        <h1>Manage Applications</h1>
                        <p className="subtitle">{job.title}</p>
                    </div>
                </div>
            </div>

            <div className="applications-content">
                {applications.length === 0 ? (
                    <div className="empty-state">
                        <h3>No applications yet</h3>
                        <p>When candidates apply, they'll appear here.</p>
                    </div>
                ) : (
                    <div className="applications-grid">
                        {applications.map(app => (
                            <div key={app._id} className="applicant-card">
                                <div className="applicant-header">
                                    <div className="applicant-info">
                                        <img
                                            src={app.applicant.avatar || 'https://via.placeholder.com/40'}
                                            alt={app.applicant.username}
                                            className="applicant-avatar"
                                        />
                                        <div>
                                            <Link to={`/profile/${app.applicant._id}`} className="applicant-name">
                                                {app.applicant.username}
                                            </Link>
                                            <p className="applied-date">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <select
                                        className={`status-select ${getStatusColor(app.status)}`}
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="interview">Interview</option>
                                        <option value="offer">Offer</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="applicant-body">
                                    {app.coverLetter && (
                                        <div className="cover-letter">
                                            <h4>Cover Letter</h4>
                                            <p>{app.coverLetter}</p>
                                        </div>
                                    )}

                                    <div className="resume-section">
                                        <a
                                            href={`http://localhost:5001${app.resume}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="resume-link"
                                        >
                                            <svg viewBox="0 0 24 24" className="icon-sm">
                                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                            </svg>
                                            View Resume
                                        </a>
                                    </div>
                                </div>

                                <div className="applicant-actions">
                                    <Link to={`/profile/${app.applicant._id}`} className="btn btn-outline btn-sm">
                                        View Profile
                                    </Link>
                                    <Link to={`/messages/${app.applicant._id}`} className="btn btn-primary btn-sm">
                                        Message
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default JobApplications;

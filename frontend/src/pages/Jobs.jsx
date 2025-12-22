import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../utils/api';
import ShareButton from '../components/ShareButton';
import './Jobs.css';

function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        location: '',
        search: ''
    });

    useEffect(() => {
        fetchJobs();
    }, [filters]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.type) params.type = filters.type;
            if (filters.location) params.location = filters.location;
            if (filters.search) params.search = filters.search;

            const response = await jobAPI.getJobs(params);
            setJobs(response.data.jobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatSalary = (salaryRange) => {
        if (!salaryRange || salaryRange.min === 0) return 'Not specified';
        return `$${salaryRange.min.toLocaleString()} - $${salaryRange.max.toLocaleString()} ${salaryRange.currency}`;
    };

    const formatDate = (date) => {
        const now = new Date();
        const posted = new Date(date);
        const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
        <div className="jobs-page">
            <div className="jobs-header sticky-header">
                <h1>Jobs</h1>
                <div className="jobs-header-actions">
                    <Link to="/my-jobs" className="btn btn-outline">My Career</Link>
                    <Link to="/create-job" className="btn btn-primary">Post a Job</Link>
                </div>
            </div>

            <div className="jobs-content">
                <div className="jobs-filters">
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        className="search-input"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />

                    <select
                        className="filter-select"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="freelance">Freelance</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Location..."
                        className="location-input"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="empty-state">
                        <h3>No jobs found</h3>
                        <p>Try adjusting your filters or check back later for new opportunities.</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {jobs.map((job) => (
                            <Link key={job._id} to={`/jobs/${job._id}`} className="job-card">
                                <div className="job-card-header">
                                    <h3 className="job-title">{job.title}</h3>
                                    <span className={`job-type-badge ${job.jobType}`}>
                                        {job.jobType.replace('-', ' ')}
                                    </span>
                                </div>

                                <p className="job-company">{job.company}</p>

                                <div className="job-info">
                                    <span className="job-location">
                                        <svg viewBox="0 0 24 24" className="icon-sm">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                        {job.location}
                                    </span>
                                    <span className="job-salary">{formatSalary(job.salaryRange)}</span>
                                </div>

                                {job.skills && job.skills.length > 0 && (
                                    <div className="job-skills">
                                        {job.skills.slice(0, 3).map((skill, idx) => (
                                            <span key={idx} className="skill-tag">{skill}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="job-footer">
                                    <span className="job-posted">Posted {formatDate(job.createdAt)}</span>
                                    {job.applicants && job.applicants.length > 0 && (
                                        <span className="job-applicants">{job.applicants.length} applicants</span>
                                    )}
                                    <div className="job-share" onClick={(e) => e.preventDefault()}>
                                        <ShareButton
                                            url={`/jobs/${job._id}`}
                                            title={`${job.title} at ${job.company}`}
                                            text={`Job opportunity: ${job.title} at ${job.company} - ${job.location}`}
                                            type="job"
                                        />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Jobs;

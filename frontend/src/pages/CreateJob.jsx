import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../utils/api';
import './CreateJob.css';

function CreateJob() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        jobType: 'full-time',
        description: '',
        requirements: '',
        skills: '',
        minSalary: '',
        maxSalary: '',
        currency: 'USD',
        applicationDeadline: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.company || !formData.location || !formData.description) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            const jobData = {
                title: formData.title,
                company: formData.company,
                location: formData.location,
                jobType: formData.jobType,
                description: formData.description,
                requirements: formData.requirements.split('\n').filter(r => r.trim()),
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                salaryRange: {
                    min: parseInt(formData.minSalary) || 0,
                    max: parseInt(formData.maxSalary) || 0,
                    currency: formData.currency
                },
                applicationDeadline: formData.applicationDeadline || null
            };

            await jobAPI.createJob(jobData);
            alert('Job posted successfully!');
            navigate('/jobs');
        } catch (error) {
            console.error('Error creating job:', error);
            alert(error.response?.data?.error || 'Failed to create job posting');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-job-page">
            <div className="create-job-header sticky-header">
                <button onClick={() => navigate(-1)} className="btn btn-icon">
                    <svg viewBox="0 0 24 24" className="icon-sm">
                        <path d="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-6 6c-.39.39-.39 1.023 0 1.414l6 6c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L7.414 13H20c.553 0 1-.447 1-1s-.447-1-1-1z" />
                    </svg>
                </button>
                <h1>Post a Job</h1>
                <button
                    onClick={handleSubmit}
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                >
                    {loading ? 'Posting...' : 'Post Job'}
                </button>
            </div>

            <div className="create-job-content">
                <form onSubmit={handleSubmit} className="job-form">
                    <div className="form-section">
                        <h2>Job Details</h2>

                        <div className="form-group">
                            <label htmlFor="title">Job Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Senior Frontend Developer"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company">Company Name *</label>
                            <input
                                type="text"
                                id="company"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="e.g., Tech Innovations Inc."
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="location">Location *</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., Remote, New York, NY"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="jobType">Job Type *</label>
                                <select
                                    id="jobType"
                                    name="jobType"
                                    value={formData.jobType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="full-time">Full Time</option>
                                    <option value="part-time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="freelance">Freelance</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Job Description</h2>

                        <div className="form-group">
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the role, responsibilities, and what you're looking for..."
                                rows="8"
                                required
                            />
                            <small>Provide a detailed overview of the position</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="requirements">Requirements</label>
                            <textarea
                                id="requirements"
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                placeholder="List each requirement on a new line&#10;• 5+ years of React experience&#10;• Strong TypeScript skills&#10;• Experience with GraphQL"
                                rows="6"
                            />
                            <small>One requirement per line</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="skills">Skills & Technologies</label>
                            <input
                                type="text"
                                id="skills"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="React, TypeScript, Node.js, AWS (comma-separated)"
                            />
                            <small>Separate skills with commas</small>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Compensation & Timeline</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="minSalary">Minimum Salary</label>
                                <input
                                    type="number"
                                    id="minSalary"
                                    name="minSalary"
                                    value={formData.minSalary}
                                    onChange={handleChange}
                                    placeholder="80000"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="maxSalary">Maximum Salary</label>
                                <input
                                    type="number"
                                    id="maxSalary"
                                    name="maxSalary"
                                    value={formData.maxSalary}
                                    onChange={handleChange}
                                    placeholder="120000"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="currency">Currency</label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="CAD">CAD</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="applicationDeadline">Application Deadline</label>
                            <input
                                type="date"
                                id="applicationDeadline"
                                name="applicationDeadline"
                                value={formData.applicationDeadline}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <small>Optional - when applications will close</small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Posting Job...' : 'Post Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateJob;

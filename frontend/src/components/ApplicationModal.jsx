import React, { useState } from 'react';
import { jobAPI } from '../utils/api';
import './ApplicationModal.css';

function ApplicationModal({ jobId, jobTitle, company, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        resume: null,
        coverLetter: ''
    });
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please upload a PDF or Word document');
                return;
            }

            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }

            setFormData(prev => ({ ...prev, resume: file }));
            setFileName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.resume) {
            alert('Please upload your resume');
            return;
        }

        setLoading(true);

        try {
            const applicationData = new FormData();
            applicationData.append('resume', formData.resume);
            applicationData.append('coverLetter', formData.coverLetter);

            await jobAPI.applyToJob(jobId, applicationData);
            alert('Application submitted successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error submitting application:', error);
            alert(error.response?.data?.error || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="application-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Apply to {company}</h2>
                        <p className="modal-subtitle">{jobTitle}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" className="icon-md">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="application-form">
                    <div className="form-section">
                        <label className="form-label">Resume/CV *</label>
                        <div className="file-upload-area">
                            <input
                                type="file"
                                id="resume-upload"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            <label htmlFor="resume-upload" className="file-upload-label">
                                {fileName ? (
                                    <div className="file-selected">
                                        <svg viewBox="0 0 24 24" className="icon-md">
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                        </svg>
                                        <div>
                                            <p className="file-name">{fileName}</p>
                                            <p className="file-change">Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="file-prompt">
                                        <svg viewBox="0 0 24 24" className="icon-lg">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                        </svg>
                                        <p className="upload-text">Upload Resume</p>
                                        <p className="upload-hint">PDF, DOC, or DOCX (Max 5MB)</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="form-section">
                        <label htmlFor="coverLetter" className="form-label">
                            Cover Letter (Optional)
                        </label>
                        <textarea
                            id="coverLetter"
                            value={formData.coverLetter}
                            onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                            placeholder="Why are you a great fit for this role?"
                            rows="6"
                            className="cover-letter-input"
                        />
                        <small className="input-hint">
                            A personalized message can help your application stand out
                        </small>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !formData.resume}
                        >
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ApplicationModal;

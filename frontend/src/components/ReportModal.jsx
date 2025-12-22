import React, { useState } from 'react';
import { reportsAPI } from '../utils/api';
import './ApplicationModal.css'; // Reusing modal styles for consistency

const ReportModal = ({ isOpen, onClose, targetId, targetType }) => {
    const [reason, setReason] = useState('spam');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await reportsAPI.createReport({
                targetId,
                targetType,
                reason,
                description
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setDescription('');
            }, 2000);
        } catch (error) {
            console.error('Error reporting:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2>Report {targetType}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {success ? (
                    <div className="success-message" style={{ padding: '20px', textAlign: 'center' }}>
                        <p>Report submitted successfully. Thank you for helping keep Bling safe!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="application-form">
                        <div className="form-group">
                            <label>Why are you reporting this?</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="filter-select"
                                style={{ width: '100%', marginBottom: '15px' }}
                            >
                                <option value="spam">Spam or misleading</option>
                                <option value="harassment">Harassment or hate speech</option>
                                <option value="inappropriate">Inappropriate content</option>
                                <option value="plagiarism">Plagiarism / Intellectual property</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Additional Details (optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide more context..."
                                style={{ minHeight: '100px', width: '100%' }}
                            />
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-danger" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportModal;

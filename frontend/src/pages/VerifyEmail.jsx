import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Auth.css';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                const response = await authAPI.verifyEmail(token);
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verification failed. Token may be invalid or expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="auth-page">
            <div className="container container-sm">
                <div className="auth-card glass-card fade-in">
                    <div className="auth-header">
                        <h1>Email Verification</h1>
                    </div>

                    <div className="verify-status-container" style={{ textAlign: 'center', padding: '20px 0' }}>
                        {status === 'verifying' && (
                            <div className="verifying-content">
                                <div className="loading-spinner" style={{ margin: '0 auto 20px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                                <p>Verifying your email...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="success-content">
                                <div className="alert alert-success">
                                    {message}
                                </div>
                                <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'block' }}>Proceed to Login</Link>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="error-content">
                                <div className="alert alert-error">
                                    {message}
                                </div>
                                <Link to="/signup" className="btn btn-secondary" style={{ width: '100%', display: 'block' }}>Back to Signup</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;

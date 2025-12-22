import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './ForgotPassword.css'; // Reusing styles
import { Star, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus({ type: 'error', message: 'Invalid or missing reset token.' });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setStatus({ type: 'error', message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await authAPI.resetPassword({ token, password });
            setStatus({ type: 'success', message: response.data.message });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data?.error || 'Failed to reset password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <Star className="logo-icon" />
                    <h1>Create New Password</h1>
                    <p>Enter your new password below to regain access to your account.</p>
                </div>

                {!token ? (
                    <div className="status-message error">
                        Invalid reset link. <Link to="/forgot-password">Request a new one</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <div className="form-group">
                            <label htmlFor="password">New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {status.message && (
                            <div className={`status-message ${status.type}`}>
                                {status.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading || status.type === 'success'}
                        >
                            {loading ? 'Resetting...' : 'Update Password'}
                        </button>
                    </form>
                )}

                <div className="forgot-password-footer">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

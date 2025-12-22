import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import './EditProfile.css';

function EditProfile() {
    const navigate = useNavigate();
    const { user: currentUser, updateUser: updateAuthUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [formData, setFormData] = useState({
        bio: '',
        dateOfBirth: '',
        website: '',
        github: '',
        linkedin: '',
        twitter: ''
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [previewCover, setPreviewCover] = useState(null);

    // 2FA States
    const [is2FALoading, setIs2FALoading] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [twoFactorMessage, setTwoFactorMessage] = useState('');

    const { setup2FA, verify2FA, disable2FA } = useAuth();

    useEffect(() => {
        if (currentUser) {
            // Fetch fresh user data to ensure we have the latest
            const fetchUserData = async () => {
                try {
                    const response = await userAPI.getUser(currentUser.id);
                    const user = response.data.user;

                    setFormData({
                        bio: user.bio || '',
                        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                        website: user.socialLinks?.website || '',
                        github: user.socialLinks?.github || '',
                        linkedin: user.socialLinks?.linkedin || '',
                        twitter: user.socialLinks?.twitter || ''
                    });
                    setPreviewAvatar(user.avatar);
                    setPreviewCover(user.coverPhoto);
                } catch (error) {
                    console.error('Failed to fetch user data', error);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchUserData();
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'avatar') {
                setAvatarFile(file);
                setPreviewAvatar(URL.createObjectURL(file));
            } else if (type === 'cover') {
                setCoverFile(file);
                setPreviewCover(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Update text fields
            const updateData = {
                bio: formData.bio,
                dateOfBirth: formData.dateOfBirth,
                socialLinks: {
                    website: formData.website,
                    github: formData.github,
                    linkedin: formData.linkedin,
                    twitter: formData.twitter
                }
            };

            await userAPI.updateUser(currentUser.id, updateData);

            // Upload avatar if changed
            if (avatarFile) {
                const avatarFormData = new FormData();
                avatarFormData.append('avatar', avatarFile);
                await userAPI.uploadAvatar(currentUser.id, avatarFormData);
            }

            // Upload cover if changed
            if (coverFile) {
                const coverFormData = new FormData();
                coverFormData.append('avatar', coverFile); // Using same middleware which expects 'avatar' field name
                await userAPI.uploadCoverPhoto(currentUser.id, coverFormData);
            }

            // Fetch latest user data and update context
            const freshUserResponse = await userAPI.getUser(currentUser.id);
            updateAuthUser(freshUserResponse.data.user);

            navigate(`/profile/${currentUser.id}`);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup2FA = async () => {
        setIs2FALoading(true);
        const result = await setup2FA();
        if (result.success) {
            setQrCode(result.data.qrCode);
            setShow2FASetup(true);
        } else {
            alert(result.error);
        }
        setIs2FALoading(false);
    };

    const handleVerify2FA = async () => {
        setIs2FALoading(true);
        const result = await verify2FA(twoFactorToken);
        if (result.success) {
            setTwoFactorMessage(result.message);
            setShow2FASetup(false);
            setQrCode(null);
            setTwoFactorToken('');
        } else {
            alert(result.error);
        }
        setIs2FALoading(false);
    };

    const handleDisable2FA = async () => {
        if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;

        const token = window.prompt('Enter your current 2FA code to disable:');
        if (!token) return;

        setIs2FALoading(true);
        const result = await disable2FA(token);
        if (result.success) {
            setTwoFactorMessage(result.message);
        } else {
            alert(result.error);
        }
        setIs2FALoading(false);
    };

    if (initialLoading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-header">
                <div className="header-content">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <svg viewBox="0 0 24 24" className="back-icon"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
                    </button>
                    <h2>Edit Profile</h2>
                </div>
                <button type="submit" form="edit-profile-form" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className="edit-profile-content">
                <form id="edit-profile-form" onSubmit={handleSubmit}>

                    <div className="form-section">
                        <div className="cover-photo-section">
                            <div className="cover-preview">
                                {previewCover ? (
                                    <img src={previewCover} alt="Cover preview" />
                                ) : (
                                    <div className="cover-placeholder"></div>
                                )}
                                <div className="cover-overlay">
                                    <label htmlFor="cover-upload" className="btn btn-outline btn-sm">
                                        <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M19.708 22H4.292C3.028 22 2 20.972 2 19.708V7.375C2 6.111 3.028 5.083 4.292 5.083h2.146C6.665 3.326 8.169 2 10 2h4c1.831 0 3.335 1.326 3.563 3.083h2.146C20.972 5.083 22 6.111 22 7.375v12.333C22 20.972 20.972 22 19.708 22zM4.292 7.083c-.161 0-.292.131-.292.292v12.333c0 .161.131.292.292.292h15.417c.161 0 .292-.131.292-.292V7.375c0-.161-.131-.292-.292-.292h-2.472l-.333-2.556C16.732 3.587 15.616 3 14.5 3h-5c-1.116 0-2.232.587-2.607 1.535l-.333 2.548H4.292zM12 8.5c2.481 0 4.5 2.019 4.5 4.5s-2.019 4.5-4.5 4.5-4.5-2.019-4.5-4.5 2.019-4.5 4.5-4.5zM12 15.5c1.378 0 2.5-1.122 2.5-2.5s-1.122-2.5-2.5-2.5-2.5 1.122-2.5 2.5 1.122 2.5 2.5 2.5z"></path></g></svg>
                                    </label>
                                    <input
                                        type="file"
                                        id="cover-upload"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'cover')}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="avatar-section">
                            <div className="avatar-preview-container">
                                {previewAvatar ? (
                                    <img src={previewAvatar} alt="Avatar preview" className="avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder-lg">{currentUser?.username?.[0]}</div>
                                )}
                                <label htmlFor="avatar-upload" className="avatar-upload-btn">
                                    <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M19.708 22H4.292C3.028 22 2 20.972 2 19.708V7.375C2 6.111 3.028 5.083 4.292 5.083h2.146C6.665 3.326 8.169 2 10 2h4c1.831 0 3.335 1.326 3.563 3.083h2.146C20.972 5.083 22 6.111 22 7.375v12.333C22 20.972 20.972 22 19.708 22zM4.292 7.083c-.161 0-.292.131-.292.292v12.333c0 .161.131.292.292.292h15.417c.161 0 .292-.131.292-.292V7.375c0-.161-.131-.292-.292-.292h-2.472l-.333-2.556C16.732 3.587 15.616 3 14.5 3h-5c-1.116 0-2.232.587-2.607 1.535l-.333 2.548H4.292zM12 8.5c2.481 0 4.5 2.019 4.5 4.5s-2.019 4.5-4.5 4.5-4.5-2.019-4.5-4.5 2.019-4.5 4.5-4.5zM12 15.5c1.378 0 2.5-1.122 2.5-2.5s-1.122-2.5-2.5-2.5-2.5 1.122-2.5 2.5 1.122 2.5 2.5 2.5z"></path></g></svg>
                                </label>
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'avatar')}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={currentUser?.username || ''} disabled className="input-disabled" />
                        <span className="helper-text">Username cannot be changed</span>
                    </div>

                    <div className="form-group">
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-section-title">Social Links</div>

                    <div className="form-group">
                        <label>Website</label>
                        <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>GitHub</label>
                        <input
                            type="url"
                            name="github"
                            value={formData.github}
                            onChange={handleChange}
                            placeholder="https://github.com/username"
                        />
                    </div>

                    <div className="form-group">
                        <label>LinkedIn</label>
                        <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/username"
                        />
                    </div>

                    <div className="form-group">
                        <label>Twitter</label>
                        <input
                            type="url"
                            name="twitter"
                            value={formData.twitter}
                            onChange={handleChange}
                            placeholder="https://twitter.com/username"
                        />
                    </div>

                    <div className="form-section-title">Security (2-Factor Authentication)</div>

                    <div className="form-group security-card glass-card" style={{ padding: '20px', marginTop: '10px' }}>
                        {twoFactorMessage && <div className="alert alert-success">{twoFactorMessage}</div>}

                        {!currentUser?.isTwoFactorEnabled ? (
                            !show2FASetup ? (
                                <div>
                                    <p style={{ marginBottom: '15px', color: 'var(--color-text-secondary)' }}>Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to log in.</p>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSetup2FA}
                                        disabled={is2FALoading}
                                    >
                                        {is2FALoading ? 'Processing...' : 'Enable 2FA'}
                                    </button>
                                </div>
                            ) : (
                                <div className="setup-2fa-container">
                                    <p style={{ marginBottom: '15px' }}>1. Scan this QR code with your Authenticator app (Google Authenticator, Authy, etc.)</p>
                                    <div style={{ background: '#fff', padding: '10px', display: 'inline-block', borderRadius: '8px', marginBottom: '15px' }}>
                                        <img src={qrCode} alt="2FA QR Code" width="200" height="200" />
                                    </div>
                                    <p style={{ marginBottom: '10px' }}>2. Enter the 6-digit code from the app:</p>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        className="form-input"
                                        style={{ width: '150px', display: 'block', margin: '0 auto 15px', textAlign: 'center', fontSize: '20px', letterSpacing: '2px' }}
                                        value={twoFactorToken}
                                        onChange={(e) => setTwoFactorToken(e.target.value)}
                                        maxLength={6}
                                    />
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleVerify2FA}
                                            disabled={is2FALoading || twoFactorToken.length !== 6}
                                        >
                                            {is2FALoading ? 'Verifying...' : 'Verify & Enable'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => setShow2FASetup(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: 'var(--color-success)' }}>
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                    <span style={{ fontWeight: '600' }}>2FA is currently enabled</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={handleDisable2FA}
                                    disabled={is2FALoading}
                                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                >
                                    {is2FALoading ? 'Processing...' : 'Disable 2FA'}
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;

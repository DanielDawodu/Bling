import { userAPI, normalizeUrl } from '../utils/api';
import './EditProfileModal.css';

function EditProfileModal({ user, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        website: user.socialLinks?.website || '',
        github: user.socialLinks?.github || '',
        linkedin: user.socialLinks?.linkedin || '',
        twitter: user.socialLinks?.twitter || ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState(normalizeUrl(user.avatar));
    const [coverFile, setCoverFile] = useState(null);
    const [previewCover, setPreviewCover] = useState(normalizeUrl(user.coverPhoto));
    const [loading, setLoading] = useState(false);

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

            await userAPI.updateUser(user.id, updateData);

            // Upload avatar if changed
            if (avatarFile) {
                const avatarFormData = new FormData();
                avatarFormData.append('avatar', avatarFile);
                await userAPI.uploadAvatar(user.id, avatarFormData);
            }

            // Upload cover if changed
            if (coverFile) {
                const coverFormData = new FormData();
                coverFormData.append('avatar', coverFile); // Using same middleware which expects 'avatar' field name
                await userAPI.uploadCoverPhoto(user.id, coverFormData);
            }

            // Refresh parent
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content edit-profile-modal">
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group avatar-upload-section">
                            <div className="avatar-preview">
                                {previewAvatar ? (
                                    <img src={previewAvatar} alt="Avatar preview" />
                                ) : (
                                    <div className="avatar-placeholder">{user.username[0]}</div>
                                )}
                            </div>
                            <div className="file-input-wrapper">
                                <label htmlFor="avatar-upload" className="btn btn-outline btn-sm">
                                    Change Avatar
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

                        <div className="form-group">
                            <label>Cover Photo</label>
                            <div className="cover-upload-section" style={{
                                height: '100px',
                                backgroundColor: '#333',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                position: 'relative',
                                marginBottom: '10px'
                            }}>
                                {previewCover && (
                                    <img
                                        src={previewCover}
                                        alt="Cover preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                )}
                                <label
                                    htmlFor="cover-upload"
                                    style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        right: '10px',
                                        background: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Change Cover
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
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfileModal;

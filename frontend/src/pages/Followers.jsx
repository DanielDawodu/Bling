import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI } from '../utils/api';
import './FollowList.css';

function Followers() {
    const { id } = useParams();
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFollowers();
    }, [id]);

    const fetchFollowers = async () => {
        try {
            const response = await userAPI.getFollowers(id);
            setFollowers(response.data.followers);
        } catch (err) {
            setError('Failed to load followers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (error) return <div className="p-lg text-error">{error}</div>;

    return (
        <div className="follow-list-page">
            <div className="sticky-header">
                <div className="header-title">
                    <h2>Followers</h2>
                    <span className="header-subtitle">@{followers.length} followers</span>
                </div>
            </div>

            <div className="follow-list">
                {followers.length === 0 ? (
                    <div className="empty-state">
                        <h3>No followers yet</h3>
                        <p>When someone follows this account, they'll show up here.</p>
                    </div>
                ) : (
                    followers.map(user => (
                        <Link to={`/profile/${user._id}`} key={user._id} className="follow-item">
                            <div className="follow-avatar-wrapper">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.username} className="avatar avatar-md" />
                                ) : (
                                    <div className="avatar avatar-md avatar-placeholder">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="follow-content">
                                <div className="follow-header">
                                    <span className="follow-name">{user.username}</span>
                                    <span className="follow-handle">@{user.username}</span>
                                </div>
                                {user.bio && <p className="follow-bio">{user.bio}</p>}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

export default Followers;

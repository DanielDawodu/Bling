import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI } from '../utils/api';
import './FollowList.css';

function Following() {
    const { id } = useParams();
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFollowing();
    }, [id]);

    const fetchFollowing = async () => {
        try {
            const response = await userAPI.getFollowing(id);
            setFollowing(response.data.following);
        } catch (err) {
            setError('Failed to load following');
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
                    <h2>Following</h2>
                    <span className="header-subtitle">@{following.length} following</span>
                </div>
            </div>

            <div className="follow-list">
                {following.length === 0 ? (
                    <div className="empty-state">
                        <h3>Not following anyone</h3>
                        <p>When they follow someone, they'll show up here.</p>
                    </div>
                ) : (
                    following.map(user => (
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

export default Following;

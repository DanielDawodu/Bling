import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI, snippetAPI, adminAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import PostCard from '../components/PostCard';
import SnippetCard from '../components/SnippetCard';
import VerificationBadge from '../components/VerificationBadge';
import ShareButton from '../components/ShareButton';

import './Profile.css';

function Profile() {
    const { id } = useParams();
    const { user: currentUser, updateUser, isAdmin } = useAuth();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [snippets, setSnippets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isFollowing, setIsFollowing] = useState(false);


    const isOwnProfile = currentUser && currentUser.id === id;

    useEffect(() => {
        if (currentUser && currentUser.following && profile) {
            // Check if the profile's ID (as string) is in the following array
            setIsFollowing(currentUser.following.includes(id) || currentUser.following.includes(profile.id));
        }
    }, [currentUser, profile, id]);

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
        fetchUserSnippets();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const response = await userAPI.getUser(id);
            setProfile(response.data.user);
        } catch (err) {
            console.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const response = await userAPI.getUserPosts(id);
            setPosts(response.data.posts);
        } catch (err) {
            console.error('Failed to load posts');
        }
    };

    const fetchUserSnippets = async () => {
        try {
            const response = await snippetAPI.getSnippets({ author: id });
            setSnippets(response.data.snippets);
        } catch (err) {
            console.error('Failed to load snippets');
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser) return;
        try {
            if (isFollowing) {
                await userAPI.unfollowUser(id);
                setIsFollowing(false);
                setProfile(prev => ({ ...prev, followersCount: (prev.followersCount || 0) - 1 }));
                updateUser({
                    ...currentUser,
                    following: currentUser.following.filter(uid => uid !== id && uid !== profile.id)
                });
            } else {
                await userAPI.followUser(id);
                setIsFollowing(true);
                setProfile(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
                const newFollowing = [...(currentUser.following || [])];
                if (!newFollowing.includes(id)) {
                    newFollowing.push(id);
                }
                updateUser({
                    ...currentUser,
                    following: newFollowing
                });
            }
        } catch (err) {
            console.error('Failed to toggle follow', err);
            alert(err.response?.data?.error || 'Failed to toggle follow');
        }
    };

    const handleAdminDeletePost = async (postId) => {
        if (!window.confirm('Admin: Are you sure you want to delete this post?')) return;
        try {
            await adminAPI.deletePost(postId);
            setPosts(posts.filter(p => p._id !== postId));
            alert('Post deleted by admin');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    const handleAdminDeleteSnippet = async (snippetId) => {
        if (!window.confirm('Admin: Are you sure you want to delete this snippet?')) return;
        try {
            await adminAPI.deleteSnippet(snippetId);
            setSnippets(snippets.filter(s => s._id !== snippetId));
            alert('Snippet deleted by admin');
        } catch (error) {
            console.error('Error deleting snippet:', error);
            alert('Failed to delete snippet');
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!profile) return <div className="p-lg text-error">Profile not found</div>;

    return (
        <div className="profile-page">
            <div className="profile-header sticky-header">
                <div className="header-back">
                    <Link to="/" className="back-btn">
                        <svg viewBox="0 0 24 24" className="back-icon"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
                    </Link>
                    <div className="header-info">
                        <h2>{profile.username}</h2>
                        <span className="post-count">{posts.length} posts</span>
                    </div>
                </div>
            </div>

            <div className="profile-banner">
                {profile.coverPhoto ? (
                    <img
                        src={profile.coverPhoto}
                        alt="Cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div className="banner-placeholder" style={{ backgroundColor: '#333', width: '100%', height: '100%' }}></div>
                )}
            </div>

            <div className="profile-details">
                <div className="profile-top-row">
                    <div className="profile-avatar-container">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt={profile.username} className="profile-avatar-lg" />
                        ) : (
                            <div className="profile-avatar-lg avatar-placeholder">
                                {profile.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <Link
                                to="/settings/profile"
                                className="btn btn-outline btn-sm edit-profile-btn"
                            >
                                Edit profile
                            </Link>
                        ) : (
                            <>
                                <Link to={`/messages/${id}`} className="btn btn-outline btn-icon">
                                    <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></g></svg>
                                </Link>
                                <button
                                    className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'} follow-btn`}
                                    onClick={handleFollowToggle}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </>
                        )}
                        <ShareButton
                            url={`/profile/${id}`}
                            title={`${profile.username}'s profile on Bling`}
                            text={profile.bio || `Check out ${profile.username} on Bling - the developer social network!`}
                            type="profile"
                        />
                    </div>
                </div>

                <div className="profile-info-section">
                    <h1 className="profile-name">
                        {profile.username}
                        {profile.isVerified && <VerificationBadge size={24} />}
                    </h1>
                    <div className="profile-handle">@{profile.username}</div>

                    {profile.bio && <p className="profile-bio">{profile.bio}</p>}

                    <div className="profile-meta">
                        {profile.socialLinks?.website && (
                            <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="meta-item">
                                <svg viewBox="0 0 24 24" className="meta-icon"><g><path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64l1.42-1.42c2.73-2.73 7.16-2.73 9.9 0 2.73 2.74 2.73 7.17 0 9.9l-1.42 1.42-1.41-1.42 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-12.02.71l1.42-1.42 1.41 1.42-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.41 1.42 1.41-1.42 1.42c-2.73 2.73-7.16 2.73-9.9 0-2.73-2.74-2.73-7.17 0-9.9z"></path></g></svg>
                                {profile.socialLinks.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        <div className="meta-item">
                            <svg viewBox="0 0 24 24" className="meta-icon"><g><path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2z"></path></g></svg>
                            Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="profile-follow-stats">
                        <Link to={`/profile/${id}/following`} className="stat-link">
                            <span className="stat-value">{profile.followingCount || 0}</span>
                            <span className="stat-label">Following</span>
                        </Link>
                        <Link to={`/profile/${id}/followers`} className="stat-link">
                            <span className="stat-value">{profile.followersCount || 0}</span>
                            <span className="stat-label">Followers</span>
                        </Link>
                    </div>
                </div>

                <div className="profile-tabs">
                    {['Posts', 'Codes', 'Replies', 'Highlights', 'Media', 'Likes'].map((tab) => (
                        <div
                            key={tab}
                            className={`profile-tab ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                        >
                            <span>{tab}</span>
                            {activeTab === tab.toLowerCase() && <div className="tab-indicator" />}
                        </div>
                    ))}
                </div>

                <div className="profile-content">
                    {activeTab === 'posts' && (
                        <div className="posts-feed">
                            {posts.map(post => (
                                <div key={post._id} style={{ position: 'relative' }}>
                                    <PostCard post={post} />
                                    {isAdmin && !isOwnProfile && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleAdminDeletePost(post._id);
                                            }}
                                            className="btn btn-sm btn-outline-danger"
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                zIndex: 10,
                                                borderColor: 'var(--color-error)',
                                                color: 'var(--color-error)'
                                            }}
                                        >
                                            Delete (Admin)
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'codes' && (
                        <div className="snippets-grid">
                            {snippets.length > 0 ? (
                                snippets.map(snippet => (
                                    <div key={snippet._id} style={{ position: 'relative' }}>
                                        <SnippetCard snippet={snippet} />
                                        {isAdmin && !isOwnProfile && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleAdminDeleteSnippet(snippet._id);
                                                }}
                                                className="btn btn-sm btn-outline-danger"
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    zIndex: 10,
                                                    background: 'rgba(0,0,0,0.7)',
                                                    borderColor: 'var(--color-error)',
                                                    color: 'var(--color-error)'
                                                }}
                                            >
                                                Delete (Admin)
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">No snippets shared yet</div>
                            )}
                        </div>
                    )}
                    {/* Other tabs would go here */}
                </div>
            </div>


        </div >
    );
}

export default Profile;

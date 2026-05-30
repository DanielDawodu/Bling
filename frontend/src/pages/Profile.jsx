import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI, snippetAPI, adminAPI, normalizeUrl } from '../utils/api';
import { useAuth } from '../context/auth-context';
import PostCard from '../components/PostCard';
import SnippetCard from '../components/SnippetCard';
import VerificationBadge from '../components/VerificationBadge';
import ShareButton from '../components/ShareButton';

import './Profile.css';

/* ─── Helpers ─────────────────────────────────────────── */

/** Words per minute reading speed */
const WPM = 200;

function calcReadTime(text = '') {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / WPM));
    return `${minutes} min read`;
}

function getExcerpt(text = '', max = 160) {
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/** Build top-N tag stats from a list of posts */
function buildTopTags(posts = [], n = 3) {
    const freq = {};
    posts.forEach(post => {
        (post.tags || []).forEach(tag => {
            freq[tag] = (freq[tag] || 0) + 1;
        });
    });
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([tag, count]) => ({ tag, count }));
}

/* ─── SynkID Badge ────────────────────────────────────── */
function SynkIdBadge() {
    return (
        <span className="synkid-badge" aria-label="Powered by SynkID – unified developer identity">
            {/* Hexagon icon */}
            <svg className="synkid-hex" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2 L21.5 7.5 L21.5 16.5 L12 22 L2.5 16.5 L2.5 7.5 Z" />
                <text x="12" y="15.5" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="monospace">⚡</text>
            </svg>
            <span className="synkid-label">SynkID</span>
            <span className="synkid-tooltip" role="tooltip">
                🔐 Identity verified via SynkID — the unified developer identity standard
            </span>
        </span>
    );
}

/* ─── Article Card ────────────────────────────────────── */
function ArticleCard({ post }) {
    const readTime = calcReadTime(post.content);
    const excerpt = getExcerpt(post.content);

    return (
        <Link to={`/posts/${post._id}`} className="article-card">
            {post.images?.[0] && (
                <div className="article-card-thumb">
                    <img src={normalizeUrl(post.images[0])} alt="" />
                </div>
            )}
            <div className="article-card-body">
                <h3 className="article-card-title">{post.title}</h3>
                <p className="article-card-excerpt">{excerpt}</p>
                <div className="article-card-meta">
                    <span className="article-read-time">
                        <svg viewBox="0 0 24 24" className="meta-icon" aria-hidden="true">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                        </svg>
                        {readTime}
                    </span>
                    <span className="article-date">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {post.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="article-tag">#{tag}</span>
                    ))}
                </div>
            </div>
        </Link>
    );
}

/* ─── Developer Stats ─────────────────────────────────── */
function DevStats({ posts }) {
    const topTags = useMemo(() => buildTopTags(posts, 3), [posts]);

    if (topTags.length === 0) return null;

    // Pick a hue per tag deterministically
    const hues = [210, 160, 40];

    return (
        <div className="dev-stats-row" aria-label="Developer stats">
            {topTags.map(({ tag, count }, i) => (
                <div key={tag} className="dev-stat-chip" style={{ '--chip-hue': hues[i % hues.length] }}>
                    <span className="dev-stat-rank">#{i + 1}</span>
                    <span className="dev-stat-tag">{tag}</span>
                    <span className="dev-stat-count">{count} {count === 1 ? 'post' : 'posts'}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Profile ─────────────────────────────────────────── */
const TABS = ['Posts', 'Codes', 'Articles', 'Replies', 'Highlights', 'Likes'];

function Profile() {
    const { id } = useParams();
    const { user: currentUser, updateUser, isAdmin } = useAuth();

    const [profile, setProfile]       = useState(null);
    const [posts, setPosts]           = useState([]);
    const [articles, setArticles]     = useState([]);
    const [snippets, setSnippets]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [activeTab, setActiveTab]   = useState('posts');
    const [isFollowing, setIsFollowing] = useState(false);

    const isOwnProfile = currentUser && currentUser.id === id;

    /* Sync following state -------------------------------- */
    useEffect(() => {
        if (currentUser?.following && profile) {
            setIsFollowing(
                currentUser.following.includes(id) ||
                currentUser.following.includes(profile.id)
            );
        }
    }, [currentUser, profile, id]);

    /* Initial data fetch ---------------------------------- */
    useEffect(() => {
        setLoading(true);
        fetchProfile();
        fetchUserPosts();
        fetchUserArticles();
        fetchUserSnippets();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const res = await userAPI.getUser(id);
            setProfile(res.data.user);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const fetchUserPosts = async () => {
        try {
            const res = await userAPI.getUserPosts(id, { limit: 50 });
            setPosts(res.data.posts || []);
        } catch { /* ignore */ }
    };

    const fetchUserArticles = async () => {
        try {
            const res = await userAPI.getUserPosts(id, { type: 'article', limit: 50 });
            setArticles(res.data.posts || []);
        } catch { /* ignore */ }
    };

    const fetchUserSnippets = async () => {
        try {
            const res = await snippetAPI.getSnippets({ author: id });
            setSnippets(res.data.snippets || []);
        } catch { /* ignore */ }
    };

    /* Follow / Unfollow ----------------------------------- */
    const handleFollowToggle = async () => {
        if (!currentUser) return;
        try {
            if (isFollowing) {
                await userAPI.unfollowUser(id);
                setIsFollowing(false);
                setProfile(prev => ({ ...prev, followersCount: (prev.followersCount || 0) - 1 }));
                updateUser({ ...currentUser, following: currentUser.following.filter(uid => uid !== id && uid !== profile.id) });
            } else {
                await userAPI.followUser(id);
                setIsFollowing(true);
                setProfile(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
                const next = [...(currentUser.following || [])];
                if (!next.includes(id)) next.push(id);
                updateUser({ ...currentUser, following: next });
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to toggle follow');
        }
    };

    /* Admin delete --------------------------------------- */
    const handleAdminDeletePost = async (postId) => {
        if (!window.confirm('Admin: Delete this post?')) return;
        try {
            await adminAPI.deletePost(postId);
            setPosts(posts.filter(p => p._id !== postId));
        } catch { alert('Failed to delete post'); }
    };

    const handleAdminDeleteSnippet = async (snippetId) => {
        if (!window.confirm('Admin: Delete this snippet?')) return;
        try {
            await adminAPI.deleteSnippet(snippetId);
            setSnippets(snippets.filter(s => s._id !== snippetId));
        } catch { alert('Failed to delete snippet'); }
    };

    /* Loading / not-found --------------------------------- */
    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!profile) return <div className="p-lg text-error">Profile not found</div>;

    /* Cover gradient fallback ----------------------------- */
    const coverGradient = `linear-gradient(135deg,
        hsl(220 80% 14%) 0%,
        hsl(260 70% 18%) 50%,
        hsl(200 60% 16%) 100%)`;

    return (
        <div className="profile-page">
            {/* ── Sticky top bar ── */}
            <div className="profile-header sticky-header">
                <div className="header-back">
                    <Link to="/" className="back-btn" aria-label="Go back">
                        <svg viewBox="0 0 24 24" className="back-icon" aria-hidden="true">
                            <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
                        </svg>
                    </Link>
                    <div className="header-info">
                        <h2>{profile.displayName || profile.username}</h2>
                        <span className="post-count">{posts.length} posts</span>
                    </div>
                </div>
            </div>

            {/* ── Cover photo (3 : 1) ── */}
            <div className="profile-banner" aria-label="Cover photo">
                {profile.coverPhoto ? (
                    <img
                        src={normalizeUrl(profile.coverPhoto)}
                        alt="Cover"
                        className="profile-cover-img"
                    />
                ) : (
                    <div className="banner-placeholder" style={{ background: coverGradient }} />
                )}
            </div>

            {/* ── Main details ── */}
            <div className="profile-details">
                {/* Avatar + action buttons row */}
                <div className="profile-top-row">
                    <div className="profile-avatar-container" aria-label="Profile picture">
                        {profile.avatar ? (
                            <img
                                src={normalizeUrl(profile.avatar)}
                                alt={profile.username}
                                className="profile-avatar-lg"
                            />
                        ) : (
                            <div className="profile-avatar-lg avatar-placeholder">
                                {profile.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <Link to="/settings/profile" className="btn btn-outline btn-sm edit-profile-btn">
                                Edit profile
                            </Link>
                        ) : (
                            <>
                                <Link to={`/messages/${id}`} className="btn btn-outline btn-icon" aria-label="Send message">
                                    <svg viewBox="0 0 24 24" className="icon-sm" aria-hidden="true">
                                        <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z" />
                                    </svg>
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
                            text={profile.bio || `Check out ${profile.username} on Bling!`}
                            type="profile"
                        />
                    </div>
                </div>

                {/* Name + handle + SynkID badge */}
                <div className="profile-info-section">
                    <h1 className="profile-name">
                        {profile.displayName || profile.username}
                        {profile.isVerified && <VerificationBadge size={22} />}
                        <SynkIdBadge />
                    </h1>
                    <div className="profile-handle">@{profile.username}</div>

                    {profile.bio && <p className="profile-bio">{profile.bio}</p>}

                    {/* Meta links (website, join date) */}
                    <div className="profile-meta">
                        {profile.socialLinks?.website && (
                            <a
                                href={profile.socialLinks.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="meta-item"
                            >
                                <svg viewBox="0 0 24 24" className="meta-icon" aria-hidden="true">
                                    <path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64l1.42-1.42c2.73-2.73 7.16-2.73 9.9 0 2.73 2.74 2.73 7.17 0 9.9l-1.42 1.42-1.41-1.42 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-12.02.71l1.42-1.42 1.41 1.42-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.41 1.42 1.41-1.42 1.42c-2.73 2.73-7.16 2.73-9.9 0-2.73-2.74-2.73-7.17 0-9.9z" />
                                </svg>
                                {profile.socialLinks.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        <div className="meta-item">
                            <svg viewBox="0 0 24 24" className="meta-icon" aria-hidden="true">
                                <path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2z" />
                            </svg>
                            Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Follow counts */}
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

                    {/* Developer Stats row */}
                    <DevStats posts={posts} />
                </div>

                {/* ── Tabs ── */}
                <div className="profile-tabs" role="tablist">
                    {TABS.map(tab => (
                        <div
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab.toLowerCase()}
                            className={`profile-tab ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && setActiveTab(tab.toLowerCase())}
                        >
                            <span>{tab}</span>
                            {activeTab === tab.toLowerCase() && <div className="tab-indicator" />}
                        </div>
                    ))}
                </div>

                {/* ── Tab content ── */}
                <div className="profile-content" role="tabpanel">

                    {/* Posts */}
                    {activeTab === 'posts' && (
                        <div className="posts-feed">
                            {posts.length === 0 && <div className="empty-state">No posts yet</div>}
                            {posts.map(post => (
                                <div key={post._id} style={{ position: 'relative' }}>
                                    <PostCard post={post} />
                                    {isAdmin && !isOwnProfile && (
                                        <button
                                            onClick={e => { e.preventDefault(); handleAdminDeletePost(post._id); }}
                                            className="btn btn-sm"
                                            style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, borderColor: 'var(--color-error)', color: 'var(--color-error)', background: 'rgba(0,0,0,.7)' }}
                                        >
                                            Delete (Admin)
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Codes / snippets */}
                    {activeTab === 'codes' && (
                        <div className="snippets-grid">
                            {snippets.length === 0
                                ? <div className="empty-state">No snippets shared yet</div>
                                : snippets.map(snippet => (
                                    <div key={snippet._id} style={{ position: 'relative' }}>
                                        <SnippetCard snippet={snippet} />
                                        {isAdmin && !isOwnProfile && (
                                            <button
                                                onClick={e => { e.preventDefault(); handleAdminDeleteSnippet(snippet._id); }}
                                                className="btn btn-sm"
                                                style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: 'rgba(0,0,0,.7)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                            >
                                                Delete (Admin)
                                            </button>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {/* Articles */}
                    {activeTab === 'articles' && (
                        <div className="articles-feed">
                            {articles.length === 0
                                ? <div className="empty-state">No articles published yet</div>
                                : articles.map(post => <ArticleCard key={post._id} post={post} />)
                            }
                        </div>
                    )}

                    {/* Placeholder tabs */}
                    {['replies', 'highlights', 'likes'].includes(activeTab) && (
                        <div className="empty-state">Nothing here yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;

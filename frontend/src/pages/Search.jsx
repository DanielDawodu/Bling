import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { searchAPI, userAPI, normalizeUrl } from '../utils/api';
import { useAuth } from '../context/auth-context';
import PostCard from '../components/PostCard';
import SnippetCard from '../components/SnippetCard';
import VerificationBadge from '../components/VerificationBadge';
import './Search.css';

/* ─── Who To Follow section ────────────────────────────── */
function WhoToFollow() {
    const { user: currentUser } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [followed, setFollowed] = useState({});

    useEffect(() => {
        userAPI.getSuggestions()
            .then(res => setSuggestions((res.data.suggestions || []).slice(0, 3)))
            .catch(() => {});
    }, []);

    if (suggestions.length === 0) return null;

    const handleFollow = async (userId) => {
        try {
            await userAPI.followUser(userId);
            setFollowed(prev => ({ ...prev, [userId]: true }));
        } catch { /* ignore */ }
    };

    return (
        <div className="who-to-follow">
            <h3 className="wtf-heading">Who to Follow</h3>
            {suggestions.map(s => {
                const avatarUrl = s.avatar ? normalizeUrl(s.avatar) : null;
                const isFollowing = followed[s._id] || (currentUser?.following || []).includes(String(s._id));
                return (
                    <div key={s._id} className="wtf-row">
                        <Link to={`/profile/${s._id}`} className="wtf-user-link">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={s.username} className="wtf-avatar" />
                            ) : (
                                <div className="wtf-avatar wtf-avatar-placeholder">
                                    {s.username[0].toUpperCase()}
                                </div>
                            )}
                            <div className="wtf-user-info">
                                <span className="wtf-name">
                                    {s.username}
                                    {s.isVerified && <VerificationBadge size={14} />}
                                </span>
                                <span className="wtf-handle">@{s.username}</span>
                                {s.bio && <span className="wtf-bio">{s.bio}</span>}
                            </div>
                        </Link>
                        <button
                            className={`btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'} wtf-follow-btn`}
                            onClick={() => !isFollowing && handleFollow(s._id)}
                            disabled={isFollowing}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main Search ──────────────────────────────────────── */
function Search() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const urlQuery  = new URLSearchParams(location.search).get('q') || '';

    const [inputValue, setInputValue] = useState(urlQuery);
    const [results, setResults]       = useState({ posts: [], users: [], snippets: [], jobs: [] });
    const [loading, setLoading]       = useState(false);
    const [activeTab, setActiveTab]   = useState('people');

    /* Sync input when URL query changes (e.g. browser back) */
    useEffect(() => {
        setInputValue(urlQuery);
    }, [urlQuery]);

    /* Fire search when URL query changes */
    useEffect(() => {
        if (urlQuery) {
            doSearch(urlQuery);
        } else {
            setResults({ posts: [], users: [], snippets: [], jobs: [] });
        }
    }, [urlQuery]);

    const doSearch = async (term) => {
        setLoading(true);
        try {
            const res = await searchAPI.globalSearch(term);
            const r   = res.data.results;
            setResults(r);
            // Auto-switch to first tab with results
            if (r.users.length > 0)        setActiveTab('people');
            else if (r.posts.length > 0)   setActiveTab('posts');
            else if (r.snippets.length > 0) setActiveTab('snippets');
            else if (r.jobs.length > 0)    setActiveTab('jobs');
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
        }
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
        // If user clears the input, update URL to drop the query
        if (!e.target.value.trim()) {
            navigate('/search', { replace: true });
        }
    };

    const hasQuery = urlQuery.trim().length > 0;

    const TABS = [
        { id: 'people',   label: 'People',   count: results.users.length   },
        { id: 'posts',    label: 'Posts',    count: results.posts.length   },
        { id: 'snippets', label: 'Snippets', count: results.snippets.length },
        { id: 'jobs',     label: 'Jobs',     count: results.jobs.length    },
    ];

    const renderResults = () => {
        if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

        switch (activeTab) {
            case 'people':
                return results.users.length > 0 ? (
                    <div className="users-results-list">
                        {results.users.map(user => (
                            <Link to={`/profile/${user._id}`} key={user._id} className="user-search-card">
                                <div className="user-search-info">
                                    {user.avatar ? (
                                        <img src={normalizeUrl(user.avatar)} alt={user.username} className="avatar avatar-lg" />
                                    ) : (
                                        <div className="avatar avatar-lg avatar-placeholder">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="user-details">
                                        <div className="user-name-row">
                                            <span className="user-name">{user.username}</span>
                                            {user.isVerified && <VerificationBadge size={16} />}
                                            <span className="user-handle">@{user.username}</span>
                                        </div>
                                        {user.bio && <p className="user-bio">{user.bio}</p>}
                                        <span className="user-followers-count">{user.followers?.length || 0} Followers</span>
                                    </div>
                                </div>
                                <button className="btn btn-outline btn-sm">View</button>
                            </Link>
                        ))}
                    </div>
                ) : <EmptyState query={urlQuery} />;

            case 'posts':
                return results.posts.length > 0
                    ? results.posts.map(post => <PostCard key={post._id} post={post} />)
                    : <EmptyState query={urlQuery} />;

            case 'snippets':
                return results.snippets.length > 0 ? (
                    <div className="snippets-grid">
                        {results.snippets.map(snippet => <SnippetCard key={snippet._id} snippet={snippet} />)}
                    </div>
                ) : <EmptyState query={urlQuery} />;

            case 'jobs':
                return results.jobs.length > 0 ? (
                    <div className="jobs-results-list">
                        {results.jobs.map(job => (
                            <Link to={`/jobs/${job._id}`} key={job._id} className="job-search-card">
                                <div className="job-search-header">
                                    <h3 className="job-title">{job.title}</h3>
                                    <span className={`job-type-badge ${job.jobType}`}>{job.jobType?.replace('-', ' ')}</span>
                                </div>
                                <p className="job-company">{job.company}</p>
                                <div className="job-info">
                                    <span>{job.location}</span>
                                    <span>•</span>
                                    <span>{job.salaryRange?.min > 0 ? `$${job.salaryRange.min.toLocaleString()} – $${job.salaryRange.max.toLocaleString()}` : 'Negotiable'}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : <EmptyState query={urlQuery} />;

            default: return null;
        }
    };

    return (
        <div className="search-page">
            {/* Sticky search bar */}
            <div className="search-header sticky-header">
                <div className="search-bar-container">
                    <div className="search-input-wrapper">
                        <div className="search-icon">
                            <svg viewBox="0 0 24 24" className="icon-sm">
                                <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="search-input-field"
                            placeholder="Search Bling"
                            value={inputValue}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            autoComplete="off"
                        />
                        {inputValue && (
                            <button
                                className="search-clear-btn"
                                onClick={() => { setInputValue(''); navigate('/search', { replace: true }); }}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs — only shown when there's an active search */}
                {hasQuery && (
                    <div className="search-tabs">
                        {TABS.map(tab => (
                            <div
                                key={tab.id}
                                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span>{tab.label}{tab.count > 0 ? ` (${tab.count})` : ''}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="search-results">
                {!hasQuery ? (
                    /* Empty state — show Who to Follow */
                    <WhoToFollow />
                ) : (
                    renderResults()
                )}
            </div>
        </div>
    );
}

function EmptyState({ query }) {
    return (
        <div className="empty-search">
            <h3>No results for "{query}"</h3>
            <p>Try searching for something else, or check your spelling.</p>
        </div>
    );
}

export default Search;

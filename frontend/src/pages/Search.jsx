import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { searchAPI } from '../utils/api';
import PostCard from '../components/PostCard';
import SnippetCard from '../components/SnippetCard';
import VerificationBadge from '../components/VerificationBadge';
import './Search.css';

function Search() {
    const [results, setResults] = useState({
        posts: [],
        users: [],
        snippets: [],
        jobs: []
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q');

    useEffect(() => {
        if (query) {
            handleSearch(query);
        }
    }, [query]);

    const handleSearch = async (searchTerm) => {
        setLoading(true);
        try {
            const response = await searchAPI.globalSearch(searchTerm);
            const r = response.data.results;
            setResults(r);

            // Auto-switch to first tab with results if current is empty
            if (activeTab === 'posts' && r.posts.length === 0) {
                if (r.users.length > 0) setActiveTab('users');
                else if (r.snippets.length > 0) setActiveTab('snippets');
                else if (r.jobs.length > 0) setActiveTab('jobs');
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderResults = () => {
        if (loading) {
            return <div className="loading-spinner"><div className="spinner" /></div>;
        }

        switch (activeTab) {
            case 'posts':
                return results.posts.length > 0 ? (
                    results.posts.map(post => <PostCard key={post._id} post={post} />)
                ) : <EmptyState query={query} />;

            case 'users':
                return results.users.length > 0 ? (
                    <div className="users-results-list">
                        {results.users.map(user => (
                            <Link to={`/profile/${user._id}`} key={user._id} className="user-search-card">
                                <div className="user-search-info">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.username} className="avatar avatar-lg" />
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
                                <button className="btn btn-outline btn-sm">View Profile</button>
                            </Link>
                        ))}
                    </div>
                ) : <EmptyState query={query} />;

            case 'snippets':
                return results.snippets.length > 0 ? (
                    <div className="snippets-grid">
                        {results.snippets.map(snippet => <SnippetCard key={snippet._id} snippet={snippet} />)}
                    </div>
                ) : <EmptyState query={query} />;

            case 'jobs':
                return results.jobs.length > 0 ? (
                    <div className="jobs-results-list">
                        {results.jobs.map(job => (
                            <Link to={`/jobs/${job._id}`} key={job._id} className="job-search-card">
                                <div className="job-search-header">
                                    <h3 className="job-title">{job.title}</h3>
                                    <span className={`job-type-badge ${job.jobType}`}>{job.jobType.replace('-', ' ')}</span>
                                </div>
                                <p className="job-company">{job.company}</p>
                                <div className="job-info">
                                    <span>{job.location}</span>
                                    <span>•</span>
                                    <span>{job.salaryRange && job.salaryRange.min > 0 ? `$${job.salaryRange.min.toLocaleString()} - $${job.salaryRange.max.toLocaleString()}` : 'Negotiable'}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : <EmptyState query={query} />;

            default:
                return null;
        }
    };

    return (
        <div className="search-page">
            <div className="search-header sticky-header">
                <div className="search-bar-container">
                    <div className="search-input-wrapper">
                        <div className="search-icon">
                            <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
                        </div>
                        <input
                            type="text"
                            className="search-input-field"
                            placeholder="Search Bling"
                            defaultValue={query || ''}
                            onKeyPress={(e) => e.key === 'Enter' && window.location.assign(`/search?q=${e.target.value}`)}
                        />
                    </div>
                </div>
                <div className="search-tabs">
                    <div
                        className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <span>Posts ({results.posts.length})</span>
                    </div>
                    <div
                        className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <span>People ({results.users.length})</span>
                    </div>
                    <div
                        className={`tab ${activeTab === 'snippets' ? 'active' : ''}`}
                        onClick={() => setActiveTab('snippets')}
                    >
                        <span>Snippets ({results.snippets.length})</span>
                    </div>
                    <div
                        className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <span>Jobs ({results.jobs.length})</span>
                    </div>
                </div>
            </div>

            <div className="search-results">
                {renderResults()}
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

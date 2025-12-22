import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postAPI, userAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import VerificationBadge from './VerificationBadge';
import './RightSidebar.css';

function RightSidebar() {
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [trending, setTrending] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrending();
        if (isAuthenticated) {
            fetchSuggestions();
        }
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchTrending();
            if (isAuthenticated) {
                fetchSuggestions();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const fetchTrending = async () => {
        try {
            const response = await postAPI.getTrendingTopics();
            setTrending(response.data.trending);
        } catch (error) {
            console.error('Error fetching trending topics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        try {
            const response = await userAPI.getSuggestions();
            setSuggestions(response.data.suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await userAPI.followUser(userId);
            // Remove followed user from suggestions
            setSuggestions(prev => prev.filter(user => user._id !== userId));
        } catch (error) {
            console.error('Error following user:', error);
            alert('Failed to follow user');
        }
    };

    return (
        <div className="right-sidebar">
            <div className="search-widget sticky-header">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="r-14j79pv r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-4wgw6l r-f727ji r-bnwqim r-1plcrui r-lrvibr"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            <div className="widget-card">
                <h2 className="widget-title">What's happening</h2>
                <div className="widget-content">
                    {loading ? (
                        <div className="widget-loading">Loading...</div>
                    ) : trending && trending.length > 0 ? (
                        trending.map((item) => (
                            <div
                                key={`${item.type}-${item._id}`}
                                className="trend-item"
                                onClick={() => {
                                    if (item.type === 'post') navigate(`/post/${item._id}`);
                                    else if (item.type === 'snippet') navigate(`/snippets/${item._id}`);
                                    else if (item.type === 'job') navigate(`/jobs/${item._id}`);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="trend-meta">
                                    {item.type === 'post' && (
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                            Trending Post · {item.author?.username || 'Unknown'}
                                            {item.author?.isVerified && <VerificationBadge size={12} />}
                                        </div>
                                    )}
                                    {item.type === 'snippet' && (
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                            Trending Snippet · {item.language || 'Code'}
                                            {item.author?.isVerified && <VerificationBadge size={12} />}
                                        </div>
                                    )}
                                    {item.type === 'job' && `Hot Job · ${item.company || 'Company'}`}
                                </div>
                                <div className="trend-name">
                                    {item.title || (item.content ? item.content.substring(0, 50) + '...' : 'Untitled')}
                                </div>
                                <div className="trend-count">
                                    {item.interactions || 0} {item.type === 'job' ? 'applicants' : 'interactions'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="widget-empty">No trending items yet</div>
                    )}
                </div>
            </div>

            <div className="widget-card">
                <h2 className="widget-title">Who to follow</h2>
                <div className="widget-content">
                    {suggestions && suggestions.length > 0 ? (
                        suggestions.map(user => (
                            <div key={user._id} className="follow-suggestion">
                                <div className="follow-avatar">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.username || 'User'} className="avatar-img" />
                                    ) : (
                                        <div className="avatar-placeholder">{user.username ? user.username[0].toUpperCase() : '?'}</div>
                                    )}
                                </div>
                                <div className="follow-info">
                                    <Link to={`/profile/${user._id}`} className="follow-name-link">
                                        <div className="follow-name">
                                            {user.username || 'Unknown'}
                                            {user.isVerified && <VerificationBadge size={12} />}
                                        </div>
                                    </Link>
                                    <div className="follow-handle">@{user.username || 'unknown'}</div>
                                </div>
                                <button
                                    className="btn btn-sm btn-secondary follow-btn"
                                    onClick={() => handleFollow(user._id)}
                                >
                                    Follow
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="widget-empty">No suggestions available</div>
                    )}
                </div>
            </div>

            <div className="sidebar-footer">
                <Link to="/terms">Terms of Service</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/cookies">Cookies Policy</Link>
                <Link to="/accessibility">Accessibility</Link>
                <Link to="/ads-info">Ads info</Link>
                <span>© 2025 Bling, Inc.</span>
            </div>
        </div>
    );
}

export default RightSidebar;

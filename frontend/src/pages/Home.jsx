import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postAPI } from '../utils/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/auth-context';
import SEO from '../components/SEO';
import './Home.css';

function Home() {
    const [posts, setPosts]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [page, setPage]         = useState(1);
    const [hasMore, setHasMore]   = useState(true);
    const [activeTab, setActiveTab] = useState('for-you');
    const [activePostId, setActivePostId] = useState(null);

    const { isAuthenticated, user } = useAuth();
    const observer = useRef();

    // Infinite scroll sentinel
    const lastPostRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => { fetchPosts(); }, [page, activeTab]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };
            const response = (activeTab === 'following' && isAuthenticated)
                ? await postAPI.getFollowingFeed(params)
                : await postAPI.getPosts(params);

            const newPosts   = response.data.posts;
            const totalPages = response.data.pagination.pages;

            setPosts(prev => {
                if (page === 1) return newPosts;
                const ids = new Set(prev.map(p => p._id));
                return [...prev, ...newPosts.filter(p => !ids.has(p._id))];
            });

            setHasMore(page < totalPages);
            setError('');
        } catch (err) {
            setError('Failed to load posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
            setPage(1);
            setPosts([]);
            setHasMore(true);
        }
    };

    return (
        <div className="home-feed">
            <SEO
                title="Home"
                description="Explore the latest from the developer community on Bling."
                url="/"
            />

            {/* ── Feed tabs ── */}
            <div className="feed-header sticky-header">
                <div className="feed-tabs">
                    <div
                        className={`feed-tab${activeTab === 'for-you' ? ' active' : ''}`}
                        onClick={() => handleTabChange('for-you')}
                    >
                        <span>// for you</span>
                        {activeTab === 'for-you' && <div className="tab-indicator" />}
                    </div>
                    {isAuthenticated && (
                        <div
                            className={`feed-tab${activeTab === 'following' ? ' active' : ''}`}
                            onClick={() => handleTabChange('following')}
                        >
                            <span>// following</span>
                            {activeTab === 'following' && <div className="tab-indicator" />}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Compose area ── */}
            {isAuthenticated && (
                <div className="compose-area">
                    <div className="compose-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="avatar avatar-md" />
                        ) : (
                            <div className="avatar avatar-md avatar-placeholder">
                                {user.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="compose-input-wrapper">
                        <Link to="/create-post" className="compose-placeholder">
                            // what are you shipping?
                        </Link>
                    </div>
                </div>
            )}

            {/* ── Feed content ── */}
            <div className="feed-content">
                {error && page === 1 && (
                    <div className="feed-error">
                        <p>{error}</p>
                        <button onClick={fetchPosts} className="btn btn-sm btn-primary">Retry</button>
                    </div>
                )}

                {!loading && posts.length === 0 && !error && (
                    <div className="empty-feed">
                        <h3>// no posts yet</h3>
                        <p>This is the best place to see what's shipping in the dev community. Follow some people to get started.</p>
                        <Link to="/search" className="btn btn-primary">Explore →</Link>
                    </div>
                )}

                {posts.map((post, index) => {
                    const isLast   = posts.length === index + 1;
                    const isActive = activePostId === post._id;
                    return (
                        <div
                            ref={isLast ? lastPostRef : null}
                            key={post._id}
                            onClick={() => setActivePostId(post._id)}
                        >
                            <PostCard post={post} isActive={isActive} />
                        </div>
                    );
                })}

                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner" />
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <div className="end-of-feed">
                        // end of feed — you're all caught up
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;

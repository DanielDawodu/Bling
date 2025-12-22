import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postAPI } from '../utils/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/auth-context';
import SEO from '../components/SEO';
import './Home.css';

function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState('for-you'); // 'for-you' or 'following'

    const { isAuthenticated, user } = useAuth();
    const observer = useRef();

    // Last element ref for infinite scroll
    const lastPostElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        fetchPosts();
    }, [page, activeTab]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };

            let response;
            if (activeTab === 'following' && isAuthenticated) {
                response = await postAPI.getFollowingFeed(params);
            } else {
                response = await postAPI.getPosts(params);
            }

            const newPosts = response.data.posts;
            const totalPages = response.data.pagination.pages;

            setPosts(prev => {
                // If page 1, replace. If > 1, append.
                // Also filter out duplicates just in case
                if (page === 1) return newPosts;

                const existingIds = new Set(prev.map(p => p._id));
                const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p._id));
                return [...prev, ...uniqueNewPosts];
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
            <div className="feed-header sticky-header">
                <div className="feed-tabs">
                    <div
                        className={`feed-tab ${activeTab === 'for-you' ? 'active' : ''}`}
                        onClick={() => handleTabChange('for-you')}
                    >
                        <span>For you</span>
                        {activeTab === 'for-you' && <div className="tab-indicator" />}
                    </div>
                    {isAuthenticated && (
                        <div
                            className={`feed-tab ${activeTab === 'following' ? 'active' : ''}`}
                            onClick={() => handleTabChange('following')}
                        >
                            <span>Following</span>
                            {activeTab === 'following' && <div className="tab-indicator" />}
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Tweet Area (Only if logged in) */}
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
                            What is happening?!
                        </Link>
                    </div>
                </div>
            )}

            {/* Posts Feed */}
            <div className="feed-content">
                {error && page === 1 && (
                    <div className="feed-error">
                        <p>{error}</p>
                        <button onClick={() => fetchPosts()} className="btn btn-sm btn-primary">Retry</button>
                    </div>
                )}

                {!loading && posts.length === 0 && !error && (
                    <div className="empty-feed">
                        <h3>Welcome to Bling!</h3>
                        <p>This is the best place to see what's happening in your world. Find some people and topics to follow now.</p>
                        <Link to="/search" className="btn btn-primary">Let's go!</Link>
                    </div>
                )}

                {posts.map((post, index) => {
                    if (posts.length === index + 1) {
                        return (
                            <div ref={lastPostElementRef} key={post._id}>
                                <PostCard post={post} />
                            </div>
                        );
                    } else {
                        return <PostCard key={post._id} post={post} />;
                    }
                })}

                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner" />
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <div className="end-of-feed">
                        <p>You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;

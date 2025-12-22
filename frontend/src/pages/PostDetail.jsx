import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postAPI, commentAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import CodeBlock from '../components/CodeBlock';
import './PostDetail.css';

function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [id]);

    useEffect(() => {
        if (post && user) {
            setIsLiked(post.likes?.some(like => like._id === user.id));
        }
    }, [post, user]);

    const fetchPost = async () => {
        try {
            const response = await postAPI.getPost(id);
            setPost(response.data.post);
            setError('');
        } catch (err) {
            setError('Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await commentAPI.getComments(id);
            setComments(response.data.comments);
        } catch (err) {
            console.error('Failed to load comments');
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            const response = await postAPI.likePost(id);
            setPost({ ...post, likes: response.data.likes });
            setIsLiked(!isLiked);
        } catch (err) {
            console.error('Failed to like post');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const response = await commentAPI.addComment(id, { content: commentText });
            setComments([response.data.comment, ...comments]);
            setCommentText('');
        } catch (err) {
            console.error('Failed to add comment');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await postAPI.deletePost(id);
            navigate('/');
        } catch (err) {
            alert('Failed to delete post');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="container" style={{ padding: '4rem 0' }}>
                <div className="alert alert-error">{error || 'Post not found'}</div>
            </div>
        );
    }

    const isAuthor = user && post.author._id === user.id;

    return (
        <div className="post-detail-page">
            <div className="container container-sm">
                <article className="post-detail glass-card fade-in">
                    {/* Post Header */}
                    <header className="post-header">
                        <h1 className="post-title">{post.title}</h1>

                        <div className="post-meta">
                            <Link to={`/profile/${post.author._id}`} className="author-link">
                                {post.author.avatar ? (
                                    <img src={post.author.avatar} alt={post.author.username} className="avatar" />
                                ) : (
                                    <div className="avatar avatar-placeholder">
                                        {post.author.username[0].toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div className="author-name">{post.author.username}</div>
                                    <div className="post-date">{formatDate(post.createdAt)}</div>
                                </div>
                            </Link>

                            {isAuthor && (
                                <div className="post-actions">
                                    <Link to={`/edit-post/${post._id}`} className="btn btn-secondary btn-sm">
                                        Edit
                                    </Link>
                                    <button onClick={handleDelete} className="btn btn-secondary btn-sm">
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Post Content */}
                    <div className="post-content">
                        <p>{post.content}</p>
                    </div>

                    {/* Code Snippet */}
                    {post.codeSnippet?.code && (
                        <div className="post-code">
                            <CodeBlock code={post.codeSnippet.code} language={post.codeSnippet.language} />
                        </div>
                    )}

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                        <div className="post-media">
                            <div className="media-grid">
                                {post.images.map((img, idx) => (
                                    <img key={idx} src={img} alt={`Post image ${idx + 1}`} className="media-image" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Videos */}
                    {post.videos && post.videos.length > 0 && (
                        <div className="post-media">
                            {post.videos.map((vid, idx) => (
                                <video key={idx} src={vid} controls className="media-video" />
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="post-tags">
                            {post.tags.map((tag, idx) => (
                                <span key={idx} className="badge badge-primary">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Like Button */}
                    <div className="post-interactions">
                        <button
                            onClick={handleLike}
                            className={`like-button ${isLiked ? 'liked' : ''}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 16 16" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor">
                                <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z" />
                            </svg>
                            <span>{post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}</span>
                        </button>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="comments-section glass-card">
                    <h2>Comments ({comments.length})</h2>

                    {isAuthenticated ? (
                        <form onSubmit={handleComment} className="comment-form">
                            <textarea
                                className="form-textarea"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={3}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}>
                                Post Comment
                            </button>
                        </form>
                    ) : (
                        <div className="login-prompt">
                            <Link to="/login" className="btn btn-primary">Login to comment</Link>
                        </div>
                    )}

                    <div className="comments-list">
                        {comments.map((comment) => (
                            <div key={comment._id} className="comment">
                                <Link to={`/profile/${comment.author._id}`} className="comment-author">
                                    {comment.author.avatar ? (
                                        <img src={comment.author.avatar} alt={comment.author.username} className="avatar avatar-sm" />
                                    ) : (
                                        <div className="avatar avatar-sm avatar-placeholder">
                                            {comment.author.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <Link to={`/profile/${comment.author._id}`} className="comment-author-name">
                                            {comment.author.username}
                                        </Link>
                                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="comment-text">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default PostDetail;

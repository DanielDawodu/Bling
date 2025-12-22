import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postAPI, commentAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import PostCard from '../components/PostCard';
import CommentItem from '../components/CommentItem';
import SEO from '../components/SEO';
import ShareButton from '../components/ShareButton';
import './PostDetails.css';

function PostDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPostAndComments();
    }, [id]);

    const fetchPostAndComments = async () => {
        try {
            const [postRes, commentsRes] = await Promise.all([
                postAPI.getPost(id),
                commentAPI.getComments(id)
            ]);
            setPost(postRes.data.post);

            // Build comment tree
            const allComments = commentsRes.data.comments;
            const commentMap = {};
            const rootComments = [];

            // First pass: Create map and initialize replies
            allComments.forEach(comment => {
                comment.replies = []; // Reset replies to ensure we use our constructed tree
                commentMap[comment._id] = comment;
            });

            // Second pass: Link comments
            allComments.forEach(comment => {
                if (comment.parentComment) {
                    const parent = commentMap[comment.parentComment];
                    if (parent) {
                        parent.replies.push(comment);
                    } else {
                        // Parent not found (maybe deleted), treat as root or orphan
                        // For now, let's treat as root to be safe, or ignore
                        rootComments.push(comment);
                    }
                } else {
                    rootComments.push(comment);
                }
            });

            // Sort root comments and replies by date (newest first)
            rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            Object.values(commentMap).forEach(comment => {
                comment.replies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            });

            setComments(rootComments);
        } catch (error) {
            console.error('Error fetching post details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const response = await commentAPI.addComment(id, { content: newComment });
            setComments([response.data.comment, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!post) return <div className="error-state">Post not found</div>;

    return (
        <div className="post-details-page">
            <SEO
                title={`${post.author.username}'s post`}
                description={post.content.slice(0, 160)}
                image={post.media && post.media.length > 0 ? post.media[0] : null}
                url={`/post/${post._id}`}
            />
            <div className="post-details-header sticky-header">
                <button onClick={() => navigate(-1)} className="btn btn-icon">
                    <svg viewBox="0 0 24 24" className="icon-sm">
                        <path d="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-6 6c-.39.39-.39 1.023 0 1.414l6 6c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L7.414 13H20c.553 0 1-.447 1-1s-.447-1-1-1z" />
                    </svg>
                </button>
                <h1>Post</h1>
                <ShareButton
                    url={`/post/${post._id}`}
                    title={`${post.author.username}'s post on Bling`}
                    text={post.content.substring(0, 100)}
                    type="post"
                />
            </div>

            <div className="post-details-content">
                <PostCard post={post} />

                <div className="comments-section">
                    <h3>Comments</h3>

                    <form onSubmit={handleCommentSubmit} className="comment-form">
                        <div className="comment-input-wrapper">
                            <img
                                src={user?.avatar || 'https://via.placeholder.com/40'}
                                alt={user?.username}
                                className="avatar avatar-sm"
                            />
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Post your reply"
                                className="comment-textarea"
                                rows="1"
                            />
                        </div>
                        <div className="comment-actions">
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={!newComment.trim() || submitting}
                            >
                                {submitting ? 'Posting...' : 'Reply'}
                            </button>
                        </div>
                    </form>

                    <div className="comments-list">
                        {comments.length > 0 ? (
                            comments.map(comment => (
                                <CommentItem key={comment._id} comment={comment} />
                            ))
                        ) : (
                            <div className="no-comments">No comments yet. Be the first to reply!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostDetails;

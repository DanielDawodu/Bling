import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { commentAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import VerificationBadge from './VerificationBadge';

function CommentItem({ comment, onReplyAdded }) {
    const { user } = useAuth();
    const [likes, setLikes] = useState(comment.likes || []);
    const [replies, setReplies] = useState(comment.replies || []);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isLiked = user && likes.includes(user.id);

    const handleLike = async () => {
        try {
            await commentAPI.likeComment(comment._id);
            if (isLiked) {
                setLikes(prev => prev.filter(id => id !== user.id));
            } else {
                setLikes(prev => [...prev, user.id]);
            }
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            const response = await commentAPI.replyComment(comment._id, { content: replyContent });
            setReplies(prev => [response.data.reply, ...prev]);
            setReplyContent('');
            setShowReplyForm(false);
            if (onReplyAdded) onReplyAdded();
        } catch (error) {
            console.error('Error replying to comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="comment-item">
            <div className="comment-main">
                <div className="comment-avatar">
                    <Link to={`/profile/${comment.author?._id}`}>
                        <img
                            src={comment.author?.avatar || 'https://via.placeholder.com/40'}
                            alt={comment.author?.username || 'User'}
                            className="avatar avatar-md"
                        />
                    </Link>
                </div>
                <div className="comment-content">
                    <div className="comment-header">
                        <Link to={`/profile/${comment.author?._id}`} className="comment-author">
                            {comment.author?.username || 'Unknown User'}
                            {comment.author?.isVerified && <VerificationBadge size={14} />}
                        </Link>
                        <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="comment-text">{comment.content}</p>

                    <div className="comment-actions-bar">
                        <button
                            className={`action-btn ${isLiked ? 'liked' : ''}`}
                            onClick={handleLike}
                        >
                            <svg viewBox="0 0 24 24" className="action-icon">
                                <path d={isLiked ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 12.24 3 10.5 3 7.42 3 5 5.42 5 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09zm-4.5 16.05l1.45-1.32C18.6 12.86 22 9.78 22 6.5 22 4.42 20.58 3 18.5 3c-1.74 0-3.41.81-4.5 2.09C12.91 3.81 11.24 3 9.5 3 7.42 3 6 4.42 6 6.5c0 3.28 3.4 6.36 8.55 11.04L12 19.05z"} />
                            </svg>
                            <span>{likes.length || ''}</span>
                        </button>

                        <button
                            className="action-btn"
                            onClick={() => setShowReplyForm(!showReplyForm)}
                        >
                            <svg viewBox="0 0 24 24" className="action-icon">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                            </svg>
                            <span>Reply</span>
                        </button>
                    </div>

                    {showReplyForm && (
                        <form onSubmit={handleReplySubmit} className="reply-form">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                rows="1"
                                autoFocus
                            />
                            <div className="reply-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowReplyForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    disabled={!replyContent.trim() || submitting}
                                >
                                    Reply
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {replies.length > 0 && (
                <div className="replies-list">
                    {replies.map(reply => (
                        <CommentItem key={reply._id} comment={reply} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommentItem;

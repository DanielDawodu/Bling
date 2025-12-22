import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { postAPI } from '../utils/api';
import VerificationBadge from './VerificationBadge';
import ReportModal from './ReportModal';
import ShareButton from './ShareButton';
import './PostCard.css';

function PostCard({ post, onDelete }) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.likes.includes(user.id));
    const [likesCount, setLikesCount] = useState(post.likes.length);
    const [reposted, setReposted] = useState(post.reposts?.some(id => id.toString() === user.id) || false);
    const [repostsCount, setRepostsCount] = useState(post.reposts?.length || 0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const handleLike = async () => {
        try {
            if (liked) {
                await postAPI.unlikePost(post._id);
                setLikesCount(prev => prev - 1);
            } else {
                await postAPI.likePost(post._id);
                setLikesCount(prev => prev + 1);
            }
            setLiked(!liked);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleRepost = async () => {
        try {
            await postAPI.repostPost(post._id);
            if (reposted) {
                setRepostsCount(prev => prev - 1);
            } else {
                setRepostsCount(prev => prev + 1);
            }
            setReposted(!reposted);
        } catch (error) {
            console.error('Error toggling repost:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            setIsDeleting(true);
            try {
                await postAPI.deletePost(post._id);
                if (onDelete) onDelete(post._id);
            } catch (error) {
                console.error('Error deleting post:', error);
                setIsDeleting(false);
            }
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now - postDate) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;

        return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <article className="tweet-card">
            <div className="tweet-avatar-col">
                <Link to={`/profile/${post.author._id}`}>
                    {post.author.avatar ? (
                        <img src={post.author.avatar} alt={post.author.username} className="avatar avatar-md" />
                    ) : (
                        <div className="avatar avatar-md avatar-placeholder">
                            {post.author.username[0].toUpperCase()}
                        </div>
                    )}
                </Link>
            </div>

            <div className="tweet-content-col">
                <div className="tweet-header">
                    <div className="tweet-user-meta">
                        <Link to={`/profile/${post.author._id}`} className="tweet-name">
                            {post.author.username}
                            {post.author.isVerified && <VerificationBadge />}
                        </Link>
                        <span className="tweet-handle">@{post.author.username}</span>
                        <span className="tweet-dot">·</span>
                        <span className="tweet-time">{formatTime(post.createdAt)}</span>
                    </div>

                    {user.id === post.author._id ? (
                        <button
                            className="tweet-more-btn"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            title="Delete post"
                        >
                            <svg viewBox="0 0 24 24" className="tweet-icon-sm">
                                <g><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"></path></g>
                            </svg>
                        </button>
                    ) : (
                        <button
                            className="tweet-more-btn report-btn-trigger"
                            onClick={() => setIsReportModalOpen(true)}
                            title="Report post"
                        >
                            <svg viewBox="0 0 24 24" className="tweet-icon-sm">
                                <g><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></g>
                            </svg>
                        </button>
                    )}
                </div>

                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    targetId={post._id}
                    targetType="post"
                />

                <div className="tweet-body">
                    <p>{post.content}</p>
                </div>

                {post.images && post.images.length > 0 && (
                    <div className="tweet-media">
                        {post.images.map((img, idx) => (
                            <img key={idx} src={img} alt="Post content" loading="lazy" />
                        ))}
                    </div>
                )}

                {post.videos && post.videos.length > 0 && (
                    <div className="tweet-media">
                        {post.videos.map((vid, idx) => (
                            <video key={idx} src={vid} controls className="tweet-video" />
                        ))}
                    </div>
                )}

                <div className="tweet-actions">
                    <Link to={`/post/${post._id}`} className="tweet-action-btn reply">
                        <div className="icon-bg">
                            <svg viewBox="0 0 24 24" className="tweet-action-icon"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>
                        </div>
                        <span className="action-count">{post.comments?.length || 0}</span>
                    </Link>

                    <button
                        className={`tweet-action-btn retweet ${reposted ? 'reposted' : ''}`}
                        onClick={handleRepost}
                    >
                        <div className="icon-bg">
                            <svg viewBox="0 0 24 24" className="tweet-action-icon"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>
                        </div>
                        <span className="action-count">{repostsCount}</span>
                    </button>

                    <button
                        className={`tweet-action-btn like ${liked ? 'liked' : ''}`}
                        onClick={handleLike}
                    >
                        <div className="icon-bg">
                            {liked ? (
                                <svg viewBox="0 0 24 24" className="tweet-action-icon"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.78 2.647-2.91 4.601-3.01 1.651-.09 3.368.5 4.798 2.01 1.429-1.51 3.147-2.1 4.796-2.01 1.954.1 3.714 1.23 4.605 3.01.894 1.81.846 4.17-.514 6.67z"></path></g></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" className="tweet-action-icon"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.78 2.647-2.91 4.601-3.01 1.651-.09 3.368.5 4.798 2.01 1.429-1.51 3.147-2.1 4.796-2.01 1.954.1 3.714 1.23 4.605 3.01.894 1.81.846 4.17-.514 6.67z"></path></g></svg>
                            )}
                        </div>
                        <span className="action-count">{likesCount}</span>
                    </button>

                    <ShareButton
                        url={`/post/${post._id}`}
                        title={`${post.author.username}'s post on Bling`}
                        text={post.content.substring(0, 100)}
                        type="post"
                    />
                </div>
            </div>
        </article>
    );
}

export default PostCard;

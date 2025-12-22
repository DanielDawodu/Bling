import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { snippetAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import CodeEditor from '../components/CodeEditor';
import FileTree from '../components/FileTree';
import SEO from '../components/SEO';
import ShareButton from '../components/ShareButton';
import './SnippetDetails.css';

function SnippetDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [snippet, setSnippet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchSnippet();
    }, [id]);

    const fetchSnippet = async () => {
        try {
            const response = await snippetAPI.getSnippet(id);
            const data = response.data.snippet;
            setSnippet(data);

            // If project, select first file by default
            if (data.type === 'project' && data.files && data.files.length > 0) {
                setSelectedFile(data.files[0]);
            }
        } catch (error) {
            console.error('Error fetching snippet:', error);
            alert('Snippet not found');
            navigate('/snippets');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const content = snippet.type === 'project' ? selectedFile?.content : snippet.code;
        navigator.clipboard.writeText(content || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLike = async () => {
        try {
            const response = await snippetAPI.likeSnippet(id);
            setSnippet({ ...snippet, likes: response.data.likes });
        } catch (error) {
            console.error('Error liking snippet:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this snippet?')) {
            try {
                await snippetAPI.deleteSnippet(id);
                navigate('/snippets');
            } catch (error) {
                console.error('Error deleting snippet:', error);
                alert('Failed to delete snippet');
            }
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!snippet) return null;

    const isOwner = user && snippet.author._id === user.id;
    const isLiked = user && snippet.likes.includes(user.id);

    return (
        <div className="snippet-details-page">
            <SEO
                title={`${snippet.title} | ${snippet.language} by ${snippet.author.username}`}
                description={`${snippet.description} - Shared on Bling`}
                url={`/snippets/${snippet._id}`}
                type="article"
            />
            <div className="snippet-details-header sticky-header">
                <button onClick={() => navigate(-1)} className="btn btn-icon">
                    <svg viewBox="0 0 24 24" className="icon-sm">
                        <path d="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-6 6c-.39.39-.39 1.023 0 1.414l6 6c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L7.414 13H20c.553 0 1-.447 1-1s-.447-1-1-1z" />
                    </svg>
                </button>
                <h1>{snippet.type === 'project' ? 'Project Details' : 'Snippet Details'}</h1>
                <ShareButton
                    url={`/snippets/${snippet._id}`}
                    title={snippet.title}
                    text={`Check out "${snippet.title}" - a ${snippet.language} ${snippet.type || 'snippet'} by ${snippet.author.username} on Bling!`}
                    type="code"
                />
            </div>

            <div className="snippet-details-content">
                <div className="snippet-meta-card">
                    <div className="snippet-title-section">
                        <h1 className="snippet-title-lg">{snippet.title}</h1>
                        <div className="snippet-author-info">
                            <img
                                src={snippet.author.avatar || 'https://via.placeholder.com/40'}
                                alt={snippet.author.username}
                                className="author-avatar-md"
                            />
                            <div className="author-details">
                                <Link to={`/profile/${snippet.author._id}`} className="author-name-lg">
                                    {snippet.author.username}
                                </Link>
                                <span className="snippet-date">
                                    Posted on {new Date(snippet.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="snippet-actions-bar">
                        <div className="left-actions">
                            <button
                                onClick={handleLike}
                                className={`btn btn-action ${isLiked ? 'liked' : ''}`}
                            >
                                <svg viewBox="0 0 24 24" className="icon-sm">
                                    <path d={isLiked ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"} />
                                </svg>
                                {snippet.likes.length}
                            </button>

                            {!snippet.copyRestricted && (
                                <button onClick={handleCopy} className="btn btn-action">
                                    <svg viewBox="0 0 24 24" className="icon-sm">
                                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                    </svg>
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            )}

                            {snippet.previewUrl && (
                                <a
                                    href={snippet.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-action btn-primary-glow"
                                >
                                    <svg viewBox="0 0 24 24" className="icon-sm">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                    </svg>
                                    Live Preview
                                </a>
                            )}
                        </div>

                        {isOwner && (
                            <button onClick={handleDelete} className="btn btn-danger btn-sm">
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                <div className="snippet-description">
                    <p>{snippet.description}</p>
                </div>

                {snippet.type === 'project' ? (
                    <div className={`project-view-container ${snippet.copyRestricted ? 'restricted-copy' : ''}`}>
                        <div className="project-sidebar">
                            <FileTree
                                files={snippet.files}
                                onSelectFile={setSelectedFile}
                                selectedFile={selectedFile}
                            />
                        </div>
                        <div className="project-content">
                            {selectedFile ? (
                                <>
                                    <div className="code-header">
                                        <span className="file-path">{selectedFile.path}</span>
                                        <span className="language-badge">{selectedFile.language}</span>
                                    </div>
                                    <CodeEditor
                                        code={selectedFile.content}
                                        language={selectedFile.language}
                                        readOnly={true}
                                    />
                                </>
                            ) : (
                                <div className="empty-file-state">
                                    <p>Select a file to view content</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`snippet-code-container ${snippet.copyRestricted ? 'restricted-copy' : ''}`}>
                        <div className="code-header">
                            <span className="language-badge">{snippet.language}</span>
                        </div>
                        <CodeEditor
                            code={snippet.code}
                            language={snippet.language}
                            readOnly={true}
                        />
                    </div>
                )}

                {snippet.tags && snippet.tags.length > 0 && (
                    <div className="snippet-tags-lg">
                        {snippet.tags.map((tag, idx) => (
                            <span key={idx} className="tag-lg">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SnippetDetails;

import React from 'react';
import { Link } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import VerificationBadge from './VerificationBadge';
import ShareButton from './ShareButton';
import './SnippetCard.css';

function SnippetCard({ snippet }) {
    const highlightPreview = (code) => {
        // Just basic highlighting for preview
        return Prism.highlight(code, Prism.languages.javascript, 'javascript');
    };

    return (
        <Link to={`/snippets/${snippet._id}`} className="snippet-card">
            <div className="snippet-header">
                <div className="snippet-info">
                    <img
                        src={snippet.author.avatar || 'https://via.placeholder.com/40'}
                        alt={snippet.author.username}
                        className="author-avatar"
                    />
                    <div>
                        <h3 className="snippet-title">{snippet.title}</h3>
                        <span className="author-name">
                            @{snippet.author.username}
                            {snippet.author.isVerified && <VerificationBadge size={14} />}
                        </span>
                    </div>
                </div>
                <span className="language-badge">{snippet.language}</span>
            </div>

            <div className="snippet-preview">
                {snippet.type === 'project' ? (
                    <div className="project-card-preview">
                        <div className="project-icon-large">
                            <svg viewBox="0 0 24 24" className="icon-xl">
                                <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                            </svg>
                        </div>
                        <div className="project-info-overlay">
                            <span className="project-badge">Project Repository</span>
                            <span className="file-count">
                                {snippet.files ? snippet.files.length : 0} Files
                            </span>
                        </div>
                    </div>
                ) : (
                    <Editor
                        value={snippet.code.slice(0, 150) + (snippet.code.length > 150 ? '...' : '')}
                        onValueChange={() => { }}
                        highlight={highlightPreview}
                        padding={10}
                        style={{
                            fontFamily: '"Fira Code", monospace',
                            fontSize: 12,
                            backgroundColor: 'transparent',
                            pointerEvents: 'none' // Disable interaction
                        }}
                        disabled
                    />
                )}
            </div>

            <div className="snippet-footer">
                <div className="snippet-stats">
                    <span className="stat-item">
                        <svg viewBox="0 0 24 24" className="icon-sm">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {snippet.likes.length}
                    </span>
                </div>
                {snippet.tags && snippet.tags.length > 0 && (
                    <div className="snippet-tags">
                        {snippet.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="tag">#{tag}</span>
                        ))}
                    </div>
                )}
                <div className="snippet-share" onClick={(e) => e.preventDefault()}>
                    <ShareButton
                        url={`/snippets/${snippet._id}`}
                        title={snippet.title}
                        text={`Check out this ${snippet.type || 'snippet'}: ${snippet.title} on Bling!`}
                        type="code"
                    />
                </div>
            </div>
        </Link>
    );
}

export default SnippetCard;

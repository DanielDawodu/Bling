import React, { useState } from 'react';
import './ShareButton.css';

const ShareButton = ({ url, title, text, type = 'post' }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    // Use environment variable for production URL, fallback to current origin
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const shareText = text || `Check out this ${type} on Bling!`;

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || `Bling ${type}`,
                    text: shareText,
                    url: fullUrl
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            setShowMenu(!showMenu);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const shareToTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    };

    const shareToLinkedIn = () => {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
        window.open(linkedInUrl, '_blank', 'width=600,height=400');
    };

    const shareToWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareToTelegram = () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramUrl, '_blank');
    };

    const shareToEmail = () => {
        const subject = encodeURIComponent(title || `Check this out on Bling`);
        const body = encodeURIComponent(`${shareText}\n\n${fullUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <div className="share-button-container">
            <button
                className="share-btn"
                onClick={handleNativeShare}
                title="Share"
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
                <span className="share-btn-text">Share</span>
            </button>

            {showMenu && (
                <>
                    <div className="share-overlay" onClick={() => setShowMenu(false)} />
                    <div className="share-menu">
                        <div className="share-menu-header">
                            <span>Share this {type}</span>
                            <button className="share-close" onClick={() => setShowMenu(false)}>×</button>
                        </div>
                        <div className="share-options">
                            <button onClick={copyToClipboard} className="share-option">
                                <span className="share-icon">📋</span>
                                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                            </button>
                            <button onClick={shareToTwitter} className="share-option">
                                <span className="share-icon">𝕏</span>
                                <span>X (Twitter)</span>
                            </button>
                            <button onClick={shareToLinkedIn} className="share-option">
                                <span className="share-icon">in</span>
                                <span>LinkedIn</span>
                            </button>
                            <button onClick={shareToWhatsApp} className="share-option">
                                <span className="share-icon">💬</span>
                                <span>WhatsApp</span>
                            </button>
                            <button onClick={shareToTelegram} className="share-option">
                                <span className="share-icon">✈️</span>
                                <span>Telegram</span>
                            </button>
                            <button onClick={shareToEmail} className="share-option">
                                <span className="share-icon">✉️</span>
                                <span>Email</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ShareButton;

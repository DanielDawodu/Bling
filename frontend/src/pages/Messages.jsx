import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { messageAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import './Messages.css';

function Messages() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const response = await messageAPI.getConversations();
            setConversations(response.data.conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diffInSeconds = Math.floor((now - msgDate) / 1000);

        if (diffInSeconds < 86400) {
            return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="messages-page">
            <div className="messages-header sticky-header">
                <h2>Messages</h2>
                <div className="header-actions">
                    <button className="btn btn-icon">
                        <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></g></svg>
                    </button>
                    <button className="btn btn-icon">
                        <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M10.54 1.75h2.92l1.57 2.36c.11.17.32.25.53.21l2.53-.59 2.33 2.33-.59 2.53c-.04.21.04.42.21.53l2.36 1.57v2.92l-2.36 1.57c-.17.11-.25.32-.21.53l.59 2.53-2.33 2.33-2.53-.59c-.21-.04-.42.04-.53.21l-1.57 2.36h-2.92l-1.57-2.36c-.11-.17-.32-.25-.53-.21l-2.53.59-2.33-2.33.59-2.53c.04-.21-.04-.42-.21-.53l-2.36-1.57v-2.92l2.36-1.57c.17-.11.25-.32.21-.53l-.59-2.53 2.33-2.33 2.53.59c.21.04.42-.04.53-.21l1.57-2.36zM12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"></path></g></svg>
                    </button>
                </div>
            </div>

            <div className="conversations-list">
                {conversations.length === 0 ? (
                    <div className="empty-messages">
                        <h3>Welcome to your inbox!</h3>
                        <p>Drop a line, share Tweets and more with private conversations between you and others on X.</p>
                        <button className="btn btn-primary btn-lg mt-md">Write a message</button>
                    </div>
                ) : (
                    conversations.map(conv => {
                        const otherParticipant = conv.participants.find(p => p._id !== user.id);
                        if (!otherParticipant) return null;

                        return (
                            <Link to={`/messages/${otherParticipant._id}`} key={conv._id} className="conversation-item">
                                <div className="conversation-avatar">
                                    {otherParticipant.avatar ? (
                                        <img src={otherParticipant.avatar} alt={otherParticipant.username} className="avatar avatar-md" />
                                    ) : (
                                        <div className="avatar avatar-md avatar-placeholder">
                                            {otherParticipant.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="conversation-content">
                                    <div className="conversation-meta">
                                        <span className="conversation-name">{otherParticipant.username}</span>
                                        <span className="conversation-handle">@{otherParticipant.username}</span>
                                        <span className="conversation-dot">·</span>
                                        <span className="conversation-time">{formatTime(conv.updatedAt)}</span>
                                    </div>
                                    <div className="conversation-preview">
                                        {conv.lastMessage?.content || 'Sent an attachment'}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default Messages;

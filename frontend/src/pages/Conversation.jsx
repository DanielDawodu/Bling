import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { messageAPI, userAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import { useNotifications } from '../context/NotificationContext';
import './Conversation.css';

function Conversation() {
    const { userId } = useParams();
    const { user } = useAuth();
    const { fetchUnreadCount } = useNotifications();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const lastMessageIdRef = useRef(null);

    useEffect(() => {
        fetchConversation();
        fetchOtherUser();

        // Poll for new messages every 3 seconds
        const interval = setInterval(() => {
            fetchConversation();
        }, 3000);

        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            // Scroll if this is the first load (lastMessageIdRef is null) 
            // or if the last message is different from what we saw before
            if (!lastMessageIdRef.current || lastMessage._id !== lastMessageIdRef.current) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                lastMessageIdRef.current = lastMessage._id;
            }
        }
    }, [messages]);

    const fetchOtherUser = async () => {
        try {
            const response = await userAPI.getUser(userId);
            setOtherUser(response.data.user);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const fetchConversation = async () => {
        try {
            const response = await messageAPI.getConversation(userId);
            setMessages(response.data.messages);
            // Update unread notification count as the backend marks notifications as read
            fetchUnreadCount();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 4) {
            alert('You can only upload up to 4 files');
            return;
        }
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return;

        setSending(true);
        try {
            let attachmentUrls = [];
            if (selectedFiles.length > 0) {
                setUploading(true);
                const formData = new FormData();
                selectedFiles.forEach(file => formData.append('files', file));
                const uploadRes = await messageAPI.uploadAttachments(formData);
                attachmentUrls = uploadRes.data.files;
                setUploading(false);
            }

            const response = await messageAPI.sendMessageWithAttachments({
                recipientId: userId,
                content: newMessage,
                attachments: attachmentUrls
            });

            setMessages([...messages, response.data.data]);
            setNewMessage('');
            setSelectedFiles([]);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
            setUploading(false);
        }
    };

    const renderAttachment = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return <img src={url} alt="Attachment" className="message-attachment" />;
        } else if (['mp4', 'webm'].includes(ext)) {
            return <video src={url} controls className="message-attachment" />;
        } else {
            return (
                <a href={url} target="_blank" rel="noopener noreferrer" className="message-file">
                    📄 {url.split('/').pop()}
                </a>
            );
        }
    };

    if (!otherUser) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="conversation-page">
            <div className="conversation-header sticky-header">
                <Link to="/messages" className="back-btn">
                    <svg viewBox="0 0 24 24" className="back-icon"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
                </Link>
                <Link to={`/profile/${otherUser.id}`} className="conversation-user-info">
                    {otherUser.avatar ? (
                        <img src={otherUser.avatar} alt={otherUser.username} className="avatar avatar-sm" />
                    ) : (
                        <div className="avatar avatar-sm avatar-placeholder">
                            {otherUser.username ? otherUser.username[0].toUpperCase() : '?'}
                        </div>
                    )}
                    <span className="conversation-username">{otherUser.username}</span>
                </Link>
                <div className="header-actions">
                    <button className="btn btn-icon">
                        <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M13.5 8.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S11.17 7 12 7s1.5.67 1.5 1.5zM13 17v-5h-2v5h2zm-1 5.25c5.66 0 10.25-4.59 10.25-10.25S17.66 1.75 12 1.75 1.75 6.34 1.75 12 6.34 22.25 12 22.25zM12 3.25c4.83 0 8.75 3.92 8.75 8.75s-3.92 8.75-8.75 8.75S3.25 16.83 3.25 12 7.17 3.25 12 3.25z"></path></g></svg>
                    </button>
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-conversation">
                        <div className="empty-content">
                            <h3>Send a message to {otherUser.username}</h3>
                            <p>Direct messages are private conversations between you and other people on X.</p>
                        </div>
                    </div>
                ) : (
                    <div className="messages-list">
                        {messages.map((message) => (
                            <div
                                key={message._id}
                                className={`message ${message.sender?._id === user.id ? 'sent' : 'received'}`}
                            >
                                <div className="message-bubble">
                                    {message.content && <p>{message.content}</p>}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="message-attachments">
                                            {message.attachments.map((url, idx) => (
                                                <div key={idx}>{renderAttachment(url)}</div>
                                            ))}
                                        </div>
                                    )}
                                    <span className="message-time">
                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="message-input-container">
                {selectedFiles.length > 0 && (
                    <div className="file-preview">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="file-preview-item">
                                <span>{file.name}</span>
                                <button type="button" onClick={() => removeFile(index)} className="remove-file-btn">×</button>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="message-input-form">
                    <button
                        type="button"
                        className="btn btn-icon attachment-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        style={{ display: 'none' }}
                    />
                    <input
                        type="text"
                        className="message-input"
                        placeholder="Start a new message"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        className="btn btn-icon send-btn"
                        disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                    >
                        <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M2.504 21.866l.526-2.108C3.04 19.757 4.57 13.9 4.57 13.9h10.34l-10.34-.869C4.57 13.031 3.04 7.173 3.03 7.173L2.504 5.065a.698.698 0 0 1 .858-.843l18.417 7.168a.698.698 0 0 1 0 1.306L3.362 19.866a.698.698 0 0 1-.858-.843z"></path></g></svg>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Conversation;

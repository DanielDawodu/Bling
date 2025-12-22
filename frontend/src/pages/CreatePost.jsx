import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../utils/api';
import './CreatePost.css';

function CreatePost() {
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file);
            setPreview(URL.createObjectURL(file));
            // Determine if it's image or video
            setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !mediaFile) return;

        setLoading(true);

        try {
            // Create the post first with title and content
            const title = content.trim().substring(0, 100) || 'Untitled';
            const response = await postAPI.createPost({
                title,
                content: content.trim()
            });

            // If there's media, upload it separately
            if (mediaFile && response.data.post) {
                const formData = new FormData();
                if (mediaType === 'image') {
                    formData.append('images', mediaFile);
                } else {
                    formData.append('videos', mediaFile);
                }
                await postAPI.uploadMedia(response.data.post._id, formData);
            }

            navigate('/');
        } catch (error) {
            console.error('Failed to create post:', error);
            alert(error.response?.data?.error || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-page">
            <div className="create-post-header sticky-header">
                <button onClick={() => navigate(-1)} className="btn btn-icon">
                    <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-6 6c-.39.39-.39 1.023 0 1.414l6 6c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L7.414 13H20c.553 0 1-.447 1-1s-.447-1-1-1z"></path></g></svg>
                </button>
                <button
                    onClick={handleSubmit}
                    className="btn btn-primary btn-sm"
                    disabled={(!content.trim() && !mediaFile) || loading}
                >
                    {loading ? 'Posting...' : 'Post'}
                </button>
            </div>

            <div className="create-post-form">
                <div className="input-area">
                    <textarea
                        className="post-textarea"
                        placeholder="What is happening?!"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        autoFocus
                    />
                </div>

                {preview && (
                    <div className="image-preview-container">
                        {mediaType === 'image' ? (
                            <img src={preview} alt="Preview" className="image-preview" />
                        ) : (
                            <video src={preview} controls className="image-preview" />
                        )}
                        <button onClick={() => { setMediaFile(null); setPreview(''); setMediaType(''); }} className="remove-image-btn">
                            <svg viewBox="0 0 24 24" className="icon-sm"><g><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></g></svg>
                        </button>
                    </div>
                )}

                <div className="post-tools">
                    <label className="tool-btn">
                        <input type="file" accept="image/*,video/*" onChange={handleMediaChange} hidden />
                        <svg viewBox="0 0 24 24" className="icon-md"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>
                    </label>
                    {/* Add more tool icons here (GIF, Poll, Emoji, etc.) */}
                </div>
            </div>
        </div>
    );
}

export default CreatePost;

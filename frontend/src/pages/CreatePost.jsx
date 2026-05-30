import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../utils/api';
import './CreatePost.css';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
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
      setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    if (content.length > 280) return;

    setLoading(true);
    try {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

      const response = await postAPI.createPost({
        content: content.trim(),
        tags: parsedTags,
        type: 'quick',
      });

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

  const charsLeft = 280 - content.length;
  const isUnderWarning = charsLeft <= 20;
  const isEmpty = !content.trim();
  const isOverLimit = charsLeft < 0;
  const publishDisabled = isEmpty || isOverLimit || loading;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg-surface)',
        color: 'var(--color-text-primary)',
      }}
      className="fade-in"
    >
      {/* Editor Tab Chrome / Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-base)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
            + new-post.md
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
            Quick Post
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '4px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={publishDisabled}
            style={{
              background: publishDisabled ? '#3a3a5a' : '#7c6fef',
              border: 'none',
              borderRadius: 4,
              padding: '4px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: publishDisabled ? 'var(--color-text-muted)' : 'white',
              cursor: publishDisabled ? 'default' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 24, gap: 16 }}>
        {/* Content Textarea */}
        <div style={{ flex: 1, display: 'flex', gap: 12 }}>
          <textarea
            placeholder="// what are you shipping?"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="quick-post-textarea"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              resize: 'none',
              lineHeight: '22px',
            }}
          />
        </div>

        {/* Media Preview */}
        {preview && (
          <div style={{ position: 'relative', maxWidth: '300px', border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
            {mediaType === 'image' ? (
              <img src={preview} alt="Preview" style={{ width: '100%', display: 'block' }} />
            ) : (
              <video src={preview} controls style={{ width: '100%', display: 'block' }} />
            )}
            <button
              onClick={() => { setMediaFile(null); setPreview(''); setMediaType(''); }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,.6)',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Toolbar Footer inside editor */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 16,
          }}
        >
          {/* File attachment & Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <input type="file" accept="image/*,video/*" onChange={handleMediaChange} hidden />
              <span>Attach Media</span>
            </label>

            <input
              type="text"
              placeholder="Tags (comma separated: javascript, react)"
              value={tags}
              onChange={e => setTags(e.target.value)}
              style={{
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                flex: 1,
                maxWidth: '300px',
              }}
            />
          </div>

          {/* Character counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: isUnderWarning ? '#e24b4a' : 'var(--color-text-muted)',
                fontWeight: isUnderWarning ? 600 : 400,
              }}
            >
              {charsLeft}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

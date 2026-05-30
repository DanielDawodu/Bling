import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../utils/api';
import SEO from '../components/SEO';

export default function CreateArticle() {
  const navigate = useNavigate();

  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem('bling_article_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.title || '';
      } catch (e) {}
    }
    return '';
  });

  const [content, setContent] = useState(() => {
    const saved = localStorage.getItem('bling_article_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.content || '';
      } catch (e) {}
    }
    return '';
  });

  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem('bling_article_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.tags || '';
      } catch (e) {}
    }
    return '';
  });

  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  // Live auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (title.trim() || content.trim() || tags.trim()) {
        localStorage.setItem('bling_article_draft', JSON.stringify({ title, content, tags }));
        window.dispatchEvent(new CustomEvent('bling:status', { detail: 'auto-saved' }));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [title, content, tags]);

  // Estimate read time (words / 200, minimum 1 min)
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('bling_article_draft', JSON.stringify({ title, content, tags }));
    window.dispatchEvent(new CustomEvent('bling:status', { detail: 'draft saved' }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required to publish an article.');
      return;
    }

    setLoading(true);
    try {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

      const response = await postAPI.createPost({
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags,
        type: 'article',
      });

      if (mediaFile && response.data.post) {
        const formData = new FormData();
        formData.append('images', mediaFile);
        await postAPI.uploadMedia(response.data.post._id, formData);
      }

      // Clear draft
      localStorage.removeItem('bling_article_draft');
      window.dispatchEvent(new CustomEvent('bling:status', { detail: 'published!' }));
      navigate('/');
    } catch (error) {
      console.error('Failed to create article:', error);
      alert(error.response?.data?.error || 'Failed to publish article');
    } finally {
      setLoading(false);
    }
  };

  // Generate line numbers based on content newlines
  const lineCount = Math.max(12, content.split('\n').length + 2);

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
      <SEO
        title="New Article"
        description="Write a deep dive developer article on Bling."
        url="/create-article"
      />

      {/* Header Chrome */}
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
            + new-article.md
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
            Article Composer
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginRight: 10 }}>
            ~{readTime} min read
          </span>
          <button
            onClick={handleSaveDraft}
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
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            style={{
              background: (!title.trim() || !content.trim()) ? '#3a3a5a' : '#7c6fef',
              border: 'none',
              borderRadius: 4,
              padding: '4px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: (!title.trim() || !content.trim()) ? 'var(--color-text-muted)' : 'white',
              cursor: (!title.trim() || !content.trim()) ? 'default' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 24, gap: 16 }}>
        {/* Title Input */}
        <div>
          <input
            type="text"
            placeholder="Article Title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#c8c8e0',
              paddingBottom: 10,
            }}
          />
        </div>

        {/* Cover Image Upload & Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {preview ? (
            <div style={{ position: 'relative', width: '100%', maxHeight: '200px', border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
              <img src={preview} alt="Cover Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => { setMediaFile(null); setPreview(''); }}
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
          ) : (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed var(--color-border)',
                borderRadius: 6,
                padding: '16px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-base)',
                textAlign: 'center',
              }}
            >
              <input type="file" accept="image/*" onChange={handleMediaChange} hidden />
              <span>+ Add Cover Image</span>
            </label>
          )}
        </div>

        {/* Content Markdown Editor */}
        <div style={{ flex: 1, display: 'flex', gap: 12 }}>
          {/* Mock line numbers */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textAlign: 'right',
              userSelect: 'none',
              paddingTop: 4,
              width: 28,
            }}
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} style={{ height: 22 }}>{i + 1}</div>
            ))}
          </div>

          <textarea
            placeholder="Write your article in markdown here..."
            value={content}
            onChange={e => setContent(e.target.value)}
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
          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <input
              type="text"
              placeholder="Tags (comma separated: typescript, tutorial)"
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
                maxWidth: '400px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

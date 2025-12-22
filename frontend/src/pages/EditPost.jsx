import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI } from '../utils/api';
import '../pages/CreatePost.css';

function EditPost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        codeSnippet: { code: '', language: 'javascript' },
        tags: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            const response = await postAPI.getPost(id);
            const post = response.data.post;

            setFormData({
                title: post.title,
                content: post.content,
                codeSnippet: post.codeSnippet || { code: '', language: 'javascript' },
                tags: post.tags?.join(', ') || ''
            });
        } catch (err) {
            setError('Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'code' || name === 'language') {
            setFormData({
                ...formData,
                codeSnippet: { ...formData.codeSnippet, [name]: value }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const postData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            await postAPI.updatePost(id, postData);
            navigate(`/posts/${id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update post');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="create-post-page">
            <div className="container container-sm">
                <div className="page-header">
                    <h1>Edit Post</h1>
                    <p>Update your post</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="post-form glass-card">
                    <div className="form-group">
                        <label htmlFor="title" className="form-label">Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="form-input"
                            placeholder="Enter post title..."
                            value={formData.title}
                            onChange={handleChange}
                            required
                            maxLength={200}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="content" className="form-label">Content *</label>
                        <textarea
                            id="content"
                            name="content"
                            className="form-textarea"
                            placeholder="Write your post content..."
                            value={formData.content}
                            onChange={handleChange}
                            required
                            rows={12}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="code" className="form-label">Code Snippet (Optional)</label>
                        <select
                            name="language"
                            className="form-select mb-sm"
                            value={formData.codeSnippet.language}
                            onChange={handleChange}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="csharp">C#</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="sql">SQL</option>
                            <option value="bash">Bash</option>
                        </select>
                        <textarea
                            id="code"
                            name="code"
                            className="form-textarea code-input"
                            placeholder="Paste your code here..."
                            value={formData.codeSnippet.code}
                            onChange={handleChange}
                            rows={8}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="tags" className="form-label">Tags</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            className="form-input"
                            placeholder="javascript, react, tutorial (comma separated)"
                            value={formData.tags}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(`/posts/${id}`)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={submitting}
                        >
                            {submitting ? 'Updating...' : 'Update Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditPost;

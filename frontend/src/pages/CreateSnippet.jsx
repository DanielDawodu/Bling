import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { snippetAPI } from '../utils/api';
import CodeEditor from '../components/CodeEditor';
import FileTree from '../components/FileTree';
import './CreateSnippet.css';

function CreateSnippet() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('single'); // 'single' or 'project'
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        language: 'javascript',
        code: '// Write your code here...',
        tags: '',
        files: [],
        previewUrl: '',
        copyRestricted: false
    });

    const handleFolderUpload = (e) => {
        const files = Array.from(e.target.files);
        const projectFiles = [];

        // Filter and process files
        const processFiles = async () => {
            for (const file of files) {
                // Skip node_modules, .git, and hidden files
                if (file.webkitRelativePath.includes('node_modules') ||
                    file.webkitRelativePath.includes('.git') ||
                    file.name.startsWith('.')) {
                    continue;
                }

                // Read file content
                const content = await readFileContent(file);

                projectFiles.push({
                    path: file.webkitRelativePath,
                    content: content,
                    language: getLanguageFromExt(file.name)
                });
            }

            setFormData(prev => ({ ...prev, files: projectFiles }));
            setMode('project');
        };

        processFiles();
    };

    const readFileContent = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(''); // Skip binary/unreadable
            reader.readAsText(file);
        });
    };

    const getLanguageFromExt = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'javascript', 'tsx': 'javascript',
            'py': 'python', 'css': 'css', 'html': 'html', 'java': 'java', 'c': 'c', 'cpp': 'cpp'
        };
        return map[ext] || 'text';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const snippetData = {
                title: formData.title,
                description: formData.description,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                type: mode,
                language: formData.language,
                code: mode === 'single' ? formData.code : undefined,
                files: mode === 'project' ? formData.files : undefined,
                previewUrl: formData.previewUrl,
                copyRestricted: formData.copyRestricted
            };

            await snippetAPI.createSnippet(snippetData);
            navigate('/snippets');
        } catch (error) {
            console.error('Error creating snippet:', error);
            alert('Failed to create snippet');
        } finally {
            setLoading(false);
        }
    };

    const languages = ['javascript', 'python', 'css', 'html', 'java', 'c', 'cpp'];

    return (
        <div className="create-snippet-page">
            <div className="create-snippet-header sticky-header">
                <button onClick={() => navigate(-1)} className="btn btn-icon">
                    <svg viewBox="0 0 24 24" className="icon-sm">
                        <path d="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-6 6c-.39.39-.39 1.023 0 1.414l6 6c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L7.414 13H20c.553 0 1-.447 1-1s-.447-1-1-1z" />
                    </svg>
                </button>
                <h1>Create Snippet</h1>
            </div>

            <div className="create-snippet-content">
                <form onSubmit={handleSubmit} className="create-snippet-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., React Custom Hook for Fetching"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Explain what this code does..."
                            className="form-textarea"
                            rows="3"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="e.g., react, hooks, api"
                                className="form-input"
                            />
                        </div>

                        {mode === 'single' && (
                            <div className="form-group">
                                <label>Language</label>
                                <select
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    className="form-select"
                                >
                                    {languages.map(lang => (
                                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Live Preview URL (Optional)</label>
                            <input
                                type="url"
                                value={formData.previewUrl}
                                onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                                placeholder="https://..."
                                className="form-input"
                            />
                        </div>
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.copyRestricted}
                                    onChange={(e) => setFormData({ ...formData, copyRestricted: e.target.checked })}
                                />
                                Restrict Copying
                            </label>
                            <span className="help-text">Prevent users from copying your code</span>
                        </div>
                    </div>

                    <div className="mode-toggle">
                        <button
                            type="button"
                            className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setMode('single')}
                        >
                            Single Snippet
                        </button>
                        <button
                            type="button"
                            className={`btn ${mode === 'project' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Upload Project Folder
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            webkitdirectory=""
                            directory=""
                            multiple
                            onChange={handleFolderUpload}
                        />
                    </div>

                    {mode === 'single' ? (
                        <div className="form-group">
                            <label>Code</label>
                            <CodeEditor
                                code={formData.code}
                                setCode={(code) => setFormData({ ...formData, code })}
                                language={formData.language}
                            />
                        </div>
                    ) : (
                        <div className="project-preview">
                            <h3>Project Files ({formData.files.length})</h3>
                            {formData.files.length > 0 ? (
                                <div className="file-tree-preview">
                                    <FileTree
                                        files={formData.files}
                                        onSelectFile={() => { }}
                                    />
                                </div>
                            ) : (
                                <div className="empty-project-state">
                                    <p>No files uploaded yet. Click "Upload Project Folder" to start.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Snippet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateSnippet;

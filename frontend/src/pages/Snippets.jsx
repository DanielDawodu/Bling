import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { snippetAPI } from '../utils/api';
import SnippetCard from '../components/SnippetCard';
import './Snippets.css';

import { useAuth } from '../context/auth-context';

function Snippets() {
    const { user } = useAuth();
    const [snippets, setSnippets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        language: '',
        search: '',
        author: ''
    });

    useEffect(() => {
        fetchSnippets();
    }, [filters]);

    const fetchSnippets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.language) params.language = filters.language;
            if (filters.search) params.search = filters.search;
            if (filters.author) params.author = filters.author;

            const response = await snippetAPI.getSnippets(params);
            setSnippets(response.data.snippets);
        } catch (error) {
            console.error('Error fetching snippets:', error);
        } finally {
            setLoading(false);
        }
    };

    const languages = ['javascript', 'python', 'css', 'html', 'java', 'c', 'cpp'];

    return (
        <div className="snippets-page">
            <div className="snippets-header sticky-header">
                <h1>Code Snippets</h1>
                <div className="header-actions">
                    {user && (
                        <button
                            className={`btn ${filters.author === user.id ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilters({ ...filters, author: filters.author === user.id ? '' : user.id })}
                            style={{ marginRight: '10px' }}
                        >
                            My Codes
                        </button>
                    )}
                    <Link to="/create-snippet" className="btn btn-primary">Share Code</Link>
                </div>
            </div>

            <div className="snippets-content">
                <div className="snippets-filters">
                    <input
                        type="text"
                        placeholder="Search snippets..."
                        className="search-input"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />

                    <select
                        className="filter-select"
                        value={filters.language}
                        onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                    >
                        <option value="">All Languages</option>
                        {languages.map(lang => (
                            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner" />
                    </div>
                ) : snippets.length === 0 ? (
                    <div className="empty-state">
                        <h3>No snippets found</h3>
                        <p>Be the first to share some code!</p>
                    </div>
                ) : (
                    <div className="snippets-grid">
                        {snippets.map(snippet => (
                            <SnippetCard key={snippet._id} snippet={snippet} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Snippets;

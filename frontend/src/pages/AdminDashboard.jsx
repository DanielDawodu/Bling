import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, normalizeUrl } from '../utils/api';
import { useAuth } from '../context/auth-context';
import { format, formatDistanceToNow } from 'date-fns';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [snippets, setSnippets] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [reportFilter, setReportFilter] = useState('pending');
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchStats();
            fetchActivity();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'posts') {
            fetchPosts();
        } else if (activeTab === 'snippets') {
            fetchSnippets();
        } else if (activeTab === 'jobs') {
            fetchJobs();
        } else if (activeTab === 'reports') {
            fetchReports();
        }
    }, [activeTab, searchQuery, userFilter, reportFilter, pagination.page]);

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getStats();
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivity = async () => {
        try {
            const response = await adminAPI.getActivity();
            setActivity(response.data);
        } catch (err) {
            console.error('Error fetching activity:', err);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getUsers({
                page: pagination.page,
                search: searchQuery,
                filter: userFilter !== 'all' ? userFilter : undefined
            });
            setUsers(response.data.users);
            setPagination(prev => ({ ...prev, pages: response.data.pagination.pages }));
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getPosts({ page: pagination.page, search: searchQuery });
            setPosts(response.data.posts);
            setPagination(prev => ({ ...prev, pages: response.data.pagination.pages }));
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSnippets = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getSnippets({ page: pagination.page, search: searchQuery });
            setSnippets(response.data.snippets);
            setPagination(prev => ({ ...prev, pages: response.data.pagination.pages }));
        } catch (err) {
            console.error('Error fetching snippets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getJobs({ page: pagination.page, search: searchQuery });
            setJobs(response.data.jobs);
            setPagination(prev => ({ ...prev, pages: response.data.pagination.pages }));
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getReports({
                page: pagination.page,
                status: reportFilter !== 'all' ? reportFilter : undefined
            });
            setReports(response.data.reports);
            setPagination(prev => ({ ...prev, pages: response.data.pagination.pages }));
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    // User actions
    const handleVerify = async (userId) => {
        try {
            await adminAPI.verifyUser(userId);
            setUsers(users.map(u => u._id === userId ? { ...u, isVerified: !u.isVerified } : u));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleSuspend = async (userId) => {
        try {
            await adminAPI.suspendUser(userId);
            setUsers(users.map(u => u._id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleToggleAdmin = async (userId) => {
        if (!window.confirm('Are you sure you want to change admin status for this user?')) return;
        try {
            await adminAPI.toggleAdmin(userId);
            setUsers(users.map(u => u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Delete this user and ALL their content? This cannot be undone.')) return;
        try {
            await adminAPI.deleteUser(userId);
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // Content actions
    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await adminAPI.deletePost(postId);
            setPosts(posts.filter(p => p._id !== postId));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleDeleteSnippet = async (snippetId) => {
        if (!window.confirm('Delete this snippet?')) return;
        try {
            await adminAPI.deleteSnippet(snippetId);
            setSnippets(snippets.filter(s => s._id !== snippetId));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Delete this job listing?')) return;
        try {
            await adminAPI.deleteJob(jobId);
            setJobs(jobs.filter(j => j._id !== jobId));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // Report actions
    const handleReportAction = async (reportId, action) => {
        try {
            await adminAPI.actionReport(reportId, action);
            setReports(reports.map(r =>
                r._id === reportId
                    ? { ...r, status: action === 'delete' ? 'resolved' : 'dismissed' }
                    : r
            ));
        } catch (err) {
            console.error('Error:', err);
        }
    };

    if (!user?.isAdmin) {
        return (
            <div className="access-denied">
                <div className="access-denied-icon">🔒</div>
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page.</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'posts', label: 'Posts', icon: '📝' },
        { id: 'snippets', label: 'Snippets', icon: '💻' },
        { id: 'jobs', label: 'Jobs', icon: '💼' },
        { id: 'reports', label: 'Reports', icon: '🚨' }
    ];

    return (
        <div className="admin-dashboard">
            <header className="admin-header sticky-header">
                <h1 className="gradient-gold-text">Admin Dashboard</h1>
                <span className="admin-badge">Administrator</span>
            </header>

            <nav className="admin-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab.id); setPagination({ page: 1, pages: 1 }); }}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                        {tab.id === 'reports' && stats?.reports?.pending > 0 && (
                            <span className="tab-badge">{stats.reports.pending}</span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="admin-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        {loading ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : stats && (
                            <>
                                <div className="stats-grid">
                                    <div className="stat-card stat-users">
                                        <div className="stat-icon">👥</div>
                                        <div className="stat-info">
                                            <h3>{stats.users.total}</h3>
                                            <p>Total Users</p>
                                            <span className={`stat-change ${stats.users.growth >= 0 ? 'positive' : 'negative'}`}>
                                                {stats.users.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.users.growth)}% this month
                                            </span>
                                        </div>
                                    </div>
                                    <div className="stat-card stat-posts">
                                        <div className="stat-icon">📝</div>
                                        <div className="stat-info">
                                            <h3>{stats.content.posts.total}</h3>
                                            <p>Total Posts</p>
                                            <span className="stat-secondary">+{stats.content.posts.thisWeek} this week</span>
                                        </div>
                                    </div>
                                    <div className="stat-card stat-snippets">
                                        <div className="stat-icon">💻</div>
                                        <div className="stat-info">
                                            <h3>{stats.content.snippets.total}</h3>
                                            <p>Code Snippets</p>
                                            <span className="stat-secondary">+{stats.content.snippets.thisWeek} this week</span>
                                        </div>
                                    </div>
                                    <div className="stat-card stat-jobs">
                                        <div className="stat-icon">💼</div>
                                        <div className="stat-info">
                                            <h3>{stats.content.jobs.total}</h3>
                                            <p>Job Listings</p>
                                            <span className="stat-secondary">{stats.content.jobs.active} active</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overview-grid">
                                    <div className="glass-card quick-stats">
                                        <h3>Quick Stats</h3>
                                        <div className="quick-stats-grid">
                                            <div className="quick-stat">
                                                <span className="quick-stat-value">{stats.users.today}</span>
                                                <span className="quick-stat-label">New users today</span>
                                            </div>
                                            <div className="quick-stat">
                                                <span className="quick-stat-value">{stats.users.verified}</span>
                                                <span className="quick-stat-label">Verified users</span>
                                            </div>
                                            <div className="quick-stat">
                                                <span className="quick-stat-value">{stats.users.suspended}</span>
                                                <span className="quick-stat-label">Suspended users</span>
                                            </div>
                                            <div className="quick-stat">
                                                <span className="quick-stat-value">{stats.content.comments.total}</span>
                                                <span className="quick-stat-label">Total comments</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-card reports-summary">
                                        <h3>Reports Summary</h3>
                                        <div className="reports-breakdown">
                                            <div className="report-stat pending">
                                                <span className="report-count">{stats.reports.pending}</span>
                                                <span className="report-label">Pending</span>
                                            </div>
                                            <div className="report-stat resolved">
                                                <span className="report-count">{stats.reports.resolved}</span>
                                                <span className="report-label">Resolved</span>
                                            </div>
                                            <div className="report-stat dismissed">
                                                <span className="report-count">{stats.reports.dismissed}</span>
                                                <span className="report-label">Dismissed</span>
                                            </div>
                                        </div>
                                        {stats.reports.pending > 0 && (
                                            <button className="btn btn-warning btn-sm" onClick={() => setActiveTab('reports')}>
                                                Review {stats.reports.pending} pending reports
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="glass-card activity-feed">
                                    <h3>Recent Activity</h3>
                                    <div className="activity-list">
                                        {activity.slice(0, 10).map((item, idx) => (
                                            <div key={idx} className={`activity-item activity-${item.type}`}>
                                                <img
                                                    src={normalizeUrl(item.user?.avatar)}
                                                    alt=""
                                                    className="activity-avatar"
                                                />
                                                <div className="activity-info">
                                                    <p className="activity-message">{item.message}</p>
                                                    <span className="activity-time">
                                                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="users-tab">
                        <div className="tab-controls">
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <select
                                className="filter-select"
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                            >
                                <option value="all">All Users</option>
                                <option value="verified">Verified</option>
                                <option value="suspended">Suspended</option>
                                <option value="admin">Admins</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : (
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Joined</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id}>
                                                <td>
                                                    <Link to={`/profile/${u._id}`} className="user-cell">
                                                        <img src={normalizeUrl(u.avatar)} alt="" className="avatar avatar-sm" />
                                                        <span className="user-name">{u.username}</span>
                                                    </Link>
                                                </td>
                                                <td className="text-muted">{u.email}</td>
                                                <td className="text-muted">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                                                <td>
                                                    <div className="status-badges">
                                                        {u.isAdmin && <span className="badge badge-admin">Admin</span>}
                                                        {u.isVerified && <span className="badge badge-verified">Verified</span>}
                                                        {u.isSuspended && <span className="badge badge-suspended">Suspended</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button onClick={() => handleVerify(u._id)} className="btn-action btn-verify">
                                                            {u.isVerified ? 'Unverify' : 'Verify'}
                                                        </button>
                                                        <button onClick={() => handleSuspend(u._id)} className="btn-action btn-suspend">
                                                            {u.isSuspended ? 'Activate' : 'Suspend'}
                                                        </button>
                                                        {u._id !== user.id && (
                                                            <>
                                                                <button onClick={() => handleToggleAdmin(u._id)} className="btn-action btn-admin">
                                                                    {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                                </button>
                                                                <button onClick={() => handleDeleteUser(u._id)} className="btn-action btn-delete">
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                >Previous</button>
                                <span>Page {pagination.page} of {pagination.pages}</span>
                                <button
                                    disabled={pagination.page === pagination.pages}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                >Next</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                    <div className="content-tab">
                        <div className="tab-controls">
                            <input
                                type="text"
                                placeholder="Search posts..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : (
                            <div className="content-grid">
                                {posts.map(post => (
                                    <div key={post._id} className="content-card glass-card">
                                        <div className="content-header">
                                            <Link to={`/profile/${post.author?._id}`} className="content-author">
                                                <img src={normalizeUrl(post.author?.avatar)} alt="" />
                                                <span>{post.author?.username}</span>
                                            </Link>
                                            <span className="content-date">{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                                        </div>
                                        <p className="content-preview">{post.content?.substring(0, 150)}...</p>
                                        <div className="content-actions">
                                            <Link to={`/post/${post._id}`} className="btn btn-sm btn-outline">View</Link>
                                            <button onClick={() => handleDeletePost(post._id)} className="btn btn-sm btn-danger">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                                <span>Page {pagination.page} of {pagination.pages}</span>
                                <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Snippets Tab */}
                {activeTab === 'snippets' && (
                    <div className="content-tab">
                        <div className="tab-controls">
                            <input
                                type="text"
                                placeholder="Search snippets..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : (
                            <div className="content-grid">
                                {snippets.map(snippet => (
                                    <div key={snippet._id} className="content-card glass-card">
                                        <div className="content-header">
                                            <Link to={`/profile/${snippet.author?._id}`} className="content-author">
                                                <img src={normalizeUrl(snippet.author?.avatar)} alt="" />
                                                <span>{snippet.author?.username}</span>
                                            </Link>
                                            <span className="badge badge-language">{snippet.language}</span>
                                        </div>
                                        <h4 className="content-title">{snippet.title}</h4>
                                        <p className="content-preview">{snippet.description?.substring(0, 100)}...</p>
                                        <div className="content-actions">
                                            <Link to={`/snippets/${snippet._id}`} className="btn btn-sm btn-outline">View</Link>
                                            <button onClick={() => handleDeleteSnippet(snippet._id)} className="btn btn-sm btn-danger">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                                <span>Page {pagination.page} of {pagination.pages}</span>
                                <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                    <div className="content-tab">
                        <div className="tab-controls">
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : (
                            <div className="content-grid">
                                {jobs.map(job => (
                                    <div key={job._id} className="content-card glass-card">
                                        <div className="content-header">
                                            <span className="job-company">{job.company}</span>
                                            <span className={`badge badge-job-type ${job.jobType}`}>{job.jobType}</span>
                                        </div>
                                        <h4 className="content-title">{job.title}</h4>
                                        <p className="job-location">📍 {job.location}</p>
                                        <div className="content-actions">
                                            <Link to={`/jobs/${job._id}`} className="btn btn-sm btn-outline">View</Link>
                                            <button onClick={() => handleDeleteJob(job._id)} className="btn btn-sm btn-danger">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                                <span>Page {pagination.page} of {pagination.pages}</span>
                                <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="reports-tab">
                        <div className="tab-controls">
                            <select
                                className="filter-select"
                                value={reportFilter}
                                onChange={(e) => setReportFilter(e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                                <option value="all">All Reports</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : reports.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">✅</span>
                                <h3>No {reportFilter !== 'all' ? reportFilter : ''} reports</h3>
                                <p>All clear! No reports to review at this time.</p>
                            </div>
                        ) : (
                            <div className="reports-list">
                                {reports.map(report => (
                                    <div key={report._id} className={`report-card glass-card status-${report.status}`}>
                                        <div className="report-header">
                                            <div className="report-meta">
                                                <span className={`badge badge-${report.status}`}>{report.status}</span>
                                                <span className="badge badge-type">{report.targetType}</span>
                                            </div>
                                            <span className="report-date">
                                                {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <div className="report-body">
                                            <p className="report-reason"><strong>Reason:</strong> {report.reason}</p>
                                            {report.description && (
                                                <p className="report-description">{report.description}</p>
                                            )}
                                            <p className="report-reporter">
                                                Reported by: <Link to={`/profile/${report.reporter?._id}`}>{report.reporter?.username}</Link>
                                            </p>
                                        </div>

                                        {report.status === 'pending' && (
                                            <div className="report-actions">
                                                <button
                                                    onClick={() => handleReportAction(report._id, 'delete')}
                                                    className="btn btn-danger"
                                                >
                                                    Delete Content & Resolve
                                                </button>
                                                <button
                                                    onClick={() => handleReportAction(report._id, 'dismiss')}
                                                    className="btn btn-outline"
                                                >
                                                    Dismiss Report
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                                <span>Page {pagination.page} of {pagination.pages}</span>
                                <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

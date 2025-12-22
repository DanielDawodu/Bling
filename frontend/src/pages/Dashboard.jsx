import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import './Dashboard.css';

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await userAPI.getDashboardStats();
                setStats(response.data);
            } catch (err) {
                console.error('Failed to load dashboard stats', err);
                setError('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    return (
        <div className="dashboard-page container">
            <div className="dashboard-header glass-card fade-in">
                <h1>Welcome back, {user?.username}!</h1>
                <p>Here's an overview of your activity.</p>
            </div>

            <div className="stats-grid fade-in">
                <div className="stat-card glass-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-info">
                        <h3>Total Posts</h3>
                        <p className="stat-number">{stats?.postsCount || 0}</p>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-info">
                        <h3>Total Likes</h3>
                        <p className="stat-number">{stats?.totalLikes || 0}</p>
                    </div>
                </div>
                <Link to="/followers" className="stat-card glass-card stat-link">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>Followers</h3>
                        <p className="stat-number">{stats?.followersCount || 0}</p>
                    </div>
                </Link>
                <div className="stat-card glass-card">
                    <div className="stat-icon">👣</div>
                    <div className="stat-info">
                        <h3>Following</h3>
                        <p className="stat-number">{stats?.followingCount || 0}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-actions glass-card fade-in">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <Link to="/create-post" className="btn btn-primary">Create New Post</Link>
                    <Link to={`/profile/${user?.id}`} className="btn btn-secondary">View Profile</Link>
                    <Link to="/search" className="btn btn-secondary">Find Users</Link>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

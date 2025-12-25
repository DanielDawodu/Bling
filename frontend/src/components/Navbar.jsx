import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { useTheme } from '../context/ThemeContext';
import { normalizeUrl } from '../utils/api';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        <img src="/logo.png" alt="Bling Logo" className="logo-icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        <span className="logo-text">Bling</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navbar-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/search" className="nav-link">Search</Link>
                        {isAuthenticated && (
                            <>
                                <Link to="/messages" className="nav-link">Messages</Link>
                                <Link to="/create-post" className="nav-link">Create Post</Link>
                            </>
                        )}
                        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>

                    {/* User Menu */}
                    <div className="navbar-actions">
                        {isAuthenticated ? (
                            <div className="user-menu-group">
                                <NotificationDropdown />
                                <div className="user-menu">
                                    <button
                                        className="user-menu-trigger"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    >
                                        {user?.avatar ? (
                                            <img src={normalizeUrl(user.avatar)} alt={user.username} className="avatar avatar-sm" />
                                        ) : (
                                            <div className="avatar avatar-sm avatar-placeholder">
                                                {user?.username?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <span className="user-name">{user?.username}</span>
                                        <svg className="chevron" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="user-menu-dropdown">
                                            <Link
                                                to="/dashboard"
                                                className="dropdown-item"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm-6 6h4v4H4v-4zm6 0h4v4h-4v-4z" />
                                                </svg>
                                                Dashboard
                                            </Link>
                                            <Link
                                                to={`/profile/${user?.id}`}
                                                className="dropdown-item"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 9c-3.866 0-7 2.239-7 5v1h14v-1c0-2.761-3.134-5-7-5z" />
                                                </svg>
                                                My Profile
                                            </Link>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    handleLogout();
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M6 2v2H2v8h4v2H2a2 2 0 01-2-2V4a2 2 0 012-2h4zm4.586 4L9 4.414 10.414 3 15 7.586 10.414 12 9 10.586 10.586 9H5V7h5.586z" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                                <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            {isMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu">
                        <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                            Home
                        </Link>
                        <Link to="/search" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                            Search
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/messages" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Messages
                                </Link>
                                <Link to="/create-post" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Create Post
                                </Link>
                                <Link to="/dashboard" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Dashboard
                                </Link>
                                <Link to={`/profile/${user?.id}`} className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    My Profile
                                </Link>
                                <button className="mobile-link" onClick={() => {
                                    setIsMenuOpen(false);
                                    handleLogout();
                                }}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Login
                                </Link>
                                <Link to="/signup" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav >
    );
}

export default Navbar;

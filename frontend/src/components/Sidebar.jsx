import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import VerificationBadge from './VerificationBadge';
import './Sidebar.css';

function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { unreadCount, requestPermission } = useNotifications();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <NavLink to="/" className="brand-logo" style={{ justifyContent: 'center' }}>
                    <img src="/sidebar-logo.png" alt="Bling Logo" className="brand-icon" style={{ width: '120px', height: 'auto' }} />
                </NavLink>
            </div>

            <div className="sidebar-search">
                <div className="search-input-wrapper">
                    <svg viewBox="0 0 24 24" className="search-icon-sm"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
                    <input
                        type="text"
                        placeholder="Search Bling"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"></path></g></svg>
                    </div>
                    <span className="sidebar-text">Home</span>
                </NavLink>

                <NavLink to="/search" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
                    </div>
                    <span className="sidebar-text">Explore</span>
                </NavLink>

                <NavLink to="/messages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></g></svg>
                    </div>
                    <span className="sidebar-text">Messages</span>
                </NavLink>

                <NavLink to="/notifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"></path></g></svg>
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </div>
                    <span className="sidebar-text">Notifications</span>
                </NavLink>

                <NavLink to="/jobs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M20 6h-3V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5 0H9V4h6v2z"></path></g></svg>
                    </div>
                    <span className="sidebar-text">Jobs</span>
                </NavLink>

                <NavLink to="/snippets" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"></path></g></svg>
                    </div>
                    <span className="sidebar-text">Snippets</span>
                </NavLink>

                <NavLink to={`/profile/${user.id}`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M5.651 19h12.698c-.337-4.429-3.48-7.102-6.349-7.102-2.869 0-6.012 2.673-6.349 7.102zM12 5.251c1.64 0 3 1.36 3 3 0 1.64-1.36 3-3 3-1.64 0-3-1.36-3-3 0-1.64 1.36-3 3-3zm-9 13.749c0-5.42 4.879-9.102 9-9.102 4.121 0 9 3.682 9 9.102 0 .414-.336.75-.75.75H2.75c-.414 0-.75-.336-.75-.75zM12 3.251c-2.761 0-5 2.238-5 5 0 2.761 2.239 5 5 5 2.762 0 5-2.239 5-5 0-2.762-2.238-5-5-5z"></path></g></svg>
                    </div>
                    <span className="sidebar-text">Profile</span>
                </NavLink>

                <button onClick={toggleTheme} className="sidebar-link">
                    <div className="icon-wrapper">
                        {theme === 'dark' ? (
                            <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 17.5c-4.28 0-7.75-3.47-7.75-7.75S7.72 4.25 12 4.25s7.75 3.47 7.75 7.75-3.47 7.75-7.75 7.75zM12 7.25c-2.623 0-4.75 2.127-4.75 4.75s2.127 4.75 4.75 4.75 4.75-2.127 4.75-4.75-2.127-4.75-4.75-4.75z"></path></g></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" className="sidebar-icon"><g><path d="M21.5 12c0 5.247-4.253 9.5-9.5 9.5S2.5 17.247 2.5 12 6.753 2.5 12 2.5c.84 0 1.65.105 2.422.302-.483.674-.772 1.503-.772 2.398 0 2.347 1.903 4.25 4.25 4.25.895 0 1.724-.289 2.398-.772.197.772.302 1.582.302 2.422zm-2.096-3.895C18.66 8.52 17.963 8.75 17.25 8.75c-3.176 0-5.75-2.574-5.75-5.75 0-.713.23-1.41.545-2.154C7.432 1.856 4 5.516 4 10c0 4.418 3.582 8 8 8s8-3.582 8-8c0-1.16-.245-2.26-.696-3.295z"></path></g></svg>
                        )}
                    </div>
                    <span className="sidebar-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            </nav>

            <button
                className="btn btn-primary btn-full btn-sidebar-post"
                onClick={() => navigate('/create-post')}
            >
                <span className="sidebar-text">Post</span>
                <svg viewBox="0 0 24 24" className="sidebar-icon-mobile"><g><path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path></g></svg>
            </button>

            <div className="sidebar-user" onClick={handleLogout}>
                <div className="sidebar-user-info">
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="avatar avatar-md" />
                    ) : (
                        <div className="avatar avatar-md avatar-placeholder">
                            {user.username[0].toUpperCase()}
                        </div>
                    )}
                    <div className="user-details sidebar-text">
                        <span className="user-name">
                            {user.username}
                            {user.isVerified && <VerificationBadge size={16} />}
                        </span>
                        <span className="user-handle">@{user.username}</span>
                    </div>
                </div>
                <div className="sidebar-text">
                    <svg viewBox="0 0 24 24" className="sidebar-icon-sm"><g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></g></svg>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;

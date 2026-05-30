import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Home,
    Search,
    Bell,
    Mail,
    User,
    Briefcase,
    Code
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import './MobileNav.css';

const MobileNav = () => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) return null;

    // Hide mobile nav on specific pages like individual conversation view
    // to allow the chat input to be visible and accessible
    if (location.pathname.startsWith('/messages/')) {
        return null;
    }

    return (
        <nav className="mobile-nav">
            <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Home className="mobile-nav-icon" />
            </NavLink>

            <NavLink to="/search" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Search className="mobile-nav-icon" />
            </NavLink>

            <NavLink to="/jobs" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Briefcase className="mobile-nav-icon" />
            </NavLink>

            <NavLink to="/snippets" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Code className="mobile-nav-icon" />
            </NavLink>

            <NavLink to="/notifications" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Bell className="mobile-nav-icon" />
            </NavLink>

            <NavLink to="/messages" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Mail className="mobile-nav-icon" />
            </NavLink>

            <NavLink to={`/profile/${user?.id}`} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <User className="mobile-nav-icon" />
            </NavLink>
        </nav>
    );
};

export default MobileNav;

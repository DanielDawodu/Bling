import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Search,
    Bell,
    Mail,
    User
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import './MobileNav.css';

const MobileNav = () => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    return (
        <nav className="mobile-nav">
            <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Home className="mobile-nav-icon" />
            </NavLink>

            <NavLink to="/search" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Search className="mobile-nav-icon" />
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

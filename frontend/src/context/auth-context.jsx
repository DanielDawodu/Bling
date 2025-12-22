import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.signup(userData);
            if (response.data.user) {
                setUser(response.data.user);
            }
            return { success: true, user: response.data.user, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.error || 'Signup failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const login = async (credentials) => {
        try {
            setError(null);
            const response = await authAPI.login(credentials);
            if (response.data.requireTwoFactor) {
                return { success: true, requireTwoFactor: true, userId: response.data.userId };
            }
            setUser(response.data.user);
            return { success: true, user: response.data.user };
        } catch (error) {
            const message = error.response?.data?.error || 'Login failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const loginVerify2FA = async (userId, token) => {
        try {
            setError(null);
            const response = await authAPI.loginVerify2FA(userId, token);
            setUser(response.data.user);
            return { success: true, user: response.data.user };
        } catch (error) {
            const message = error.response?.data?.error || '2FA verification failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const setup2FA = async () => {
        try {
            const response = await authAPI.setup2FA();
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to setup 2FA' };
        }
    };

    const verify2FA = async (token) => {
        try {
            const response = await authAPI.verify2FA(token);
            await checkAuth(); // Refresh user state
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to verify 2FA' };
        }
    };

    const disable2FA = async (token) => {
        try {
            const response = await authAPI.disable2FA(token);
            await checkAuth(); // Refresh user state
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to disable 2FA' };
        }
    };

    const resendVerification = async (email) => {
        try {
            const response = await authAPI.resendVerification(email);
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to resend verification' };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
            setUser(null);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Logout failed';
            return { success: false, error: message };
        }
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const value = {
        user,
        loading,
        error,
        signup,
        login,
        loginVerify2FA,
        setup2FA,
        verify2FA,
        disable2FA,
        resendVerification,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

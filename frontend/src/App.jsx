import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import MobileNav from './components/MobileNav';
import BlingAI from './components/BlingAI';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import Search from './pages/Search';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Followers from './pages/Followers';
import Following from './pages/Following';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import JobDetails from './pages/JobDetails';
import JobApplications from './pages/JobApplications';
import MyJobs from './pages/MyJobs';
import Snippets from './pages/Snippets';
import CreateSnippet from './pages/CreateSnippet';
import SnippetDetails from './pages/SnippetDetails';
import PostDetails from './pages/PostDetails';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Accessibility from './pages/Accessibility';
import AdsInfo from './pages/AdsInfo';

function AppContent() {
    const location = useLocation();
    const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/terms', '/privacy', '/cookies', '/accessibility', '/ads-info'].includes(location.pathname);

    if (isAuthPage) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/ads-info" element={<AdsInfo />} />
            </Routes>
        );
    }

    return (
        <div className="app-layout">
            <header className="sidebar-column">
                <Sidebar />
            </header>

            <main className="main-column">
                <Routes>
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/jobs/:id" element={<JobDetails />} />
                    <Route path="/jobs/:id/applications" element={<ProtectedRoute><JobApplications /></ProtectedRoute>} />
                    <Route path="/create-job" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
                    <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
                    <Route path="/snippets" element={<ProtectedRoute><Snippets /></ProtectedRoute>} />
                    <Route path="/create-snippet" element={<ProtectedRoute><CreateSnippet /></ProtectedRoute>} />
                    <Route path="/snippets/:id" element={<ProtectedRoute><SnippetDetails /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/messages/:userId" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
                    <Route path="/post/:id" element={<ProtectedRoute><PostDetails /></ProtectedRoute>} />
                    <Route path="/profile/:id/followers" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
                    <Route path="/profile/:id/following" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                    <Route path="/settings/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                </Routes>
            </main>

            <aside className="widgets-column">
                <RightSidebar />
            </aside>
            <MobileNav />
            <BlingAI />
        </div >
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;

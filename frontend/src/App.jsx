import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { WorkspaceTabsProvider } from './context/WorkspaceContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout shells
import DesktopShell from './components/layout/DesktopShell';
import MobileShell from './components/layout/MobileShell';

// Pages
import Home from './pages/Home';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import CreateArticle from './pages/CreateArticle';
import BlingAI from './pages/BlingAI';
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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const Shell = isMobile ? MobileShell : DesktopShell;

    return (
        <Routes>
            <Route element={<ProtectedRoute><Shell /></ProtectedRoute>}>
                <Route path="/" element={<Home />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/create-article" element={<CreateArticle />} />
                <Route path="/bling-ai" element={<BlingAI />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/jobs/:id/applications" element={<JobApplications />} />
                <Route path="/create-job" element={<CreateJob />} />
                <Route path="/my-jobs" element={<MyJobs />} />
                <Route path="/snippets" element={<Snippets />} />
                <Route path="/create-snippet" element={<CreateSnippet />} />
                <Route path="/snippets/:id" element={<SnippetDetails />} />
                <Route path="/search" element={<Search />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:userId" element={<Conversation />} />
                <Route path="/post/:id" element={<PostDetails />} />
                <Route path="/profile/:id/followers" element={<Followers />} />
                <Route path="/profile/:id/following" element={<Following />} />
                <Route path="/settings/profile" element={<EditProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/notifications" element={<Notifications />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <WorkspaceTabsProvider>
                        <Router>
                            <AppContent />
                        </Router>
                    </WorkspaceTabsProvider>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;

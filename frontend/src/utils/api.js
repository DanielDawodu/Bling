import axios from 'axios';

// Create axios instance with default config
// Use VITE_API_URL for production, fallback to /api for local development
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // Important for session cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.error || 'An error occurred';
            console.error('API Error:', message);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error: No response from server');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    verifyEmail: (token) => api.post('/auth/verify-email', { token }),
    setup2FA: () => api.get('/auth/2fa/setup'),
    verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
    loginVerify2FA: (userId, token) => api.post('/auth/2fa/login-verify', { userId, token }),
    disable2FA: (token) => api.post('/auth/2fa/disable', { token }),
    resendVerification: (email) => api.post('/auth/resend-verification', { email }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data)
};

// User API
export const userAPI = {
    getUser: (id) => api.get(`/users/${id}`),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    uploadAvatar: (id, formData) => api.post(`/users/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadCoverPhoto: (id, formData) => api.post(`/users/${id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getUserPosts: (id, params) => api.get(`/users/${id}/posts`, { params }),
    getFollowers: (id) => api.get(`/users/${id}/followers`),
    searchUsers: (query) => api.get(`/users/search`, { params: { q: query } }),
    followUser: (id) => api.post(`/users/${id}/follow`),
    unfollowUser: (id) => api.post(`/users/${id}/unfollow`),
    getDashboardStats: () => api.get('/users/dashboard'),
    getSuggestions: () => api.get('/users/suggestions')
};

// Post API
export const postAPI = {
    getPosts: (params) => api.get('/posts', { params }),
    getFollowingFeed: (params) => api.get('/posts/feed', { params }),
    getTrendingTopics: () => api.get('/posts/trending'),
    getPost: (id) => api.get(`/posts/${id}`),
    createPost: (data) => api.post('/posts', data),
    updatePost: (id, data) => api.put(`/posts/${id}`, data),
    deletePost: (id) => api.delete(`/posts/${id}`),
    likePost: (id) => api.post(`/posts/${id}/like`),
    unlikePost: (id) => api.post(`/posts/${id}/like`), // Same endpoint, backend toggles
    repostPost: (id) => api.post(`/posts/${id}/repost`),
    uploadMedia: (id, formData) => api.post(`/posts/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// Comment API
export const commentAPI = {
    getComments: (postId) => api.get(`/posts/${postId}/comments`),
    addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
    deleteComment: (id) => api.delete(`/comments/comments/${id}`),
    likeComment: (id) => api.post(`/comments/comments/${id}/like`),
    replyComment: (id, data) => api.post(`/comments/comments/${id}/reply`, data)
};

// Message API
export const messageAPI = {
    getConversations: () => api.get('/messages/conversations'),
    getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
    sendMessage: (data) => api.post('/messages/send', data),
    uploadAttachments: (formData) => api.post('/messages/upload-attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    sendMessageWithAttachments: (data) =>
        api.post('/messages/send-with-attachments', data),
    markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    getUnreadCount: () => api.get('/messages/unread-count')
};

// Job API
export const jobAPI = {
    getJobs: (params) => api.get('/jobs', { params }),
    getJob: (id) => api.get(`/jobs/${id}`),
    createJob: (data) => api.post('/jobs', data),
    updateJob: (id, data) => api.put(`/jobs/${id}`, data),
    deleteJob: (id) => api.delete(`/jobs/${id}`),
    applyToJob: (id, formData) => api.post(`/jobs/${id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getJobApplications: (id) => api.get(`/jobs/${id}/applications`),
    updateApplicationStatus: (jobId, appId, status) =>
        api.patch(`/jobs/${jobId}/applications/${appId}`, { status }),
    getMyJobs: () => api.get('/jobs/user/my-jobs'),
    getMyApplications: () => api.get('/jobs/user/my-applications')
};

// Snippet API
export const snippetAPI = {
    getSnippets: (params) => api.get('/snippets', { params }),
    getSnippet: (id) => api.get(`/snippets/${id}`),
    createSnippet: (data) => api.post('/snippets', data),
    updateSnippet: (id, data) => api.put(`/snippets/${id}`, data),
    deleteSnippet: (id) => api.delete(`/snippets/${id}`),
    likeSnippet: (id) => api.post(`/snippets/${id}/like`)
};

// Admin API
export const adminAPI = {
    // Dashboard stats
    getStats: () => api.get('/admin/stats'),
    getActivity: () => api.get('/admin/activity'),

    // User management
    getUsers: (params) => api.get('/admin/users', { params }),
    getUser: (id) => api.get(`/admin/users/${id}`),
    verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
    suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
    toggleAdmin: (id) => api.put(`/admin/users/${id}/admin`),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),

    // Content moderation
    getPosts: (params) => api.get('/admin/posts', { params }),
    deletePost: (id) => api.delete(`/admin/posts/${id}`),
    getSnippets: (params) => api.get('/admin/snippets', { params }),
    deleteSnippet: (id) => api.delete(`/admin/snippets/${id}`),
    getJobs: (params) => api.get('/admin/jobs', { params }),
    deleteJob: (id) => api.delete(`/admin/jobs/${id}`),

    // Reports management
    getReports: (params) => api.get('/admin/reports', { params }),
    updateReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
    actionReport: (id, action) => api.post(`/admin/reports/${id}/action`, { action })
};

// Notification API
export const notificationAPI = {
    getNotifications: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    getVapidPublicKey: () => api.get('/notifications/vapid-public-key'),
    subscribe: (subscription) => api.post('/notifications/subscribe', { subscription }),
    unsubscribe: () => api.delete('/notifications/subscribe')
};

// Search API
export const searchAPI = {
    globalSearch: (query) => api.get('/search/global', { params: { q: query } })
};

// Reports API
export const reportsAPI = {
    createReport: (data) => api.post('/reports', data)
};

// AI API
export const aiAPI = {
    auditVerification: () => api.post('/ai/audit-verification'),
    chat: (message, history) => api.post('/ai/chat', { message, history })
};

export default api;

// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

// Middleware to check if user is the owner of a resource
export const isOwner = (resourceUserId) => {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Unauthorized. Please log in.' });
        }

        if (req.user.id !== resourceUserId.toString()) {
            return res.status(403).json({ error: 'Forbidden. You do not have permission to perform this action.' });
        }

        next();
    };
};

// Middleware to check if user owns the resource or is admin (for future use)
// Middleware to check if user owns the resource or is admin
export const isOwnerOrAdmin = (resourceUserId) => {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Unauthorized. Please log in.' });
        }

        if (req.user.isAdmin) {
            return next();
        }

        if (req.user.id !== resourceUserId.toString()) {
            return res.status(403).json({ error: 'Forbidden. You do not have permission to perform this action.' });
        }

        next();
    };
};

// Middleware to check if user is an admin
export const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
};

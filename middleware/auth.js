const User = require('../models/User');

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/auth/login');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).send('Authentication error');
    }
};

// Middleware to check if user is NOT authenticated (for login/register pages)
const requireGuest = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    next();
};

// Middleware to get current user if authenticated (optional auth)
const getCurrentUser = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            req.user = user;
        } catch (error) {
            console.error('Error getting current user:', error);
        }
    }
    next();
};

module.exports = {
    requireAuth,
    requireGuest,
    getCurrentUser
};
// Authentication middleware - to be fully implemented in Task 2

// Check if user is authenticated
const requireAuth = (req, res, next) => {
    // Placeholder implementation
    if (req.session && req.session.userId) {
        return next();
    }
    
    // For now, just continue - will be properly implemented in Task 2
    console.log('Authentication middleware - to be implemented in Task 2');
    return next();
};

// Check if user is guest (not authenticated)
const requireGuest = (req, res, next) => {
    // Placeholder implementation
    if (req.session && req.session.userId) {
        return res.status(403).json({ 
            error: 'Already authenticated',
            message: 'Guest access middleware - to be implemented in Task 2'
        });
    }
    
    console.log('Guest middleware - to be implemented in Task 2');
    return next();
};

module.exports = {
    requireAuth,
    requireGuest
};
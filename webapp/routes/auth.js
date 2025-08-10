const express = require('express');
const router = express.Router();

// Placeholder routes for authentication - to be implemented in Task 2
router.get('/register', (req, res) => {
    res.status(200).json({ 
        message: 'Registration endpoint - to be implemented in Task 2',
        endpoint: '/auth/register'
    });
});

router.post('/register', (req, res) => {
    res.status(200).json({ 
        message: 'User registration - to be implemented in Task 2',
        endpoint: 'POST /auth/register'
    });
});

router.get('/login', (req, res) => {
    res.status(200).json({ 
        message: 'Login endpoint - to be implemented in Task 2',
        endpoint: '/auth/login'
    });
});

router.post('/login', (req, res) => {
    res.status(200).json({ 
        message: 'User login - to be implemented in Task 2',
        endpoint: 'POST /auth/login'
    });
});

router.post('/logout', (req, res) => {
    res.status(200).json({ 
        message: 'User logout - to be implemented in Task 2',
        endpoint: 'POST /auth/logout'
    });
});

module.exports = router;
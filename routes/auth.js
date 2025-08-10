const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Login page
router.get('/login', authMiddleware.requireGuest, (req, res) => {
    res.render('auth/login', { 
        title: 'Login',
        error: null
    });
});

// Login POST
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], authMiddleware.requireGuest, async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.render('auth/login', {
            title: 'Login',
            error: errors.array()[0].msg
        });
    }

    try {
        const { username, password } = req.body;
        const user = await User.findByUsername(username);

        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid username or password'
            });
        }

        const isValidPassword = await user.validatePassword(password);
        
        if (!isValidPassword) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid username or password'
            });
        }

        req.session.userId = user.id;
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred during login'
        });
    }
});

// Register page
router.get('/register', authMiddleware.requireGuest, (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        error: null
    });
});

// Register POST
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('first_name')
        .isLength({ min: 1, max: 50 })
        .withMessage('First name is required and must be less than 50 characters'),
    body('last_name')
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name is required and must be less than 50 characters')
], authMiddleware.requireGuest, async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.render('auth/register', {
            title: 'Register',
            error: errors.array()[0].msg
        });
    }

    try {
        const { username, email, password, first_name, last_name } = req.body;

        // Check if username already exists
        const existingUserByUsername = await User.findByUsername(username);
        if (existingUserByUsername) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Username already exists'
            });
        }

        // Check if email already exists
        const existingUserByEmail = await User.findByEmail(email);
        if (existingUserByEmail) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Email already exists'
            });
        }

        // Create new user
        const newUser = await User.create({
            username,
            email,
            password,
            first_name,
            last_name
        });

        req.session.userId = newUser.id;
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Register',
            error: 'An error occurred during registration'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/auth/login');
    });
});

module.exports = router;
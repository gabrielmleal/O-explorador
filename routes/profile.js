const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Profile page
router.get('/', (req, res) => {
    res.render('profile/index', {
        title: 'Profile',
        user: req.user,
        success: null,
        error: null
    });
});

// Edit profile page
router.get('/edit', (req, res) => {
    res.render('profile/edit', {
        title: 'Edit Profile',
        user: req.user,
        success: null,
        error: null
    });
});

// Update profile POST
router.post('/update', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('first_name')
        .isLength({ min: 1, max: 50 })
        .withMessage('First name is required and must be less than 50 characters'),
    body('last_name')
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name is required and must be less than 50 characters')
], async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.render('profile/edit', {
            title: 'Edit Profile',
            user: req.user,
            success: null,
            error: errors.array()[0].msg
        });
    }

    try {
        const { username, email, first_name, last_name } = req.body;

        // Check if username already exists (but not for current user)
        if (username !== req.user.username) {
            const existingUserByUsername = await User.findByUsername(username);
            if (existingUserByUsername) {
                return res.render('profile/edit', {
                    title: 'Edit Profile',
                    user: req.user,
                    success: null,
                    error: 'Username already exists'
                });
            }
        }

        // Check if email already exists (but not for current user)
        if (email !== req.user.email) {
            const existingUserByEmail = await User.findByEmail(email);
            if (existingUserByEmail) {
                return res.render('profile/edit', {
                    title: 'Edit Profile',
                    user: req.user,
                    success: null,
                    error: 'Email already exists'
                });
            }
        }

        // Update user
        const updatedUser = await req.user.update({
            username,
            email,
            first_name,
            last_name
        });

        req.user = updatedUser;

        res.render('profile/edit', {
            title: 'Edit Profile',
            user: updatedUser,
            success: 'Profile updated successfully!',
            error: null
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.render('profile/edit', {
            title: 'Edit Profile',
            user: req.user,
            success: null,
            error: 'An error occurred while updating your profile'
        });
    }
});

module.exports = router;
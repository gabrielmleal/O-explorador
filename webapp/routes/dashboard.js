const express = require('express');
const router = express.Router();

// Placeholder routes for dashboard - to be implemented in Task 4
router.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'User dashboard - to be implemented in Task 4',
        endpoint: '/dashboard'
    });
});

router.get('/stats', (req, res) => {
    res.status(200).json({ 
        message: 'User statistics - to be implemented in Task 4',
        endpoint: '/dashboard/stats'
    });
});

module.exports = router;
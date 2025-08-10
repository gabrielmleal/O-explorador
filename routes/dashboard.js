const express = require('express');
const router = express.Router();

// Dashboard home page
router.get('/', (req, res) => {
    res.render('dashboard/index', {
        title: 'Dashboard',
        user: req.user
    });
});

module.exports = router;
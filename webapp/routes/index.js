const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Home route
router.get('/', homeController.getHome);

// About route (basic info about the app)
router.get('/about', homeController.getAbout);

module.exports = router;
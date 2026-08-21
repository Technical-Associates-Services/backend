const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes (Rate limited to 5 attempts per 15 mins)
router.post('/login', authLimiter, authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

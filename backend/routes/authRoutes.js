const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, changePassword, getUserStats } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (protected)
router.get('/me', authMiddleware, getMe);

// PUT /api/auth/profile (protected)
router.put('/profile', authMiddleware, updateProfile);

// PUT /api/auth/password (protected)
router.put('/password', authMiddleware, changePassword);

// GET /api/auth/stats (protected)
router.get('/stats', authMiddleware, getUserStats);

module.exports = router;

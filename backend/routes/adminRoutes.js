const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET /api/admin/stats  — requires auth + admin role
router.get('/stats', authMiddleware, adminMiddleware, getStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getPreferences, updatePreferences } = require('../controllers/preferenceController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/preferences
router.get('/', authMiddleware, getPreferences);

// PUT /api/preferences
router.put('/', authMiddleware, updatePreferences);

module.exports = router;

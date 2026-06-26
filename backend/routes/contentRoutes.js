const express = require('express');
const router = express.Router();
const {
  generateText,
  generateImage,
  rewrite,
  saveContent,
  getHistory,
  deleteContent,
  guestGenerateText,
  guestGenerateImage
} = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const { guestTextLimiter, guestImageLimiter } = require('../middleware/rateLimitMiddleware');

// Guest routes (no authentication required, rate limited)
// POST /api/content/guest/generate-text
router.post('/guest/generate-text', guestTextLimiter, guestGenerateText);

// POST /api/content/guest/generate-image — uses multer for file upload
router.post(
  '/guest/generate-image',
  guestImageLimiter,
  upload.single('image'),
  handleUploadError,
  guestGenerateImage
);

// Authenticated routes
// POST /api/content/generate-text
router.post('/generate-text', authMiddleware, generateText);

// POST /api/content/generate-image  — uses multer for file upload
router.post(
  '/generate-image',
  authMiddleware,
  upload.single('image'),
  handleUploadError,
  generateImage
);

// POST /api/content/rewrite
router.post('/rewrite', authMiddleware, rewrite);

// POST /api/content/save
router.post('/save', authMiddleware, saveContent);

// GET /api/content/history
router.get('/history', authMiddleware, getHistory);

// DELETE /api/content/:id
router.delete('/:id', authMiddleware, deleteContent);

module.exports = router;

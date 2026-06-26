const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleAudioUploadError } = require('../middleware/audioUpload');
const {
  cloneVoice,
  createVoiceJob,
  getVoiceJob,
  downloadVoiceJob,
  cancelVoiceJob
} = require('../controllers/voiceController');

const router = express.Router();

router.post('/jobs', authMiddleware, upload.single('voice_sample'), handleAudioUploadError, createVoiceJob);
router.get('/jobs/:jobId/audio', authMiddleware, downloadVoiceJob);
router.get('/jobs/:jobId', authMiddleware, getVoiceJob);
router.delete('/jobs/:jobId', authMiddleware, cancelVoiceJob);

router.post('/clone', authMiddleware, upload.single('voice_sample'), handleAudioUploadError, cloneVoice);

module.exports = router;
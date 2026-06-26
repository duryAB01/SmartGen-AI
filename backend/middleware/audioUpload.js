const multer = require('multer');
const path = require('path');

const MAX_AUDIO_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/ogg',
  'application/ogg',
  'audio/webm',
  'video/webm'
]);
const ALLOWED_EXTENSIONS = new Set(['.wav', '.mp3', '.m4a', '.ogg', '.webm']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const normalizedMimeType = (file.mimetype || '').toLowerCase().split(';')[0];
    const validType = ALLOWED_MIME_TYPES.has(normalizedMimeType);
    const validExtension = ALLOWED_EXTENSIONS.has(extension);

    if (!validType || !validExtension) {
      const error = new Error('Please upload a WAV, MP3, M4A, OGG, or WebM audio file.');
      error.code = 'INVALID_AUDIO_TYPE';
      return cb(error);
    }

    return cb(null, true);
  }
});

const handleAudioUploadError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        code: 'AUDIO_TOO_LARGE',
        message: 'Voice samples must be 15 MB or smaller.'
      });
    }

    return res.status(400).json({
      success: false,
      code: 'AUDIO_UPLOAD_FAILED',
      message: 'The voice sample could not be uploaded. Please choose one audio file and try again.'
    });
  }

  if (err.code === 'INVALID_AUDIO_TYPE') {
    return res.status(400).json({
      success: false,
      code: err.code,
      message: err.message
    });
  }

  return next(err);
};

module.exports = {
  upload,
  handleAudioUploadError,
  MAX_AUDIO_SIZE,
  ALLOWED_MIME_TYPES
};
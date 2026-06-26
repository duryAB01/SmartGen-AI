const express = require('express');
const request = require('supertest');

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { _id: 'test-user-id' };
  next();
});

jest.mock('../services/voiceService', () => ({
  cloneVoice: jest.fn()
}));

const voiceService = require('../services/voiceService');
const voiceRoutes = require('../routes/voiceRoutes');

const createApp = () => {
  const app = express();
  app.use('/api/voice', voiceRoutes);
  return app;
};

describe('Voice cloning multipart route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('accepts a protected multipart voice sample and returns MP3 audio', async () => {
    const generatedAudio = Buffer.from('RIFF-generated-audio');
    voiceService.cloneVoice.mockResolvedValue({
      buffer: generatedAudio,
      contentType: 'audio/mpeg',
      filename: 'smartgen-cloned-voice.mp3'
    });

    const response = await request(createApp())
      .post('/api/voice/clone')
      .field('reference_text', 'Reference words')
      .field('script', 'Generated words')
      .attach('voice_sample', Buffer.from('RIFF-reference-audio'), {
        filename: 'sample.wav',
        contentType: 'audio/wav'
      })
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^audio\/mpeg/);
    expect(response.headers['content-disposition']).toContain('smartgen-cloned-voice.mp3');
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect(voiceService.cloneVoice).toHaveBeenCalledWith(expect.objectContaining({
      mimeType: 'audio/wav',
      referenceText: 'Reference words',
      script: 'Generated words'
    }));
    expect(voiceService.cloneVoice.mock.calls[0][0].audioBuffer).toBeInstanceOf(Buffer);
  });

  test('rejects a request without a voice sample', async () => {
    const response = await request(createApp())
      .post('/api/voice/clone')
      .field('reference_text', 'Reference words')
      .field('script', 'Generated words');

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VOICE_SAMPLE_REQUIRED');
    expect(voiceService.cloneVoice).not.toHaveBeenCalled();
  });

  test('rejects unsupported upload formats before calling the provider', async () => {
    const response = await request(createApp())
      .post('/api/voice/clone')
      .field('reference_text', 'Reference words')
      .field('script', 'Generated words')
      .attach('voice_sample', Buffer.from('not-audio'), {
        filename: 'sample.txt',
        contentType: 'text/plain'
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_AUDIO_TYPE');
    expect(voiceService.cloneVoice).not.toHaveBeenCalled();
  });
});


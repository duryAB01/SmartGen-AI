const express = require('express');
const request = require('supertest');

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { _id: 'test-user-id' };
  next();
});

jest.mock('../services/voiceJobService', () => ({
  createJob: jest.fn(),
  getJob: jest.fn(),
  getJobAudio: jest.fn(),
  cancelJob: jest.fn()
}));

const voiceJobService = require('../services/voiceJobService');
const voiceRoutes = require('../routes/voiceRoutes');

const createApp = () => {
  const app = express();
  app.use('/api/voice', voiceRoutes);
  return app;
};

describe('Voice background job routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a job from multipart audio and normalized controls', async () => {
    voiceJobService.createJob.mockReturnValue({
      id: 'job-1',
      status: 'queued',
      progress: 10
    });

    const response = await request(createApp())
      .post('/api/voice/jobs')
      .field('reference_text', 'Exact reference words')
      .field('script', 'Generated words')
      .field('speed', '1.1')
      .field('quality', 'standard')
      .field('variation', 'stable')
      .field('remove_silence', 'true')
      .attach('voice_sample', Buffer.from('RIFF-reference-audio'), {
        filename: 'sample.wav',
        contentType: 'audio/wav'
      });

    expect(response.status).toBe(202);
    expect(response.body.job.id).toBe('job-1');
    expect(voiceJobService.createJob).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'test-user-id',
      referenceText: 'Exact reference words',
      script: 'Generated words',
      options: {
        speed: 1.1,
        quality: 'standard',
        variation: 'stable',
        removeSilence: true
      }
    }));
  });

  test('returns an owned job status', async () => {
    voiceJobService.getJob.mockReturnValue({ id: 'job-1', status: 'processing' });
    const response = await request(createApp()).get('/api/voice/jobs/job-1');
    expect(response.status).toBe(200);
    expect(response.body.job.status).toBe('processing');
    expect(voiceJobService.getJob).toHaveBeenCalledWith('job-1', 'test-user-id');
  });

  test('returns completed temporary audio', async () => {
    voiceJobService.getJobAudio.mockReturnValue({
      buffer: Buffer.from('RIFF-result'),
      contentType: 'audio/mpeg',
      filename: 'smartgen-cloned-voice.mp3'
    });

    const response = await request(createApp())
      .get('/api/voice/jobs/job-1/audio')
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('audio/mpeg');
    expect(Buffer.isBuffer(response.body)).toBe(true);
  });

  test('cancels an owned job', async () => {
    voiceJobService.cancelJob.mockReturnValue({ id: 'job-1', status: 'canceled' });
    const response = await request(createApp()).delete('/api/voice/jobs/job-1');
    expect(response.status).toBe(200);
    expect(response.body.job.status).toBe('canceled');
  });
});


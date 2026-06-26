jest.mock('../services/voiceService', () => ({
  cloneVoice: jest.fn()
}));

const voiceService = require('../services/voiceService');
const {
  createJob,
  getJob,
  getJobAudio,
  cancelJob,
  VoiceJobError
} = require('../services/voiceJobService');

const waitForBackgroundTask = () => new Promise((resolve) => setImmediate(resolve));

describe('Voice job service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('completes generation in the background and retains temporary audio', async () => {
    voiceService.cloneVoice.mockResolvedValue({
      buffer: Buffer.from('RIFF-result'),
      contentType: 'audio/wav',
      filename: 'voice.wav'
    });

    const created = createJob({
      userId: 'background-user',
      audioBuffer: Buffer.from('RIFF-sample'),
      mimeType: 'audio/wav',
      referenceText: 'Reference',
      script: 'Script',
      options: { speed: 1, quality: 'high', variation: 'natural', removeSilence: true }
    });

    expect(created.status).toBe('queued');
    await waitForBackgroundTask();
    await waitForBackgroundTask();

    const completed = getJob(created.id, 'background-user');
    expect(completed.status).toBe('completed');
    expect(completed.hasAudio).toBe(true);
    expect(getJobAudio(created.id, 'background-user').buffer).toBeInstanceOf(Buffer);
  });

  test('prevents another user from reading a job', () => {
    const created = createJob({
      userId: 'owner-user',
      audioBuffer: Buffer.from('sample'),
      mimeType: 'audio/wav',
      referenceText: 'Reference',
      script: 'Script',
      options: {}
    });

    expect(() => getJob(created.id, 'different-user')).toThrow(VoiceJobError);
    cancelJob(created.id, 'owner-user');
  });
});
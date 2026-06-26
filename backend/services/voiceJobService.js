const crypto = require('crypto');
const voiceService = require('./voiceService');
const Content = require('../models/Content');
const logAnalytics = require('../utils/logAnalytics');

const jobs = new Map();
const RESULT_TTL_MS = 30 * 60 * 1000;
const FAILED_TTL_MS = 10 * 60 * 1000;
const MAX_ACTIVE_JOBS = 5;

class VoiceJobError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'VoiceJobError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const isActive = (job) => ['queued', 'processing'].includes(job.status);

const serializeJob = (job) => ({
  id: job.id,
  status: job.status,
  stage: job.stage,
  progress: job.progress,
  script: job.script,
  options: job.options,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  expiresAt: job.expiresAt,
  hasAudio: job.status === 'completed' && Boolean(job.audio?.buffer),
  error: job.status === 'failed' ? job.error : null
});

const assertOwner = (job, userId) => {
  if (!job || job.userId !== String(userId)) {
    throw new VoiceJobError('Voice job not found.', 404, 'VOICE_JOB_NOT_FOUND');
  }
};

const runJob = async (job, input) => {
  if (job.status === 'canceled') return;

  job.status = 'processing';
  job.stage = 'Creating your voice result';
  job.progress = 45;
  job.updatedAt = new Date().toISOString();

  try {
    const audio = await voiceService.cloneVoice(input);

    if (job.status === 'canceled') return;

    job.audio = audio;
    try {
      await Content.create({
        userId: job.userId,
        type: 'voice',
        prompt: job.script.slice(0, 200) || 'Voice generation',
        inputText: job.script,
        result: 'Generated voice audio: smartgen-cloned-voice.mp3',
        tone: job.options?.tone || null,
        platform: job.options?.platform || null,
        contentType: 'voice-cloning',
        metadata: { ...job.options, provider: 'F5-TTS', outputFormat: 'mp3', autoSaved: true, audioFilename: audio.filename }
      });
      await logAnalytics({ userId: job.userId, moduleName: 'voice', action: 'voice-clone', startTime: Date.parse(job.createdAt) || Date.now(), status: 'success' });
    } catch (saveError) {
      console.warn('[VoiceJob] Voice generated but history auto-save failed:', saveError.message);
    }
    job.status = 'completed';
    job.stage = 'Voice ready';
    job.progress = 100;
    job.updatedAt = new Date().toISOString();
    job.expiresAt = new Date(Date.now() + RESULT_TTL_MS).toISOString();
  } catch (error) {
    if (job.status === 'canceled') return;

    job.status = 'failed';
    job.stage = 'Generation failed';
    job.progress = 100;
    job.error = {
      code: error.code || 'VOICE_GENERATION_FAILED',
      message: error.message || 'Voice generation failed. Please try again.'
    };
    job.updatedAt = new Date().toISOString();
    job.expiresAt = new Date(Date.now() + FAILED_TTL_MS).toISOString();
  }
};

const createJob = ({ userId, audioBuffer, mimeType, referenceText, script, options }) => {
  const normalizedUserId = String(userId);
  const activeForUser = [...jobs.values()].find(
    (job) => job.userId === normalizedUserId && isActive(job)
  );

  if (activeForUser) {
    throw new VoiceJobError(
      'A voice generation is already running. You can continue using other SmartGen tools.',
      409,
      'VOICE_JOB_ALREADY_ACTIVE'
    );
  }

  const activeCount = [...jobs.values()].filter(isActive).length;
  if (activeCount >= MAX_ACTIVE_JOBS) {
    throw new VoiceJobError(
      'Voice generation is busy right now. Please try again shortly.',
      503,
      'VOICE_QUEUE_BUSY'
    );
  }

  const now = new Date().toISOString();
  const job = {
    id: crypto.randomUUID(),
    userId: normalizedUserId,
    status: 'queued',
    stage: 'Waiting for the voice engine',
    progress: 10,
    script,
    options,
    audio: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    expiresAt: null
  };

  jobs.set(job.id, job);

  const input = {
    audioBuffer,
    mimeType,
    referenceText,
    script,
    options
  };

  setImmediate(() => runJob(job, input));
  return serializeJob(job);
};

const getJob = (jobId, userId) => {
  const job = jobs.get(jobId);
  assertOwner(job, userId);
  return serializeJob(job);
};

const getJobAudio = (jobId, userId) => {
  const job = jobs.get(jobId);
  assertOwner(job, userId);

  if (job.status !== 'completed' || !job.audio?.buffer) {
    throw new VoiceJobError('Voice audio is not ready yet.', 409, 'VOICE_AUDIO_NOT_READY');
  }

  return job.audio;
};

const cancelJob = (jobId, userId) => {
  const job = jobs.get(jobId);
  assertOwner(job, userId);

  if (job.status === 'completed') {
    throw new VoiceJobError('Completed voice jobs cannot be canceled.', 409, 'VOICE_JOB_COMPLETED');
  }

  job.status = 'canceled';
  job.stage = 'Generation canceled';
  job.progress = 100;
  job.audio = null;
  job.updatedAt = new Date().toISOString();
  job.expiresAt = new Date(Date.now() + FAILED_TTL_MS).toISOString();
  return serializeJob(job);
};

const cleanupExpiredJobs = () => {
  const now = Date.now();
  jobs.forEach((job, id) => {
    if (job.expiresAt && Date.parse(job.expiresAt) <= now) {
      job.audio = null;
      jobs.delete(id);
    }
  });
};

const cleanupTimer = setInterval(cleanupExpiredJobs, 5 * 60 * 1000);
cleanupTimer.unref?.();

module.exports = {
  createJob,
  getJob,
  getJobAudio,
  cancelJob,
  cleanupExpiredJobs,
  VoiceJobError,
  serializeJob
};


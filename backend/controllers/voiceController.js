const voiceService = require('../services/voiceService');
const voiceJobService = require('../services/voiceJobService');

const MAX_REFERENCE_TEXT_LENGTH = 1000;
const MAX_SCRIPT_LENGTH = 5000;

const parseOptions = (body = {}) => {
  const options = {
    speed: Math.min(1.2, Math.max(0.8, Number(body.speed) || 1)),
    quality: body.quality === 'standard' ? 'standard' : 'high',
    variation: body.variation === 'stable' ? 'stable' : 'natural',
    removeSilence: String(body.remove_silence).toLowerCase() === 'true'
  };
  if (body.platform) options.platform = String(body.platform).trim();
  if (body.tone) options.tone = String(body.tone).trim();
  return options;
};

const validateVoiceRequest = (req, res) => {
  const referenceText = String(req.body.reference_text || '').trim();
  const script = String(req.body.script || '').trim();

  if (!req.file?.buffer) {
    res.status(400).json({ success: false, code: 'VOICE_SAMPLE_REQUIRED', message: 'Please record or upload a voice sample.' });
    return null;
  }

  if (!referenceText) {
    res.status(400).json({ success: false, code: 'REFERENCE_TEXT_REQUIRED', message: 'Enter the exact words spoken in the voice sample.' });
    return null;
  }

  if (!script) {
    res.status(400).json({ success: false, code: 'SCRIPT_REQUIRED', message: 'Enter the script you want the voice to speak.' });
    return null;
  }

  if (referenceText.length > MAX_REFERENCE_TEXT_LENGTH || script.length > MAX_SCRIPT_LENGTH) {
    res.status(400).json({ success: false, code: 'VOICE_TEXT_TOO_LONG', message: 'The supplied text is too long. Shorten it and try again.' });
    return null;
  }

  return {
    audioBuffer: req.file.buffer,
    mimeType: req.file.mimetype,
    referenceText,
    script,
    options: parseOptions(req.body)
  };
};

const sendAudio = (res, audio) => {
  res.set({
    'Content-Type': audio.contentType || 'audio/mpeg',
    'Content-Length': audio.buffer.length,
    'Content-Disposition': 'attachment; filename="' + audio.filename + '"',
    'Cache-Control': 'private, no-store, max-age=0',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  return res.status(200).send(audio.buffer);
};

const cloneVoice = async (req, res) => {
  const input = validateVoiceRequest(req, res);
  if (!input) return undefined;

  try {
    const audio = await voiceService.cloneVoice(input);
    return sendAudio(res, audio);
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      success: false,
      code: error.code || 'VOICE_GENERATION_FAILED',
      message: error.message || 'Voice generation failed. Please try again.'
    });
  }
};

const createVoiceJob = (req, res) => {
  const input = validateVoiceRequest(req, res);
  if (!input) return undefined;

  try {
    const job = voiceJobService.createJob({ userId: req.user._id, ...input });
    return res.status(202).json({ success: true, job });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'VOICE_JOB_CREATE_FAILED',
      message: error.message || 'Could not start voice generation.'
    });
  }
};

const getVoiceJob = (req, res) => {
  try {
    const job = voiceJobService.getJob(req.params.jobId, req.user._id);
    return res.json({ success: true, job });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'VOICE_JOB_STATUS_FAILED',
      message: error.message || 'Could not load voice generation status.'
    });
  }
};

const downloadVoiceJob = (req, res) => {
  try {
    const audio = voiceJobService.getJobAudio(req.params.jobId, req.user._id);
    return sendAudio(res, audio);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'VOICE_AUDIO_FAILED',
      message: error.message || 'Could not load the generated audio.'
    });
  }
};

const cancelVoiceJob = (req, res) => {
  try {
    const job = voiceJobService.cancelJob(req.params.jobId, req.user._id);
    return res.json({ success: true, job });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'VOICE_JOB_CANCEL_FAILED',
      message: error.message || 'Could not cancel voice generation.'
    });
  }
};

module.exports = { cloneVoice, createVoiceJob, getVoiceJob, downloadVoiceJob, cancelVoiceJob };



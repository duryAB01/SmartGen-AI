const VOICE_TIMEOUT_MS = 4.5 * 60 * 1000;
const AUDIO_DOWNLOAD_TIMEOUT_MS = 30 * 1000;
const MAX_GENERATED_AUDIO_SIZE = 50 * 1024 * 1024;
const { ensureMp3Audio } = require('./audioEncodingService');

class VoiceServiceError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'VoiceServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

let gradioModulePromise;

const loadGradioClient = () => {
  if (!gradioModulePromise) {
    gradioModulePromise = import('@gradio/client');
  }
  return gradioModulePromise;
};

const withTimeout = (promise, timeoutMs, timeoutError) => {
  let timeoutId;
  const timer = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
  });

  return Promise.race([promise, timer]).finally(() => clearTimeout(timeoutId));
};

const getEngineUrl = () => {
  const rawUrl = (process.env.F5_GRADIO_URL || '').trim();

  if (!rawUrl) {
    throw new VoiceServiceError(
      'Voice generation is temporarily unavailable. Please try again later.',
      503,
      'VOICE_ENGINE_OFFLINE'
    );
  }

  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid protocol');
    return rawUrl.replace(/\/+$/, '');
  } catch {
    throw new VoiceServiceError(
      'Voice generation is temporarily unavailable. Please try again later.',
      503,
      'VOICE_ENGINE_OFFLINE'
    );
  }
};

const isBlob = (value) => typeof Blob !== 'undefined' && value instanceof Blob;

const findAudioOutput = (data) => {
  const queue = Array.isArray(data) ? [...data] : [data];
  const visited = new Set();

  while (queue.length) {
    const value = queue.shift();
    if (value == null) continue;

    if (Buffer.isBuffer(value) || value instanceof ArrayBuffer || isBlob(value)) {
      return value;
    }

    if (typeof value === 'string') {
      if (/^https?:\/\//i.test(value)) return { url: value };
      continue;
    }

    if (typeof value !== 'object' || visited.has(value)) continue;
    visited.add(value);

    if (typeof value.url === 'string') return value;
    if (typeof value.path === 'string' && /^https?:\/\//i.test(value.path)) {
      return { ...value, url: value.path };
    }

    ['audio', 'file', 'value', 'data', 'output'].forEach((key) => {
      if (value[key] != null) queue.push(value[key]);
    });

    if (Array.isArray(value)) queue.push(...value);
  }

  return null;
};

const toAudioBuffer = async (output, engineUrl) => {
  if (Buffer.isBuffer(output)) {
    return { buffer: output, contentType: 'audio/wav' };
  }

  if (output instanceof ArrayBuffer) {
    return { buffer: Buffer.from(output), contentType: 'audio/wav' };
  }

  if (isBlob(output)) {
    return {
      buffer: Buffer.from(await output.arrayBuffer()),
      contentType: output.type || 'audio/wav'
    };
  }

  let outputUrl = output?.url;

  if (!outputUrl && output?.path) {
    outputUrl = `${engineUrl}/gradio_api/file=${encodeURIComponent(output.path)}`;
  }

  if (!outputUrl) {
    throw new VoiceServiceError(
      'The generated audio could not be prepared. Please try again.',
      502,
      'VOICE_OUTPUT_INVALID'
    );
  }

  let parsedOutputUrl;
  let parsedEngineUrl;
  try {
    parsedOutputUrl = new URL(outputUrl, engineUrl);
    parsedEngineUrl = new URL(engineUrl);
  } catch {
    throw new VoiceServiceError(
      'The generated audio could not be prepared. Please try again.',
      502,
      'VOICE_OUTPUT_INVALID'
    );
  }

  if (!['http:', 'https:'].includes(parsedOutputUrl.protocol)
      || parsedOutputUrl.hostname !== parsedEngineUrl.hostname) {
    throw new VoiceServiceError(
      'The generated audio could not be prepared. Please try again.',
      502,
      'VOICE_OUTPUT_INVALID'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUDIO_DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(parsedOutputUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new VoiceServiceError(
        'The generated audio could not be downloaded. Please try again.',
        502,
        'VOICE_OUTPUT_DOWNLOAD_FAILED'
      );
    }

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_GENERATED_AUDIO_SIZE) {
      throw new VoiceServiceError(
        'The generated audio is too large to return.',
        502,
        'VOICE_OUTPUT_TOO_LARGE'
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength || arrayBuffer.byteLength > MAX_GENERATED_AUDIO_SIZE) {
      throw new VoiceServiceError(
        'The generated audio could not be prepared. Please try again.',
        502,
        'VOICE_OUTPUT_INVALID'
      );
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get('content-type') || output.mime_type || 'audio/wav'
    };
  } catch (error) {
    if (error instanceof VoiceServiceError) throw error;
    if (error.name === 'AbortError') {
      throw new VoiceServiceError(
        'Voice generation is taking longer than expected. Please try again.',
        504,
        'VOICE_ENGINE_TIMEOUT'
      );
    }
    throw new VoiceServiceError(
      'Voice generation is temporarily unavailable. Please try again later.',
      503,
      'VOICE_ENGINE_OFFLINE'
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

const mapProviderError = (error) => {
  if (error instanceof VoiceServiceError) return error;

  const message = String(error?.message || '').toLowerCase();

  if (message.includes('timeout') || message.includes('aborted')) {
    return new VoiceServiceError(
      'Voice generation is taking longer than expected. Please try again.',
      504,
      'VOICE_ENGINE_TIMEOUT'
    );
  }

  if (
    message.includes('fetch failed')
    || message.includes('failed to fetch')
    || message.includes('not found')
    || message.includes('resolve app config')
    || message.includes('app config')
    || message.includes('connect')
    || message.includes('network')
    || message.includes('econnrefused')
    || message.includes('enotfound')
  ) {
    return new VoiceServiceError(
      'Voice generation is temporarily unavailable. The voice engine may be offline.',
      503,
      'VOICE_ENGINE_OFFLINE'
    );
  }

  if (
    message.includes('audio')
    || message.includes('soundfile')
    || message.includes('decode')
    || message.includes('wave')
    || message.includes('sample')
  ) {
    return new VoiceServiceError(
      'We could not process that voice sample. Try a clear 8-12 second recording with minimal background noise.',
      422,
      'VOICE_SAMPLE_INVALID'
    );
  }

  return new VoiceServiceError(
    'Voice generation failed. Please try again in a moment.',
    502,
    'VOICE_GENERATION_FAILED'
  );
};

async function cloneVoice({ audioBuffer, mimeType, referenceText, script, options = {} }) {
  const engineUrl = getEngineUrl();
  const speed = Math.min(1.2, Math.max(0.8, Number(options.speed) || 1));
  const nfe = options.quality === 'standard' ? 24 : 32;
  const stable = options.variation === 'stable';
  const removeSilence = Boolean(options.removeSilence);
  let client;

  try {
    const { Client, handle_file: handleFile } = await loadGradioClient();
    const referenceAudio = new Blob([audioBuffer], { type: mimeType || 'audio/wav' });

    client = await withTimeout(
      Client.connect(engineUrl),
      VOICE_TIMEOUT_MS,
      new VoiceServiceError(
        'Voice generation is taking longer than expected. Please try again.',
        504,
        'VOICE_ENGINE_TIMEOUT'
      )
    );

    const result = await withTimeout(
      client.predict('/basic_tts', {
        ref_audio_input: handleFile(referenceAudio),
        ref_text_input: referenceText,
        gen_text_input: script,
        remove_silence: removeSilence,
        randomize_seed: !stable,
        seed_input: stable ? 42 : 0,
        cross_fade_duration_slider: 0.15,
        nfe_slider: nfe,
        speed_slider: speed
      }),
      VOICE_TIMEOUT_MS,
      new VoiceServiceError(
        'Voice generation is taking longer than expected. Please try again.',
        504,
        'VOICE_ENGINE_TIMEOUT'
      )
    );

    const output = findAudioOutput(result?.data);
    if (!output) {
      throw new VoiceServiceError(
        'The voice engine returned no audio. Please try again.',
        502,
        'VOICE_OUTPUT_EMPTY'
      );
    }

    const audio = await toAudioBuffer(output, engineUrl);
    return ensureMp3Audio({
      ...audio,
      filename: 'smartgen-cloned-voice.mp3'
    });
  } catch (error) {
    const safeError = mapProviderError(error);
    console.error('[voiceService] ' + safeError.code);
    throw safeError;
  } finally {
    if (client && typeof client.close === 'function') {
      client.close();
    }
  }
}

module.exports = {
  cloneVoice,
  VoiceServiceError,
  findAudioOutput,
  mapProviderError
};

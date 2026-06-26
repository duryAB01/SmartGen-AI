const {
  VoiceServiceError,
  findAudioOutput,
  mapProviderError
} = require('../services/voiceService');

describe('Voice service safety helpers', () => {
  test('finds the generated audio URL in a Gradio response', () => {
    const output = findAudioOutput([
      { url: 'https://example.gradio.live/gradio_api/file=result.wav', mime_type: 'audio/wav' }
    ]);

    expect(output.url).toContain('result.wav');
  });

  test('maps an unavailable temporary app to a safe offline error', () => {
    const error = mapProviderError(new Error('Could not resolve app config.'));
    expect(error).toBeInstanceOf(VoiceServiceError);
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('VOICE_ENGINE_OFFLINE');
    expect(error.message).not.toMatch(/gradio|colab|f5/i);
  });

  test('does not expose raw provider failures', () => {
    const error = mapProviderError(new Error('Private provider stack trace and internal URL'));
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('VOICE_GENERATION_FAILED');
    expect(error.message).toBe('Voice generation failed. Please try again in a moment.');
  });
});
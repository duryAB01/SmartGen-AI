/**
 * Gemini AI Configuration — Lazy Initialization
 * Uses the current @google/genai SDK (replaces deprecated @google/generative-ai).
 * Supports both legacy AIza... keys and new AQ... authorization keys.
 * Does NOT throw on server startup if GEMINI_API_KEY is missing.
 * Throws only when a Gemini function is actually called.
 */

const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL_CHAIN = 'gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash';

class GeminiAI {
  constructor() {
    // Intentionally do NOT throw here — allow server to start without key
    this.ai = null;
    this._initialized = false;
  }

  /**
   * Lazy-initialize the Gemini client.
   * Throws a clear error only when actually called.
   */
  _ensureInitialized() {
    if (this._initialized) return;

    const apiKeyRaw = process.env.GEMINI_API_KEY;
    if (!apiKeyRaw || apiKeyRaw === 'your_gemini_api_key_here' || apiKeyRaw.trim() === '') {
      const err = new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your backend .env file.');
      err.statusCode = 503;
      throw err;
    }

    const apiKey = apiKeyRaw.trim().replace(/^["']|["']$/g, '');
    this.ai = new GoogleGenAI({ apiKey });
    this._initialized = true;

    if (process.env.NODE_ENV !== 'production') {
      const getMaskedKey = (key) => {
        if (!key) return 'Not configured';
        const clean = key.trim().replace(/^["']|["']$/g, '');
        if (clean.length <= 10) return '...';
        return clean.substring(0, 6) + '...' + clean.substring(clean.length - 4);
      };
      console.log('✅ Gemini AI client initialized (@google/genai SDK)');
      console.log(`🔑 GEMINI_API_KEY loaded: ${getMaskedKey(apiKeyRaw)}`);
      console.log(`🤖 GEMINI_MODEL: ${process.env.GEMINI_MODEL || DEFAULT_MODEL_CHAIN}`);
    }
  }

  /**
   * Get the initialized GoogleGenAI client instance (lazy).
   * Use this to call ai.models.generateContent(...)
   */
  getClient() {
    this._ensureInitialized();
    return this.ai;
  }

  /**
   * Test the Gemini API connection with a minimal request.
   */
  async testConnection() {
    try {
      const ai = this.getClient();
      const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL_CHAIN).split(',')[0].trim();
      const response = await ai.models.generateContent({
        model: model,
        contents: 'Say OK in one word.'
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ Gemini API connection test successful (Model: ${model})`);
      }
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Gemini API connection test failed:', error.message);
      }
      return false;
    }
  }
}

// Export singleton instance (lazy — does not initialize until used)
const geminiAI = new GeminiAI();
module.exports = geminiAI;

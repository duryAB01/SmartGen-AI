const mongoose = require('mongoose');
const Content = require('../models/Content');
const Preference = require('../models/Preference');
const ImageRequest = require('../models/ImageRequest');
const geminiService = require('../services/geminiService');
const logAnalytics = require('../utils/logAnalytics');

// â”€â”€â”€ Helper: fetch user preferences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getUserPreferences(userId) {
  try {
    return await Preference.findOne({ userId });
  } catch {
    return null;
  }
}

// â”€â”€â”€ Helper: mask API key for logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getMaskedKey() {
  const raw = process.env.GEMINI_API_KEY || '';
  const key = raw.trim().replace(/^["']|["']$/g, '');
  if (!key || key.length <= 10) return 'Not configured';
  return key.substring(0, 6) + '...' + key.substring(key.length - 4);
}

// â”€â”€â”€ Helper: log real controller/Gemini errors in detail in backend console â”€â”€â”€â”€
function logControllerError(route, error) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  console.error(`âŒ [contentController] ${route} error:`, {
    route,
    model,
    keyPrefix: getMaskedKey(),
    status: error.status || error.statusCode || 500,
    code: error.code || 'N/A',
    message: error.message
  });

  if (error.originalError) {
    const orig = error.originalError;
    console.error(`  â””â”€ Original error:`, {
      message: orig.message,
      status: orig.status,
      statusCode: orig.statusCode
    });
  }
}

// â”€â”€â”€ POST /api/content/generate-text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.generateText = async (req, res) => {
  const startTime = Date.now();
  try {
    // Accept both 'prompt' and 'topic' field names for flexibility
    const rawPrompt = req.body.prompt || req.body.topic || '';
    const { keywords, tone, platform, contentType, contentTypes, includeEmojis } = req.body;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[generate-text] Request body keys:', Object.keys(req.body));
      console.log('[generate-text] Model:', process.env.GEMINI_MODEL || 'gemini-2.0-flash');
      console.log('[generate-text] Key prefix:', getMaskedKey());
    }

    if (!rawPrompt || !rawPrompt.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a topic or prompt.' });
    }

    // Fetch user preferences to enrich the prompt
    const preferences = await getUserPreferences(req.user.id);


    const result = await geminiService.generateTextFromPrompt({
      prompt: rawPrompt.trim(),
      keywords: keywords || '',
      tone: tone || (preferences?.preferredTone) || 'Professional',
      platform: platform || (preferences?.preferredPlatform) || 'General',
      contentType: contentType || 'content',
      includeEmojis: includeEmojis !== false,
      includeHashtags: includeHashtags !== false,
      preferences
    });

    await logAnalytics({ userId: req.user.id, moduleName: 'text', action: 'generate-text', startTime, status: 'success' });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logControllerError('generate-text', error);
    await logAnalytics({ userId: req.user.id, moduleName: 'text', action: 'generate-text', startTime, status: 'failure', errorMessage: error.message });
    return res.status(statusCode).json({ success: false, message: error.message || 'Text generation failed.' });
  }
};

// â”€â”€â”€ POST /api/content/generate-image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.generateImage = async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'An image file is required.' });
    }

    const { prompt, tone, platform, contentType } = req.body;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[generate-image] Request body keys:', Object.keys(req.body));
      console.log('[generate-image] File:', req.file?.originalname, req.file?.mimetype);
      console.log('[generate-image] Model:', process.env.GEMINI_MODEL || 'gemini-2.0-flash');
      console.log('[generate-image] Key prefix:', getMaskedKey());
    }

    const preferences = await getUserPreferences(req.user.id);

    // Call Gemini with image buffer
    const result = await geminiService.generateImageContent({
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      prompt: prompt || '',
      tone: tone || (preferences?.preferredTone) || 'Professional',
      platform: platform || (preferences?.preferredPlatform) || 'Instagram',
      contentType: contentType || 'caption',
      preferences
    });

    // Save image request metadata (not the actual image file)
    await ImageRequest.create({
      userId: req.user.id,
      imageName: req.file.originalname || 'uploaded-image',
      imageFormat: req.file.mimetype,
      imageSize: req.file.size,
      optionalPrompt: prompt || '',
      generatedOutput: result
    });

    await logAnalytics({ userId: req.user.id, moduleName: 'image', action: 'generate-image', startTime, status: 'success' });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logControllerError('generate-image', error);
    await logAnalytics({ userId: req.user.id, moduleName: 'image', action: 'generate-image', startTime, status: 'failure', errorMessage: error.message });
    return res.status(statusCode).json({ success: false, message: error.message || 'Image content generation failed.' });
  }
};

// â”€â”€â”€ POST /api/content/rewrite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.rewrite = async (req, res) => {
  const startTime = Date.now();
  try {
    const { inputText, rewriteAction, tone, platform } = req.body;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[rewrite] Request body keys:', Object.keys(req.body));
      console.log('[rewrite] Model:', process.env.GEMINI_MODEL || 'gemini-2.0-flash');
      console.log('[rewrite] Key prefix:', getMaskedKey());
    }

    if (!inputText || !inputText.trim()) {
      return res.status(400).json({ success: false, message: 'Input text is required for rewriting.' });
    }
    if (!rewriteAction) {
      return res.status(400).json({ success: false, message: 'Please select a rewrite action.' });
    }

    const preferences = await getUserPreferences(req.user.id);

    const result = await geminiService.rewriteContent({
      inputText: inputText.trim(),
      rewriteAction,
      tone: tone || (preferences?.preferredTone) || 'Professional',
      platform: platform || (preferences?.preferredPlatform) || 'General',
      preferences
    });

    await logAnalytics({ userId: req.user.id, moduleName: 'rewrite', action: `rewrite-${rewriteAction}`, startTime, status: 'success' });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logControllerError('rewrite', error);
    await logAnalytics({ userId: req.user.id, moduleName: 'rewrite', action: 'rewrite', startTime, status: 'failure', errorMessage: error.message });
    return res.status(statusCode).json({ success: false, message: error.message || 'Content rewriting failed.' });
  }
};

// â”€â”€â”€ POST /api/content/save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.saveContent = async (req, res) => {
  try {
    const { type, prompt, inputText, result, tone, platform, contentType, metadata } = req.body;

    if (!type || !['text', 'image', 'rewrite'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Valid content type is required (text, image, rewrite).' });
    }
    if (!result || !result.trim()) {
      return res.status(400).json({ success: false, message: 'Result content is required.' });
    }
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    const content = await Content.create({
      userId: req.user.id,
      type,
      prompt: prompt.trim(),
      inputText: inputText || null,
      result: result.trim(),
      tone: tone || null,
      platform: platform || null,
      contentType: contentType || null,
      metadata: metadata || {}
    });

    return res.status(201).json({
      success: true,
      message: 'Content saved successfully!',
      content
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save content.' });
  }
};

// â”€â”€â”€ GET /api/content/history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getHistory = async (req, res) => {
  const startTime = Date.now();
  try {
    const history = await Content.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    await logAnalytics({ userId: req.user.id, moduleName: 'history', action: 'fetch-history', startTime, status: 'success' });

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    await logAnalytics({ userId: req.user.id, moduleName: 'history', action: 'fetch-history', startTime, status: 'failure', errorMessage: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
};

// â”€â”€â”€ DELETE /api/content/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID.' });
    }

    // Find and ensure ownership
    const content = await Content.findOne({ _id: id, userId: req.user.id });
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found or access denied.' });
    }

    await Content.deleteOne({ _id: id });

    return res.status(200).json({ success: true, message: 'Content deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete content.' });
  }
};

// â”€â”€â”€ POST /api/content/guest/generate-text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.guestGenerateText = async (req, res) => {
  const startTime = Date.now();
  try {
    const { prompt, keywords, tone, platform, contentType, includeEmojis, includeHashtags } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt or topic is required.' });
    }


    const result = await geminiService.generateTextFromPrompt({
      prompt: prompt.trim(),
      keywords: keywords || '',
      tone: tone || 'Professional',
      platform: platform || 'Instagram',
      contentType: contentType || 'caption',
      includeEmojis: includeEmojis !== false,
      includeHashtags: includeHashtags !== false,
      preferences: null // No preferences for guests
    });

    // Log analytics without user ID (guest)
    await logAnalytics({ userId: null, moduleName: 'text', action: 'guest-generate-text', startTime, status: 'success' });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logControllerError('guest-generate-text', error);
    await logAnalytics({ userId: null, moduleName: 'text', action: 'guest-generate-text', startTime, status: 'failure', errorMessage: error.message });
    return res.status(statusCode).json({ success: false, message: error.message || 'Text generation failed.' });
  }
};

// â”€â”€â”€ POST /api/content/guest/generate-image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.guestGenerateImage = async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'An image file is required.' });
    }

    const { prompt, tone, platform, contentType, includeEmojis, includeHashtags } = req.body;

    // Build prompt with emoji/hashtag instructions
    let enhancedPrompt = prompt || '';
    if (includeEmojis === false) {
      enhancedPrompt += ' Do not include any emojis in the response.';
    }
    if (includeHashtags === false) {
      enhancedPrompt += ' Do not include any hashtags in the response.';
    }

    // Call Gemini with image buffer
    const result = await geminiService.generateImageContent({
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      prompt: enhancedPrompt,
      tone: tone || 'Professional',
      platform: platform || 'Instagram',
      contentType: contentType || 'caption',
      includeEmojis: includeEmojis !== false,
      includeHashtags: includeHashtags !== false,
      preferences: null // No preferences for guests
    });

    // Log analytics without user ID (guest)
    await logAnalytics({ userId: null, moduleName: 'image', action: 'guest-generate-image', startTime, status: 'success' });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logControllerError('guest-generate-image', error);
    await logAnalytics({ userId: null, moduleName: 'image', action: 'guest-generate-image', startTime, status: 'failure', errorMessage: error.message });
    return res.status(statusCode).json({ success: false, message: error.message || 'Image content generation failed.' });
  }
};





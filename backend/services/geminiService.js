/**
 * Gemini Service — Content Generation Functions
 * SDK: @google/genai | Default: fast/free-tier-friendly Gemini fallback chain
 */

const geminiAI = require('../config/gemini');

const DEFAULT_MODEL_CHAIN = 'gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash';

const DEFAULT_MODELS = (process.env.GEMINI_MODEL || DEFAULT_MODEL_CHAIN)
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);

function extractResponseText(response) {
  if (response?.text?.trim()) return response.text.trim();

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const fromParts = parts.map((part) => part.text || '').join('').trim();
  return fromParts;
}

function isRetryableModelError(error) {
  const rawMsg = error?.message || '';
  const msg = rawMsg.toLowerCase();
  const status = error?.status || error?.statusCode || error?.response?.status;

  return (
    status === 429 ||
    status === 404 ||
    status === 500 ||
    status === 503 ||
    status === 504 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource exhausted') ||
    msg.includes('high demand') ||
    msg.includes('experiencing high demand') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('temporarily') ||
    msg.includes('try again later') ||
    msg.includes('not found') ||
    msg.includes('not supported')
  );
}

function handleGeminiError(error, context) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[geminiService] ${context} error:`, error.message);
  }

  const rawMsg = error.message || '';
  const msg = rawMsg.toLowerCase();
  const status = error.status || error.statusCode || (error.response && error.response.status);

  const getCleanMessage = () => {
    let clean = rawMsg;
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.error && parsed.error.message) {
        clean = parsed.error.message;
      } else if (parsed.message) {
        clean = parsed.message;
      }
    } catch (e) {
      // Not JSON
    }
    return clean
      .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza...[masked]')
      .replace(/AQ\.[0-9A-Za-z-_]+/g, 'AQ...[masked]');
  };

  const cleanMessage = getCleanMessage();

  if (
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  ) {
    const err = new Error('Network error: Unable to connect to Gemini API. Please check your internet connection.');
    err.statusCode = 503;
    err.originalError = error;
    throw err;
  }

  const isQuota =
    status === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource exhausted') ||
    msg.includes('too many requests');

  if (isQuota) {
    const err = new Error('Gemini API quota exceeded for the configured model. Wait a minute or use a fallback chain in backend/.env, for example: gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash.');
    err.statusCode = 429;
    err.originalError = error;
    throw err;
  }

  const isOverloaded =
    status === 503 ||
    status === 504 ||
    msg.includes('high demand') ||
    msg.includes('experiencing high demand') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('temporarily') ||
    msg.includes('try again later');

  if (isOverloaded) {
    const err = new Error('Gemini is temporarily overloaded. Please try again in a moment, or keep multiple fallback models in GEMINI_MODEL.');
    err.statusCode = 503;
    err.originalError = error;
    throw err;
  }

  const isAuthErr =
    status === 401 ||
    status === 403 ||
    msg.includes('api key') ||
    msg.includes('api_key') ||
    msg.includes('unauthenticated') ||
    msg.includes('invalid key') ||
    msg.includes('permission denied') ||
    msg.includes('missing key') ||
    msg.includes('not configured');

  if (isAuthErr) {
    const err = new Error('Gemini API key is missing or invalid. Add a valid GEMINI_API_KEY in backend/.env.');
    err.statusCode = 401;
    err.originalError = error;
    throw err;
  }

  if (msg.includes('empty response') || msg.includes('empty')) {
    const err = new Error('AI returned an empty response. Please try again.');
    err.statusCode = 500;
    err.originalError = error;
    throw err;
  }

  const err = new Error(`Gemini API Error: ${cleanMessage}`);
  err.statusCode = status || 500;
  err.originalError = error;
  throw err;
}

async function generateContentWithFallback(contents, context = 'Content generation') {
  const ai = geminiAI.getClient();
  let lastError = null;

  for (let index = 0; index < DEFAULT_MODELS.length; index += 1) {
    const model = DEFAULT_MODELS[index];
    try {
      const response = await ai.models.generateContent({ model, contents });
      const result = extractResponseText(response);
      if (!result) {
        throw new Error('AI returned an empty response. Please try again.');
      }
      if (process.env.NODE_ENV !== 'production' && index > 0) {
        console.log(`[geminiService] Used fallback model: ${model}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      const hasNextModel = index < DEFAULT_MODELS.length - 1;
      if (hasNextModel && isRetryableModelError(error)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[geminiService] Model "${model}" unavailable, trying next fallback...`);
        }
        continue;
      }
      handleGeminiError(error, context);
    }
  }

  handleGeminiError(lastError || new Error('Gemini generation failed.'), context);
}

const FORMAT_INSTRUCTIONS = {
  caption: 'Write one platform-ready caption. Start with a useful hook, deliver one clear idea, and end naturally.',
  'reel-caption': 'Write one Instagram Reel caption only: a sharp first-line hook, a concise body, and an optional natural CTA.',
  'post-caption': 'Write one Instagram feed caption only with a strong opening and readable short paragraphs.',
  'carousel-caption': 'Write one Instagram carousel caption only: hook, concise value summary, and a swipe/save CTA when appropriate.',
  'story-text': 'Write one short Instagram Story text only. Keep it instantly readable on a phone screen.',
  'hashtag-set': 'Return only 10-15 specific, relevant hashtags. No caption, heading, numbering, or explanation.',
  'tiktok-caption': 'Write one short TikTok caption only. Make it conversational, immediate, and easy to understand.',
  'hook-caption': 'Return one TikTok hook followed by one short caption. No script, explanation, or alternate versions.',
  'video-script': 'Write one concise short-form video script with spoken lines only. Open quickly and keep every line useful.',
  'on-screen-text': 'Return only brief on-screen text lines suitable for a vertical video. No production notes.',
  'five-hashtags': 'Return exactly five specific and relevant hashtags, separated by spaces, and nothing else.',
  'shorts-title': 'Return exactly one clear YouTube Shorts title under 100 characters. No label, description, hashtags, or alternatives.',
  'long-video-title': 'Return exactly one polished YouTube long-video title under 100 characters. No label, description, hashtags, or alternatives.',
  'youtube-description': 'Write one YouTube description only. Lead with a two-line summary, then useful details and a natural CTA. Do not invent links or timestamps.',
  chapters: 'Return only a concise YouTube chapter outline using placeholder timestamps such as 00:00. Do not invent exact timings.',
  'pinned-comment': 'Return exactly one natural YouTube pinned comment that encourages a relevant response. Nothing else.',
  'professional-post': 'Write one LinkedIn post only with a clear insight, practical value, short paragraphs, and a thoughtful closing question when suitable.',
  'article-intro': 'Write one LinkedIn article introduction only. Establish the problem, relevance, and reader benefit without filler.',
  'hiring-post': 'Write one LinkedIn hiring post only. Be clear about the role and action, and never invent company facts or benefits.',
  'thought-leadership': 'Write one LinkedIn thought-leadership post only with a defensible point of view and practical takeaway.',
  'page-post': 'Write one Facebook Page post only with a friendly opening, useful message, and clear next step.',
  'group-post': 'Write one Facebook Group post only in a natural community voice that invites relevant discussion.',
  'event-promo': 'Write one Facebook event promotion only. Do not invent dates, venues, prices, or registration links.',
  'community-update': 'Write one clear Facebook community update only.',
  'single-post': 'Write one concise X post focused on one idea. Stay within 280 characters.',
  'thread-starter': 'Write one strong opening post for a social thread only. It should create curiosity without clickbait.',
  'reply-post': 'Write one concise, helpful social reply only.',
  'punchy-hook': 'Return one specific, punchy social hook only. Avoid generic hype.',
  'email-draft': 'Return one complete email with a concise Subject line and a clear body. Use placeholders rather than inventing names or facts.',
  'subject-lines': 'Return exactly five distinct email subject lines, one per line. No heading, numbering, or email body.',
  'follow-up-email': 'Return one follow-up email with a concise Subject line, context, clear request, and polite close.',
  'blog-snippet': 'Write one useful blog snippet only with a clear point and no generic introduction.',
  'seo-intro': 'Write one search-friendly blog introduction that answers intent early and uses keywords naturally.',
  outline: 'Return one practical blog outline only with a clear hierarchy and non-repetitive sections.',
  'meta-description': 'Return exactly one useful SEO meta description of about 150-160 characters. No label or quotation marks.',
  'hero-headline': 'Return one benefit-led website headline and one short supporting line only. Avoid vague claims.',
  'landing-copy': 'Write one concise landing-page section with a clear value proposition, supporting proof language, and CTA. Do not invent metrics.',
  'cta-lines': 'Return exactly five short, action-specific CTA options, one per line, with no heading or numbering.',
  'product-description': 'Write one product description focused on concrete benefits and supplied features. Do not invent specifications.',
  'threads-post': 'Write one conversational Threads post only. Keep it human, specific, and discussion-friendly.',
  'community-prompt': 'Return one clear community discussion prompt only.',
  'pin-title': 'Return exactly one keyword-aware Pinterest Pin title only.',
  'pin-description': 'Write exactly one concise Pinterest Pin description using keywords naturally.',
  'shopping-pin': 'Write one Pinterest shopping-pin text only using supplied product details. Do not invent price or availability.',
  'story-caption': 'Return one very short Snapchat Story caption only.',
  'spotlight-hook': 'Return one quick Snapchat Spotlight hook only.',
  'overlay-text': 'Return only short overlay text lines that are easy to read on a phone.',
  'broadcast-message': 'Write one clear WhatsApp broadcast message only with a direct purpose and next step.',
  'status-caption': 'Return one short WhatsApp Status caption only.',
  'customer-reply': 'Write one concise, helpful WhatsApp customer reply. Do not invent policies, order status, or promises.',
  'ad-promo-copy': 'Write one focused advertisement block with a concrete benefit, credible wording, and clear CTA.',
  'short-form': 'Write one concise short-form content piece only. Remove filler and lead with the useful point.'
};

const PLATFORM_INSTRUCTIONS = {
  instagram: 'Use a visual, human voice with a strong first line and mobile-friendly spacing. Avoid engagement bait and hashtag stuffing.',
  tiktok: 'Use fast, conversational language and reach the point immediately. Avoid forced slang, fake trends, and long introductions.',
  youtube: 'Prioritize clarity, search intent, and honest curiosity. Avoid misleading clickbait and claims not supported by the user input.',
  linkedin: 'Sound credible and specific. Prefer practical insight over motivational filler; never invent statistics, employers, or achievements.',
  facebook: 'Use a warm, community-friendly voice with clear context and an easy next step.',
  twitter: 'Keep one focused idea, concise wording, and natural readability. Avoid unnecessary hashtags.',
  x: 'Keep one focused idea, concise wording, and natural readability. Avoid unnecessary hashtags.',
  threads: 'Sound conversational and thoughtful, as if starting a useful real discussion.',
  pinterest: 'Use descriptive search terms naturally and focus on discovery value without keyword stuffing.',
  snapchat: 'Keep wording extremely brief, visual, and instantly understandable.',
  whatsapp: 'Be direct, personal, and easy to scan. Avoid promotional clutter.',
  email: 'Be clear, purposeful, and respectful. Make the requested action obvious without sounding robotic.',
  blog: 'Answer reader intent early, use concrete takeaways, and avoid padded introductions.',
  website: 'Use benefit-led, scannable copy with credible language and a clear action.',
  general: 'Write clear, useful content for the stated audience and purpose without filler.'
};

const TONE_INSTRUCTIONS = {
  professional: 'Use confident, clear language without sounding stiff or corporate.',
  friendly: 'Use warm, natural language without being overly casual.',
  creative: 'Use a fresh angle and memorable wording while keeping the message clear.',
  casual: 'Use relaxed, everyday language and natural sentence rhythm.',
  persuasive: 'Focus on relevant benefits and a clear action without pressure or exaggerated claims.',
  formal: 'Use polished, precise language and complete sentences without unnecessary complexity.'
};

const SINGLE_LINE_FORMATS = new Set([
  'shorts-title', 'long-video-title', 'meta-description', 'pin-title',
  'story-caption', 'spotlight-hook', 'punchy-hook', 'status-caption', 'pinned-comment'
]);

const getFormatInstruction = (platform, contentType) => {
  const normalizedType = Array.isArray(contentType) ? contentType.join(',').toLowerCase() : String(contentType || '').trim().toLowerCase();
  const selectedTypes = Array.isArray(contentType) ? contentType : String(contentType || '').split(',').map((item) => item.trim()).filter(Boolean);
  const hashtagSelected = selectedTypes.some((item) => /hashtag|tag|keyword/i.test(item));
  const normalizedPlatform = String(platform || 'general').trim().toLowerCase();

  return FORMAT_INSTRUCTIONS[normalizedType]
    || `Return one polished ${normalizedType || 'content'} result for ${normalizedPlatform} only.`;
};

const getPlatformInstruction = (platform) => {
  const normalizedPlatform = String(platform || 'general').trim().toLowerCase();
  return PLATFORM_INSTRUCTIONS[normalizedPlatform] || PLATFORM_INSTRUCTIONS.general;
};

function buildPreferenceContext(preferences) {
  if (!preferences) return '';

  const details = [];
  if (preferences.businessType) details.push(`Business: ${preferences.businessType}`);
  if (preferences.targetAudience) details.push(`Audience: ${preferences.targetAudience}`);
  if (preferences.writingStyle) details.push(`Preferred style: ${preferences.writingStyle}`);
  return details.length ? `User context: ${details.join('; ')}.` : '';
}

function buildTextGenerationPrompt({
  prompt,
  tone,
  platform,
  contentType,
  keywords,
  preferences,
  includeEmojis = true
}) {
  const normalizeList = (value) => Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : String(value || 'content').split(',').map((item) => item.trim()).filter(Boolean);
  const selectedTypes = normalizeList(contentType);
  const hasMultipleTypes = selectedTypes.length > 1;
  const typeLabels = selectedTypes.join(', ');
  const normalizedPlatform = String(platform || 'General').trim();
  const normalizedTone = String(tone || 'Professional').trim();
  const toneRule = TONE_INSTRUCTIONS[normalizedTone.toLowerCase()]
    || `Use a consistent ${normalizedTone} tone.`;
  const preferenceContext = buildPreferenceContext(preferences);
  const emojiRule = includeEmojis === false
    ? 'Do not use emojis anywhere in the result.'
    : 'Use at most 1-2 relevant emojis only when they improve the selected format; never force them.';
  const hashtagSelected = selectedTypes.some((item) => /hashtag|tag|keyword/i.test(item));
  const hashtagRule = hashtagSelected
    ? 'Include hashtags/tags/keywords only inside the selected hashtag/tag/keyword output section.'
    : 'Do not use hashtags, tag lists, keyword lists, or hashtag sections because the user did not select them.';
  const outputContract = hasMultipleTypes
    ? selectedTypes.map((item) => `- ${item}: ${getFormatInstruction(normalizedPlatform, item)}`).join('\n')
    : getFormatInstruction(normalizedPlatform, selectedTypes[0]);

  return [
    'ROLE',
    'You are SmartGen AI, a senior social media and content strategist.',
    '',
    'USER TOPIC (stay strictly focused on this)',
    `<topic>${String(prompt || '').trim()}</topic>`,
    keywords ? `<keywords>${String(keywords).trim()}</keywords>` : '',
    '',
    'STRUCTURED SELECTION',
    `Module: text`,
    `Platform: ${normalizedPlatform}`,
    `Format: ${typeLabels}`,
    `Selected output types only: ${typeLabels}`,
    `Tone: ${normalizedTone}`,
    preferenceContext,
    '',
    'PLATFORM RULE',
    getPlatformInstruction(normalizedPlatform),
    '',
    'OUTPUT CONTRACT',
    outputContract,
    '',
    'NON-NEGOTIABLE RULES',
    '- Generate only for the selected platform.',
    '- Generate only the selected output types. Do not add unselected captions, descriptions, hashtags, CTAs, bios, tags, intros, or extra sections.',
    `- ${toneRule}`,
    `- ${emojiRule}`,
    `- ${hashtagRule}`,
    '- Match the language used by the user unless they explicitly request another language.',
    '- Be specific, useful, natural, platform-native, and attractive.',
    '- Never invent facts, statistics, prices, dates, links, product features, testimonials, or guarantees.',
    '- You do not have live trend data. Never call something latest, viral, trending, or real-time unless the user supplied that fact.',
    '- If details are missing, use neutral placeholders or safe wording instead of guessing.',
    hasMultipleTypes ? '- Output exactly one clearly labeled section for each selected output type, in the same order.' : '- Return only the requested publish-ready result, with no heading unless the selected format requires one.',
    '',
    hasMultipleTypes ? 'Return only the selected sections and nothing else.' : 'Return only the publish-ready result.'
  ].filter(Boolean).join('\n');
}

function stripUnsupportedEmojis(value) {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '');
}

function stripHashtags(value) {
  return value.replace(/(^|\s)#[\p{L}\p{N}_-]+/gu, '$1');
}

function cleanGeneratedContent(value, { contentType, includeEmojis = true, includeHashtags } = {}) {
  const normalizedType = Array.isArray(contentType) ? contentType.join(',').toLowerCase() : String(contentType || '').trim().toLowerCase();
  const selectedTypes = Array.isArray(contentType) ? contentType : String(contentType || '').split(',').map((item) => item.trim()).filter(Boolean);
  const hashtagSelected = selectedTypes.some((item) => /hashtag|tag|keyword/i.test(item));
  let result = String(value || '')
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^(?:here(?:'s| is)|sure[,!]?|certainly[,!]?)\s+(?:your|the|a)?\s*(?:requested\s+)?(?:content|result|copy|caption|title)?\s*:?\s*/i, '')
    .trim();

  if (normalizedType === 'five-hashtags' || normalizedType === 'hashtag-set') {
    const limit = normalizedType === 'five-hashtags' ? 5 : 15;
    const hashtags = [...new Set(result.match(/#[\p{L}\p{N}_-]+/gu) || [])];
    if (hashtags.length) result = hashtags.slice(0, limit).join(' ');
  }

  if (SINGLE_LINE_FORMATS.has(normalizedType)) {
    result = result
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || '';
    result = result
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\*{1,2}/, '')
      .replace(/\*{1,2}$/, '')
      .replace(/^(?:youtube\s+)?(?:shorts?\s+|long[- ]video\s+)?(?:title|caption|meta description|pinned comment)\s*:\s*\*{0,2}\s*/i, '')
      .replace(/^['"]|['"]$/g, '')
      .trim();
  }

  if (normalizedType === 'shorts-title' || normalizedType === 'long-video-title') {
    result = result.slice(0, 100).trim();
  }

  if (includeEmojis === false) result = stripUnsupportedEmojis(result);
  const shouldKeepHashtags = hashtagSelected || includeHashtags === true;
  if (!shouldKeepHashtags) {
    result = stripHashtags(result);
  
  }
  return result
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function generateTextFromPrompt(options) {
  const systemPrompt = buildTextGenerationPrompt(options);
  const rawResult = await generateContentWithFallback(systemPrompt, 'Text content generation');
  return cleanGeneratedContent(rawResult, options);
}

async function generateImageContent({ imageBuffer, mimeType, prompt, tone, platform, contentType, preferences }) {
  const prefContext = preferences
    ? `User Profile: Business type: ${preferences.businessType || 'not specified'}, Target audience: ${preferences.targetAudience || 'general audience'}.`
    : '';

  const textPrompt = `You are an expert social media content creator and visual storyteller.

${prefContext}

Analyze this image carefully and generate engaging ${contentType || 'caption'} content for ${platform || 'social media'}.

${prompt ? `Additional context from user: ${prompt}` : ''}
Tone: ${tone || 'Professional'}
Platform: ${platform || 'Instagram'}
Content Type: ${contentType || 'caption'}

Requirements:
- Analyze the visual elements, colors, mood, and context in the image
- Write content that naturally describes or complements what you see
- Use a ${tone || 'Professional'} tone suited for ${platform || 'social media'}
- For captions: write engaging, relatable text with emojis
- For hashtags: provide 10-15 highly relevant and trending hashtags
- For product descriptions: highlight key visual features
- For social posts: make it shareable and engaging
- Return ONLY the requested content — no explanations

Generate the ${contentType || 'caption'} now:`;

  return generateContentWithFallback([
    {
      parts: [
        { text: textPrompt },
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType
          }
        }
      ]
    }
  ], 'Image content generation');
}

async function rewriteContent({ inputText, rewriteAction, tone, platform, preferences }) {
  const actionInstructions = {
    grammar: 'Fix all grammatical errors, spelling mistakes, and punctuation. Improve sentence clarity and flow while keeping the original meaning and length.',
    shorten: 'Condense this text significantly. Remove unnecessary words, redundancies, and filler. Keep only the essential message. Aim for 40-50% of the original length.',
    expand: 'Expand this text with additional relevant details, examples, context, and depth. Make it more comprehensive and informative. Aim for 150-200% of the original length.',
    formalize: 'Rewrite in a formal, professional tone. Use formal vocabulary, complete sentences, and professional language suitable for business communication.',
    casualize: 'Rewrite in a casual, conversational, and friendly tone. Use everyday language, contractions, and a relaxed style.',
    creative: 'Rewrite in a creative, imaginative, and engaging style. Use vivid language, metaphors, and a unique voice.',
    simplify: 'Rewrite using simple, clear language that anyone can understand. Avoid jargon and complex sentences.'
  };

  const instruction = actionInstructions[rewriteAction] || actionInstructions.grammar;

  const prefContext = preferences
    ? `User context: Business type: ${preferences.businessType || 'general'}, Target audience: ${preferences.targetAudience || 'general audience'}.`
    : '';

  const systemPrompt = `You are an expert editor and writing specialist.

${prefContext}

Original text:
"""
${inputText}
"""

Rewrite instruction: ${instruction}
${tone ? `Target tone: ${tone}` : ''}
${platform ? `Platform context: ${platform}` : ''}

IMPORTANT: Return ONLY the rewritten text. Do not include any introduction, explanation, labels like "Rewritten version:", or meta-commentary. Just the rewritten content itself.`;

  return generateContentWithFallback(systemPrompt, 'Content rewriting');
}

module.exports = {
  generateTextFromPrompt,
  generateImageContent,
  rewriteContent,
  handleGeminiError,
  generateContentWithFallback,
  DEFAULT_MODELS,
  getFormatInstruction,
  getPlatformInstruction,
  buildTextGenerationPrompt,
  cleanGeneratedContent
};












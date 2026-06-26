const {
  getFormatInstruction,
  getPlatformInstruction,
  buildTextGenerationPrompt,
  cleanGeneratedContent
} = require('../services/geminiService');

describe('Platform-specific content format contracts', () => {
  test('YouTube long-video title requests one useful title only', () => {
    const instruction = getFormatInstruction('youtube', 'long-video-title');
    expect(instruction).toContain('exactly one');
    expect(instruction).toContain('under 100 characters');
    expect(instruction).toContain('No label');
  });

  test('YouTube description prevents invented links and timestamps', () => {
    const instruction = getFormatInstruction('youtube', 'youtube-description');
    expect(instruction).toContain('YouTube description only');
    expect(instruction).toContain('Do not invent links or timestamps');
  });

  test('TikTok hashtag format returns exactly five hashtags', () => {
    expect(getFormatInstruction('tiktok', 'five-hashtags'))
      .toContain('exactly five');
  });

  test('unknown formats stay on the selected platform', () => {
    expect(getFormatInstruction('custom-platform', 'custom-format'))
      .toContain('custom-platform only');
  });

  test('platform rules prevent fake trends and unsupported claims', () => {
    expect(getPlatformInstruction('tiktok')).toContain('fake trends');
    expect(getPlatformInstruction('linkedin')).toContain('never invent statistics');
  });
});

describe('SmartGen prompt construction', () => {
  test('builds a strict platform, format, and tone contract', () => {
    const prompt = buildTextGenerationPrompt({
      prompt: 'corona virus and technology',
      keywords: 'remote work, health tech',
      platform: 'YouTube',
      contentType: 'long-video-title',
      tone: 'Professional',
      includeEmojis: false,
      includeHashtags: false
    });

    expect(prompt).toContain('<topic>corona virus and technology</topic>');
    expect(prompt).toContain('Platform: YouTube');
    expect(prompt).toContain('Format: long-video-title');
    expect(prompt).toContain('Return exactly one polished YouTube long-video title');
    expect(prompt).toContain('Do not use emojis');
    expect(prompt).toContain('Do not use hashtags');
    expect(prompt).toContain('You do not have live trend data');
    expect(prompt).toContain('Never invent facts, statistics, prices, dates');
  });

  test('uses only real saved preference values', () => {
    const prompt = buildTextGenerationPrompt({
      prompt: 'launch update',
      platform: 'LinkedIn',
      contentType: 'professional-post',
      preferences: { businessType: 'Education', targetAudience: 'Students' }
    });

    expect(prompt).toContain('Business: Education');
    expect(prompt).toContain('Audience: Students');
    expect(prompt).not.toContain('not specified');
  });
});

describe('Generated output cleanup', () => {
  test('keeps only one clean YouTube title', () => {
    const result = cleanGeneratedContent(
      '**YouTube Title:** Beyond the Lockdown: How Technology Changed Daily Life\nAlternative: Another title',
      { contentType: 'long-video-title' }
    );

    expect(result).toBe('Beyond the Lockdown: How Technology Changed Daily Life');
  });

  test('enforces emoji and hashtag choices', () => {
    const result = cleanGeneratedContent(
      'A useful launch update \u{1F680} #Launch #SmartGen',
      { contentType: 'post-caption', includeEmojis: false, includeHashtags: false }
    );

    expect(result).toBe('A useful launch update');
  });

  test('limits TikTok hashtag output to five unique tags', () => {
    const result = cleanGeneratedContent(
      'Tags: #AI #Content #Students #Tools #Productivity #Extra #AI',
      { contentType: 'five-hashtags' }
    );

    expect(result).toBe('#AI #Content #Students #Tools #Productivity');
  });
});


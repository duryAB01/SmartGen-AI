const Preference = require('../models/Preference');
const logAnalytics = require('../utils/logAnalytics');

// ─── GET /api/preferences ──────────────────────────────────────────────────────
exports.getPreferences = async (req, res) => {
  try {
    let preferences = await Preference.findOne({ userId: req.user.id });

    // If no preferences saved yet, return defaults
    if (!preferences) {
      return res.status(200).json({
        success: true,
        preferences: {
          preferredTone: 'Professional',
          preferredPlatform: 'LinkedIn',
          businessType: '',
          targetAudience: '',
          writingStyle: '',
          preferredVoiceTone: 'Friendly',
          preferredVoiceSpeed: 1,
          preferredVoiceQuality: 'high',
          preferredVoiceVariation: 'natural',
          preferredVoiceRemoveSilence: true,
          preferredVoiceNaturalize: true
        }
      });
    }

    return res.status(200).json({ success: true, preferences });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch preferences.' });
  }
};

// ─── PUT /api/preferences ──────────────────────────────────────────────────────
exports.updatePreferences = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      preferredTone,
      preferredPlatform,
      businessType,
      targetAudience,
      writingStyle,
      preferredVoiceTone,
      preferredVoiceSpeed,
      preferredVoiceQuality,
      preferredVoiceVariation,
      preferredVoiceRemoveSilence,
      preferredVoiceNaturalize
    } = req.body;

    // Upsert: create if not exists, update if exists
    const preferences = await Preference.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          preferredTone: preferredTone || 'Professional',
          preferredPlatform: preferredPlatform || 'LinkedIn',
          businessType: businessType || '',
          targetAudience: targetAudience || '',
          writingStyle: writingStyle || '',
          preferredVoiceTone: preferredVoiceTone || 'Friendly',
          preferredVoiceSpeed: Number.isFinite(Number(preferredVoiceSpeed))
            ? Math.min(1.2, Math.max(0.8, Number(preferredVoiceSpeed)))
            : 1,
          preferredVoiceQuality: preferredVoiceQuality || 'high',
          preferredVoiceVariation: preferredVoiceVariation || 'natural',
          preferredVoiceRemoveSilence: preferredVoiceRemoveSilence !== false,
          preferredVoiceNaturalize: preferredVoiceNaturalize !== false,
          updatedAt: new Date()
        }
      },
      {
        new: true,       // Return the updated document
        upsert: true,    // Create if not exists
        runValidators: true
      }
    );

    await logAnalytics({ userId: req.user.id, moduleName: 'preferences', action: 'update-preferences', startTime, status: 'success' });

    return res.status(200).json({
      success: true,
      message: 'Preferences saved successfully!',
      preferences
    });
  } catch (error) {
    await logAnalytics({ userId: req.user.id, moduleName: 'preferences', action: 'update-preferences', startTime, status: 'failure', errorMessage: error.message });
    return res.status(500).json({ success: false, message: 'Failed to save preferences.' });
  }
};


const mongoose = require('mongoose');

const PreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true // One preference record per user
  },
  preferredTone: {
    type: String,
    default: 'Professional',
    trim: true
  },
  preferredPlatform: {
    type: String,
    default: 'LinkedIn',
    trim: true
  },
  businessType: {
    type: String,
    default: '',
    trim: true
  },
  targetAudience: {
    type: String,
    default: '',
    trim: true
  },
  writingStyle: {
    type: String,
    default: '',
    trim: true
  },
  preferredVoiceTone: {
    type: String,
    enum: ['Calm', 'Friendly', 'Energetic', 'Serious'],
    default: 'Friendly'
  },
  preferredVoiceSpeed: {
    type: Number,
    min: 0.8,
    max: 1.2,
    default: 1
  },
  preferredVoiceQuality: {
    type: String,
    enum: ['standard', 'high'],
    default: 'high'
  },
  preferredVoiceVariation: {
    type: String,
    enum: ['stable', 'natural'],
    default: 'natural'
  },
  preferredVoiceRemoveSilence: {
    type: Boolean,
    default: true
  },
  preferredVoiceNaturalize: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before every save/update
PreferenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Preference', PreferenceSchema);


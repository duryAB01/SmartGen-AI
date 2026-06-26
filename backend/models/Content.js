const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'rewrite', 'voice'],
    required: [true, 'Content type is required']
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required'],
    trim: true
  },
  inputText: {
    type: String,
    trim: true,
    default: null
  },
  result: {
    type: String,
    required: [true, 'Result is required']
  },
  tone: {
    type: String,
    trim: true,
    default: null
  },
  platform: {
    type: String,
    trim: true,
    default: null
  },
  contentType: {
    type: String,
    trim: true,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ContentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for fast user history queries
ContentSchema.index({ userId: 1 });
ContentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Content', ContentSchema);


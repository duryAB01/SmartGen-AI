const mongoose = require('mongoose');

const ImageRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  imageName: {
    type: String,
    required: [true, 'Image name is required'],
    trim: true
  },
  imageFormat: {
    type: String,
    required: [true, 'Image format is required'],
    trim: true
  },
  imageSize: {
    type: Number, // bytes
    default: 0
  },
  optionalPrompt: {
    type: String,
    default: '',
    trim: true
  },
  generatedOutput: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast user queries
ImageRequestSchema.index({ userId: 1 });
ImageRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImageRequest', ImageRequestSchema);

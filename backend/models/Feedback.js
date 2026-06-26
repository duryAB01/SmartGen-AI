const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  type: {
    type: String,
    enum: ['rate', 'report'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  category: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index on userId and type
FeedbackSchema.index({ userId: 1 });
FeedbackSchema.index({ type: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);

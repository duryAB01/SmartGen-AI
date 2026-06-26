const mongoose = require('mongoose');

const AnalyticsLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Optional — some actions may be unauthenticated
  },
  moduleName: {
    type: String,
    enum: ['auth', 'text', 'image', 'rewrite', 'preferences', 'history', 'admin'],
    required: [true, 'Module name is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true
  },
  requestTimestamp: {
    type: Date,
    default: Date.now
  },
  responseTime: {
    type: Number, // milliseconds
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: [true, 'Status is required']
  },
  errorMessage: {
    type: String,
    default: null
  }
});

// Indexes for fast admin stats queries
AnalyticsLogSchema.index({ moduleName: 1 });
AnalyticsLogSchema.index({ requestTimestamp: -1 });
AnalyticsLogSchema.index({ userId: 1 });
AnalyticsLogSchema.index({ status: 1 });

module.exports = mongoose.model('AnalyticsLog', AnalyticsLogSchema);

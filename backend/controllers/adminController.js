const User = require('../models/User');
const Content = require('../models/Content');
const AnalyticsLog = require('../models/AnalyticsLog');
const logAnalytics = require('../utils/logAnalytics');

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  const startTime = Date.now();
  try {
    // Run all count queries in parallel for performance
    const [
      totalUsers,
      totalContent,
      textCount,
      imageCount,
      rewriteCount,
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTimeResult,
      recentLogs,
      recentContent
    ] = await Promise.all([
      User.countDocuments(),
      Content.countDocuments(),
      Content.countDocuments({ type: 'text' }),
      Content.countDocuments({ type: 'image' }),
      Content.countDocuments({ type: 'rewrite' }),
      AnalyticsLog.countDocuments(),
      AnalyticsLog.countDocuments({ status: 'success' }),
      AnalyticsLog.countDocuments({ status: 'failure' }),

      // Average response time aggregation
      AnalyticsLog.aggregate([
        { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
      ]),

      // Recent 10 analytics logs (safe fields only — no passwords)
      AnalyticsLog.find()
        .sort({ requestTimestamp: -1 })
        .limit(10)
        .populate('userId', 'name email role') // safe fields only
        .lean(),

      // Recent 5 content items (safe fields only)
      Content.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean()
    ]);

    const averageResponseTime = avgResponseTimeResult.length > 0
      ? Math.round(avgResponseTimeResult[0].avgTime)
      : 0;

    await logAnalytics({ userId: req.user.id, moduleName: 'admin', action: 'fetch-stats', startTime, status: 'success' });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalContent,
        textCount,
        imageCount,
        rewriteCount,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        recentLogs,
        recentContent
      }
    });
  } catch (error) {
    await logAnalytics({ userId: req.user.id, moduleName: 'admin', action: 'fetch-stats', startTime, status: 'failure', errorMessage: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch admin statistics.' });
  }
};

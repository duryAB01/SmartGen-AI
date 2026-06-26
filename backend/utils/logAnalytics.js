const AnalyticsLog = require('../models/AnalyticsLog');

/**
 * Log an analytics event to the database.
 * Fails silently — never throws, so it never breaks the main request flow.
 *
 * @param {Object} params
 * @param {string} params.userId     - User ID (optional)
 * @param {string} params.moduleName - 'auth' | 'text' | 'image' | 'rewrite' | 'preferences' | 'history' | 'admin'
 * @param {string} params.action     - Short action description e.g. 'generate-text'
 * @param {number} params.startTime  - Date.now() captured before the operation
 * @param {string} params.status     - 'success' | 'failure'
 * @param {string} [params.errorMessage] - Error message if status is failure
 */
async function logAnalytics({ userId, moduleName, action, startTime, status, errorMessage }) {
  try {
    const responseTime = startTime ? Date.now() - startTime : 0;

    await AnalyticsLog.create({
      userId: userId || null,
      moduleName,
      action,
      responseTime,
      status,
      errorMessage: errorMessage || null,
      requestTimestamp: new Date()
    });
  } catch (err) {
    // Fail silently — analytics logging should never crash the main API
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] Failed to log analytics event:', err.message);
    }
  }
}

module.exports = logAnalytics;

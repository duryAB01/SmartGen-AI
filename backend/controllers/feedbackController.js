const Feedback = require('../models/Feedback');
const logAnalytics = require('../utils/logAnalytics');

// ─── POST /api/feedback (optional/required auth) ──────────────────────────────
exports.submitFeedback = async (req, res) => {
  const startTime = Date.now();
  try {
    const { type, rating, category, comment } = req.body;

    if (!type || !['rate', 'report'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback type.' });
    }

    if (type === 'rate' && (!rating || rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Valid rating (1-5) is required.' });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    if (type === 'report' && (!comment || !comment.trim())) {
      return res.status(400).json({ success: false, message: 'Description of the issue is required.' });
    }

    const feedbackData = {
      type,
      category: category.trim(),
      comment: comment ? comment.trim() : ''
    };

    if (type === 'rate') {
      feedbackData.rating = rating;
    }

    // If request contains authenticated user
    if (req.user && req.user.id) {
      feedbackData.userId = req.user.id;
    }

    const feedback = await Feedback.create(feedbackData);

    await logAnalytics({
      userId: req.user?.id || null,
      moduleName: 'feedback',
      action: type === 'rate' ? 'submit_rating' : 'submit_report',
      startTime,
      status: 'success'
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully!',
      data: feedback
    });
  } catch (error) {
    await logAnalytics({
      userId: req.user?.id || null,
      moduleName: 'feedback',
      action: 'submit',
      startTime,
      status: 'failure',
      errorMessage: error.message
    });
    console.error('Feedback submission error:', error);
    return res.status(500).json({ success: false, message: 'Could not submit feedback.' });
  }
};

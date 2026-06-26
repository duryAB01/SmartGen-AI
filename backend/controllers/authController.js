const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Content = require('../models/Content');
const AnalyticsLog = require('../models/AnalyticsLog');
const logAnalytics = require('../utils/logAnalytics');

/**
 * Generate a JWT for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Return a safe user object â€” never expose password
 */
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

// â”€â”€â”€ POST /api/auth/signup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.signup = async (req, res) => {
  const startTime = Date.now();
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user (password is hashed by the model's pre-save hook)
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    const token = generateToken(user);

    await logAnalytics({ userId: user._id, moduleName: 'auth', action: 'signup', startTime, status: 'success' });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: safeUser(user)
    });
  } catch (error) {
    await logAnalytics({ moduleName: 'auth', action: 'signup', startTime, status: 'failure', errorMessage: error.message });
    return res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
};

// â”€â”€â”€ POST /api/auth/login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.login = async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Fetch user including password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    await logAnalytics({ userId: user._id, moduleName: 'auth', action: 'login', startTime, status: 'success' });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser(user)
    });
  } catch (error) {
    await logAnalytics({ moduleName: 'auth', action: 'login', startTime, status: 'failure', errorMessage: error.message });
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// â”€â”€â”€ GET /api/auth/me â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({
      success: true,
      user: safeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not fetch user data.' });
  }
};

// â”€â”€â”€ PUT /api/auth/profile (protected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.updateProfile = async (req, res) => {
  const startTime = Date.now();
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.name = name.trim();
    user.email = email.toLowerCase().trim();
    await user.save();

    await logAnalytics({ userId: user._id, moduleName: 'auth', action: 'updateProfile', startTime, status: 'success' });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: safeUser(user)
    });
  } catch (error) {
    await logAnalytics({ userId: req.user?.id, moduleName: 'auth', action: 'updateProfile', startTime, status: 'failure', errorMessage: error.message });
    return res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

// â”€â”€â”€ PUT /api/auth/password (protected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.changePassword = async (req, res) => {
  const startTime = Date.now();
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    // Need to explicitly select password since it is excluded by default
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    await logAnalytics({ userId: user._id, moduleName: 'auth', action: 'changePassword', startTime, status: 'success' });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (error) {
    await logAnalytics({ userId: req.user?.id, moduleName: 'auth', action: 'changePassword', startTime, status: 'failure', errorMessage: error.message });
    return res.status(500).json({ success: false, message: 'Could not update password.' });
  }
};

// â”€â”€â”€ GET /api/auth/stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const dailyLimit = 50;

    const [
      savedTotal,
      textSaved,
      imageSaved,
      rewriteSaved,
      voiceSaved,
      generationsThisMonth,
      generationsToday
    ] = await Promise.all([
      Content.countDocuments({ userId }),
      Content.countDocuments({ userId, type: 'text' }),
      Content.countDocuments({ userId, type: 'image' }),
      Content.countDocuments({ userId, type: 'rewrite' }),
      Content.countDocuments({ userId, type: 'voice' }),
      AnalyticsLog.countDocuments({
        userId,
        status: 'success',
        moduleName: { $in: ['text', 'image', 'rewrite', 'voice'] },
        requestTimestamp: { $gte: startOfMonth }
      }),
      AnalyticsLog.countDocuments({
        userId,
        status: 'success',
        moduleName: { $in: ['text', 'image', 'rewrite', 'voice'] },
        requestTimestamp: { $gte: startOfToday }
      })
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        savedTotal,
        textSaved,
        imageSaved,
        rewriteSaved,
        voiceSaved,
        generationsThisMonth,
        generationsToday,
        dailyLimit,
        remainingToday: Math.max(0, dailyLimit - generationsToday),
        plan: 'starter'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load workspace stats.' });
  }
};

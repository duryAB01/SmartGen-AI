/**
 * Admin Middleware
 * Must be used AFTER authMiddleware.
 * Checks that req.user.role === 'admin'.
 * Returns 403 Forbidden for regular users.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = adminMiddleware;

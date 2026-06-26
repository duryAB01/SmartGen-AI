/**
 * Rate Limiting Middleware for Guest Users
 * Limits requests based on IP address to prevent abuse
 */

const rateLimit = require('express-rate-limit');

// Guest text generation limit: 3 requests per hour per IP
const guestTextLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Guest limit reached. Create a free account to continue generating unlimited content.',
    limitReached: true
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

// Guest image generation limit: 2 requests per hour per IP
const guestImageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2,
  message: {
    success: false,
    message: 'Guest image generation limit reached. Create a free account to continue.',
    limitReached: true
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

module.exports = {
  guestTextLimiter,
  guestImageLimiter
};

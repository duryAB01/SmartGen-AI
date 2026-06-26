/**
 * Global Error Handler Middleware
 * Handles all errors in a centralized manner
 */

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error only in development to avoid console noise in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('[errorHandler]', err.message);
  }

  // Gemini API quota / rate-limit errors (detect from service layer or raw SDK)
  const errMsg = (err.message || '').toLowerCase();
  const isQuota =
    err.statusCode === 429 ||
    err.status === 429 ||
    errMsg.includes('429') ||
    errMsg.includes('quota') ||
    errMsg.includes('rate limit') ||
    errMsg.includes('resource_exhausted') ||
    errMsg.includes('resource exhausted') ||
    errMsg.includes('too many requests');

  if (isQuota) {
    return res.status(429).json({
      success: false,
      message: 'Gemini API quota exceeded. Please wait 60 seconds for quota reset or use another valid API key.'
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't expose stack trace in production
  const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack;

  res.status(statusCode).json({
    success: false,
    message,
    ...(stack && { stack })
  });
};

module.exports = { errorHandler };

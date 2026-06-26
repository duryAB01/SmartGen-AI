/**
 * Logger Utility
 * Provides structured logging for the application
 */

const logLevel = process.env.LOG_LEVEL || 'info';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const colors = {
  error: '\x1b[31m', // red
  warn: '\x1b[33m',  // yellow
  info: '\x1b[36m',  // cyan
  debug: '\x1b[37m', // white
  reset: '\x1b[0m'   // reset
};

const logger = {
  error: (message, meta = {}) => {
    if (levels.error <= levels[logLevel]) {
      console.error(`${colors.error}[ERROR]${colors.reset} ${new Date().toISOString()} - ${message}`, meta);
    }
  },
  
  warn: (message, meta = {}) => {
    if (levels.warn <= levels[logLevel]) {
      console.warn(`${colors.warn}[WARN]${colors.reset} ${new Date().toISOString()} - ${message}`, meta);
    }
  },
  
  info: (message, meta = {}) => {
    if (levels.info <= levels[logLevel]) {
      console.log(`${colors.info}[INFO]${colors.reset} ${new Date().toISOString()} - ${message}`, meta);
    }
  },
  
  debug: (message, meta = {}) => {
    if (levels.debug <= levels[logLevel]) {
      console.log(`${colors.debug}[DEBUG]${colors.reset} ${new Date().toISOString()} - ${message}`, meta);
    }
  }
};

module.exports = logger;

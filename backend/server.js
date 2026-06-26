const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const geminiAI = require('./config/gemini');

const app = express();

const DEFAULT_MODEL_CHAIN = 'gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash';

const parseAllowedOrigins = () => (
  (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

// Connect to MongoDB
connectDB();

// ── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — allow configured frontend URL(s)
app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = parseAllowedOrigins();
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Sanitize MongoDB query injection attacks
app.use(mongoSanitize());

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ── General Middleware ─────────────────────────────────────────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'SmartGen AI Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    aiModel: (process.env.GEMINI_MODEL || DEFAULT_MODEL_CHAIN).split(',')[0].trim()
  });
});

app.get('/health/ai', async (req, res) => {
  const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL_CHAIN).split(',')[0].trim();
  try {
    const connected = await geminiAI.testConnection();
    return res.status(connected ? 200 : 503).json({
      success: connected,
      status: connected ? 'OK' : 'UNAVAILABLE',
      message: connected ? 'Gemini AI is reachable' : 'Gemini AI is unavailable',
      model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'UNAVAILABLE',
      message: error.message || 'Gemini AI health check failed',
      model,
      timestamp: new Date().toISOString()
    });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/voice', voiceRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SmartGen AI Backend API',
    version: '1.0.0',
    health: '/health'
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 SmartGen AI Backend running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend allowed: ${parseAllowedOrigins().join(', ')}`);

  const getMaskedKey = (key) => {
    if (!key) return 'Not configured';
    const clean = key.trim().replace(/^["']|["']$/g, '');
    if (clean.length <= 10) return '...';
    return clean.substring(0, 6) + '...' + clean.substring(clean.length - 4);
  };
  console.log(`🔑 GEMINI_API_KEY loaded: ${getMaskedKey(process.env.GEMINI_API_KEY)}`);
  console.log(`🤖 GEMINI_MODEL configured: ${(process.env.GEMINI_MODEL || DEFAULT_MODEL_CHAIN).split(',')[0].trim()}`);

  console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;

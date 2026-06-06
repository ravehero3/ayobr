const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { setupAuth } = require('./auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const lemonsqueezyRoutes = require('./routes/lemonsqueezy');
const gopayRoutes = require('./routes/gopay');
const { pool } = require('./db');
const fs = require('fs');
const { resetMonthlyCredits } = require('./storage');

function buildApp() {
  const app = express();

  // Keep-alive ping endpoint — no auth, no rate limiting, no COEP headers
  // External uptime monitors should hit GET /ping every 10 minutes
  app.get('/ping', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send('pong');
  });

  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5001',
    process.env.FRONTEND_URL,
    ...(process.env.REPLIT_DOMAINS
      ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d.trim()}`)
      : []),
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
      cb(null, true);
    },
    credentials: true
  }));

  // Gzip/brotli — skip WASM (large binary; compression adds CPU and can confuse clients)
  app.use(compression({
    filter: (req, res) => {
      if (res.getHeader('Content-Type') === 'application/wasm') return false;
      if (req.path && req.path.endsWith('.wasm')) return false;
      return compression.filter(req, res);
    },
  }));

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
  });
  const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many payment requests, please try again later.' },
  });
  app.use('/api/', apiLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/callback', authLimiter);
  app.use('/api/ls/create-checkout', paymentLimiter);
  app.use('/api/gopay/create-payment', paymentLimiter);

  // Required for FFmpeg WebAssembly SharedArrayBuffer support
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
  });

  app.use('/api/ls/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));

  return app;
}

const LANDING_CONTENT_FILE = path.join(__dirname, 'data/landing-content.json');

function buildLandingImagesRoute(app) {
  const LANDING_DIR = path.join(__dirname, 'uploads/landing');
  // Serve uploaded images
  app.use('/uploads/landing', express.static(LANDING_DIR));
  // Public API: which slots have custom images
  app.get('/api/landing-images', (req, res) => {
    const result = {};
    if (fs.existsSync(LANDING_DIR)) {
      const files = fs.readdirSync(LANDING_DIR);
      for (let slot = 1; slot <= 4; slot++) {
        const file = files.find(f => f.startsWith(`slot-${slot}.`));
        if (file) result[`slot${slot}`] = `/uploads/landing/${file}`;
      }
    }
    res.json(result);
  });
  // Public API: custom how-it-works step text
  app.get('/api/landing-content', (req, res) => {
    try {
      if (fs.existsSync(LANDING_CONTENT_FILE)) {
        return res.json(JSON.parse(fs.readFileSync(LANDING_CONTENT_FILE, 'utf8')));
      }
    } catch (e) {}
    res.json({ steps: [{}, {}, {}, {}] });
  });
}

async function initDb(app) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  let retries = 5;
  while (retries > 0) {
    try {
      await pool.query(schema);
      console.log('Database schema initialized');
      return;
    } catch (err) {
      console.warn(`Database connection failed (${retries} retries left):`, err.message);
      retries -= 1;
      if (retries === 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

async function mountRoutes(app) {
  await setupAuth(app);
  buildLandingImagesRoute(app);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ls', lemonsqueezyRoutes);
  app.use('/api/gopay', gopayRoutes);
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Public animation settings — read by all users to get admin-configured defaults
  app.get('/api/animation-settings', (req, res) => {
    const filePath = path.join(__dirname, 'data/animation-settings.json');
    try {
      if (fs.existsSync(filePath)) {
        return res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
      }
    } catch (e) {}
    res.json({});
  });

  app.get('/api/ffmpeg-ready', (req, res) => {
    const wasmPath = path.join(__dirname, '../dist/ffmpeg-core.wasm');
    const jsPath = path.join(__dirname, '../dist/ffmpeg-core.js');
    const wasmExists = fs.existsSync(wasmPath);
    const jsExists = fs.existsSync(jsPath);
    res.json({
      ok: wasmExists && jsExists,
      wasmBytes: wasmExists ? fs.statSync(wasmPath).size : 0,
      jsExists,
      wasmExists,
    });
  });

  // Public directory (og-image.png, favicon, etc.) — served before dist so it survives rebuilds
  app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1d' }));

  // Static assets: hashed filenames → cache 1 year; index.html → no cache
  app.use(express.static(path.join(__dirname, '../dist'), {
    maxAge: '1y',
    etag: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      if (filePath.endsWith('ffmpeg-core.js') || filePath.endsWith('.js')) {
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      }
    },
  }));

  // Wildcard fallback to serve index.html for SPA routing (React Router)
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

let _initPromise = null;
let _app = null;

async function getApp() {
  if (_app) return _app;
  if (!_initPromise) {
    _initPromise = (async () => {
      const app = buildApp();
      await initDb(app);
      await mountRoutes(app);
      _app = app;
      return app;
    })();
  }
  return _initPromise;
}

module.exports = { getApp, buildApp, initDb, mountRoutes, resetMonthlyCredits };

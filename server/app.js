const express = require('express');
const cors = require('cors');
const path = require('path');
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
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ls', lemonsqueezyRoutes);
  app.use('/api/gopay', gopayRoutes);
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Serve static files from the built dist directory
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Wildcard fallback to serve index.html for SPA routing (React Router)
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
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

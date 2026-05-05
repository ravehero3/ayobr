require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { setupAuth } = require('./auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const paddleRoutes = require('./routes/paddle');
const { pool } = require('./db');
const fs = require('fs');
const { resetMonthlyCredits } = require('./storage');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Paddle webhook needs raw body — mount BEFORE json middleware
app.use('/api/paddle/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

const allowedOrigins = [
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d.trim()}`) : []),
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(null, true);
  },
  credentials: true
}));

async function initDb() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized');
  } catch (err) {
    console.error('DB schema init error:', err.message);
  }
}

// Runs at midnight on the 1st of every month — reliable with node-cron
function startCreditResetScheduler() {
  cron.schedule('0 0 1 * *', async () => {
    try {
      const count = await resetMonthlyCredits();
      console.log(`Monthly credit reset: ${count} free users reset to 5 credits`);
    } catch (err) {
      console.error('Credit reset error:', err);
    }
  }, { timezone: 'UTC' });
  console.log('Monthly credit reset scheduled (runs 00:00 UTC on the 1st)');
}

async function start() {
  await initDb();
  await setupAuth(app);

  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/paddle', paddleRoutes);

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  startCreditResetScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TypeBeatz API server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

const { getApp, resetMonthlyCredits } = require('./app');
const cron = require('node-cron');

const PORT = process.env.API_PORT || 3001;

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

const REQUIRED_ENV = ['DATABASE_URL', 'SESSION_SECRET'];

function validateEnv() {
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\n[CRITICAL] Missing required environment variables: ${missing.join(', ')}`);
    console.error('The server cannot start without these. Check your Vercel/Replit environment settings.\n');
    process.exit(1);
  }
}

async function start() {
  validateEnv();
  const app = await getApp();
  
  // Basic health check for deployment monitors
  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  startCreditResetScheduler();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TypeBeatz API server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

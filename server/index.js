const { getApp, resetMonthlyCredits } = require('./app');
const cron = require('node-cron');

const PORT = process.env.PORT || process.env.API_PORT || 5000;

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
    console.error('The server cannot start without these. Check your Replit environment settings.\n');
    process.exit(1);
  }

  if (!process.env.REPL_ID) {
    console.warn('[auth] REPL_ID not set — Replit Auth will not work');
  }

  const lsKeys = [
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID',
    'LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID',
    'LEMONSQUEEZY_UNLIMITED_MONTHLY_VARIANT_ID',
    'LEMONSQUEEZY_UNLIMITED_YEARLY_VARIANT_ID',
  ];
  const lsMissing = lsKeys.filter(key => !process.env[key]);
  if (lsMissing.length > 0) {
    console.warn(`[payments] Lemon Squeezy incomplete — checkout/webhooks may fail: ${lsMissing.join(', ')}`);
  }
  if (!process.env.FRONTEND_URL && !process.env.REPLIT_DEV_DOMAIN && !process.env.REPLIT_DOMAINS) {
    console.warn('[payments] FRONTEND_URL not set — post-checkout redirect may use localhost');
  }
}

async function start() {
  validateEnv();
  const app = await getApp();

  startCreditResetScheduler();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TypeBeatz API server running on port ${PORT}`);
    const { validateAllVariants } = require('./routes/lemonsqueezy');
    validateAllVariants()
      .then((report) => {
        if (!report.ready) {
          console.warn('[payments] Lemon Squeezy variant validation failed:');
          (report.variants || []).forEach((v) => {
            if (!v.valid) console.warn(`  - ${v.envKey}: ${v.error || 'invalid'} (value: ${v.variantId || 'unset'})`);
          });
        } else {
          console.log('[payments] Lemon Squeezy variant IDs validated OK');
        }
      })
      .catch((err) => console.warn('[payments] Lemon Squeezy validation error:', err.message));
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

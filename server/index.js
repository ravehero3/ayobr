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

async function start() {
  const app = await getApp();
  startCreditResetScheduler();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TypeBeatz API server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

/**
 * server/jobs/gopayRenewal.js
 *
 * Daily cron job that finds GoPay subscriptions past their period end and attempts
 * to charge the user again using GoPay's ON_DEMAND recurrence API.
 *
 * GoPay recurrence flow:
 *  - First payment: created with recurrence.recurrence_cycle = "ON_DEMAND"
 *    The payment ID of that first (parent) payment is stored as recurrence_payment_id.
 *  - Subsequent charges: POST /payments/payment/{parentId}/create-recurrence
 *    This creates a new child payment charged to the same card, no user action needed.
 */

const {
  getExpiredActiveSubscriptions,
  renewSubscription,
  downgradeExpiredSubscription,
} = require('../storage');

const GOPAY_GOID = process.env.GOPAY_GOID || '8229864229';
const GOPAY_CLIENT_ID = process.env.GOPAY_CLIENT_ID || '1482939626';
const GOPAY_CLIENT_SECRET = process.env.GOPAY_CLIENT_SECRET || 'rW7hHn92';
const GOPAY_IS_PRODUCTION = process.env.GOPAY_IS_PRODUCTION === 'true';

const GOPAY_BASE_URL = GOPAY_IS_PRODUCTION
  ? 'https://gate.gopay.cz/api'
  : 'https://gw.sandbox.gopay.com/api';

/**
 * Retrieve a fresh GoPay OAuth2 token.
 */
async function getGoPayToken() {
  const credentialsBase64 = Buffer.from(`${GOPAY_CLIENT_ID}:${GOPAY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${GOPAY_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentialsBase64}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials&scope=payment-all',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GoPay token auth failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Charge a user's saved card via GoPay ON_DEMAND recurrence.
 * @param {string} parentPaymentId - The ID of the original (parent) payment that established the recurrence token.
 * @param {number} amountHellers - Amount in hellers (1 CZK = 100 hellers).
 * @param {string} orderNumber - Unique order reference for this renewal charge.
 * @param {string} orderDescription - Human-readable description.
 * @returns {object} The new child payment object from GoPay.
 */
async function chargeRecurrence(parentPaymentId, amountHellers, orderNumber, orderDescription) {
  const token = await getGoPayToken();

  const payload = {
    amount: amountHellers,
    currency: 'CZK',
    order_number: orderNumber,
    order_description: orderDescription,
    items: [
      {
        name: orderDescription,
        amount: amountHellers,
        count: 1,
      },
    ],
  };

  const response = await fetch(`${GOPAY_BASE_URL}/payments/payment/${parentPaymentId}/create-recurrence`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GoPay recurrence charge failed for parent ${parentPaymentId}: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Determine the CZK amount (in hellers) and label for a plan renewal.
 */
function getPlanAmount(plan, isAnnual) {
  if (plan === 'unlimited') {
    return isAnnual
      ? { amountHellers: 418800, label: 'Neomezený (Roční)' }
      : { amountHellers: 42900,  label: 'Neomezený (Měsíční)' };
  }
  // default to pro
  return isAnnual
    ? { amountHellers: 214800, label: 'Pro (Roční)' }
    : { amountHellers: 22900,  label: 'Pro (Měsíční)' };
}

/**
 * Main renewal runner — finds expired subscriptions and charges them.
 * Safe to call multiple times (idempotent per subscription per day).
 */
async function runGopayRenewal() {
  console.log('[gopay-renewal] Starting GoPay subscription renewal job...');

  let subscriptions;
  try {
    subscriptions = await getExpiredActiveSubscriptions();
  } catch (err) {
    console.error('[gopay-renewal] Failed to fetch expired subscriptions:', err.message);
    return;
  }

  if (subscriptions.length === 0) {
    console.log('[gopay-renewal] No expired subscriptions found. Done.');
    return;
  }

  console.log(`[gopay-renewal] Found ${subscriptions.length} expired subscription(s) to process.`);

  for (const sub of subscriptions) {
    const { user_id: userId, recurrence_payment_id: parentPaymentId, plan, is_annual: isAnnual } = sub;
    const userLabel = sub.email || userId;

    try {
      const { amountHellers, label } = getPlanAmount(plan, isAnnual);
      const orderNumber = `tb_renew_${Date.now()}_${userId.slice(0, 4)}`;
      const orderDescription = `TypeBeatz - Obnovení předplatného ${label}`;

      console.log(`[gopay-renewal] Charging user ${userLabel} (parent payment: ${parentPaymentId})...`);

      const newPayment = await chargeRecurrence(
        parentPaymentId,
        amountHellers,
        orderNumber,
        orderDescription
      );

      // GoPay recurrence charges are synchronous — check the state immediately.
      if (newPayment.state === 'PAID') {
        const durationDays = isAnnual ? 365 : 30;
        await renewSubscription(userId, String(newPayment.id), durationDays, plan);
        console.log(`[gopay-renewal] ✓ Renewed subscription for ${userLabel} (new payment: ${newPayment.id})`);
      } else {
        console.warn(`[gopay-renewal] ✗ Charge returned state "${newPayment.state}" for ${userLabel}. Downgrading.`);
        await downgradeExpiredSubscription(userId);
      }
    } catch (err) {
      console.error(`[gopay-renewal] ✗ Error processing renewal for ${userLabel}:`, err.message);
      // Downgrade on any hard error (bad card, network, etc.)
      try {
        await downgradeExpiredSubscription(userId);
      } catch (downgradeErr) {
        console.error(`[gopay-renewal] Failed to downgrade ${userLabel}:`, downgradeErr.message);
      }
    }
  }

  console.log('[gopay-renewal] Renewal job complete.');
}

module.exports = { runGopayRenewal };

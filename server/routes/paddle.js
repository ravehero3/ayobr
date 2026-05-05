const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../auth');
const { getUserById, upsertSubscription, setUserRole, getSubscription } = require('../storage');
const { pool } = require('../db');

// Lazy-init Paddle client so missing env vars don't crash server startup
let paddle = null;
function getPaddle() {
  if (!paddle) {
    if (!process.env.PADDLE_API_KEY) return null;
    const { Paddle, Environment } = require('@paddle/paddle-node-sdk');
    paddle = new Paddle(process.env.PADDLE_API_KEY, {
      environment: process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox
    });
  }
  return paddle;
}

// Read price ID lazily so env vars set after startup are picked up
function getPriceId() {
  return process.env.PADDLE_PRO_PRICE_ID || null;
}

// Public config for Paddle.js client-side initialization
// PADDLE_CLIENT_TOKEN is a public token — safe to expose to frontend
router.get('/config', (req, res) => {
  res.json({
    clientToken: process.env.PADDLE_CLIENT_TOKEN || null,
    priceId: getPriceId(),
    environment: process.env.PADDLE_ENV === 'production' ? 'production' : 'sandbox'
  });
});

// Create Paddle checkout — returns a checkout URL (fallback if overlay unavailable)
router.post('/create-checkout', isAuthenticated, async (req, res) => {
  const p = getPaddle();
  if (!p) return res.status(503).json({ message: 'Paddle not configured yet' });

  const priceId = getPriceId();
  if (!priceId) return res.status(503).json({ message: 'Paddle price not configured yet' });

  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const domain = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}`
        : 'http://localhost:5000');

    const transaction = await p.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customer: { email: user.email },
      customData: { userId },
      successUrl: `${domain}/app?upgraded=true`,
      cancelUrl: `${domain}/app?cancelled=true`
    });

    res.json({ url: transaction.checkout?.url || null, transactionId: transaction.id });
  } catch (err) {
    console.error('Paddle checkout error:', err);
    res.status(500).json({ message: 'Failed to create checkout' });
  }
});

// Get subscription status for current user
router.get('/subscription', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const sub = await getSubscription(userId);
    res.json(sub || { status: 'inactive' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription — schedules cancellation at end of billing period
router.post('/cancel', isAuthenticated, async (req, res) => {
  const p = getPaddle();
  if (!p) return res.status(503).json({ message: 'Paddle not configured yet' });

  try {
    const userId = req.user.id;
    const sub = await getSubscription(userId);
    if (!sub?.paddle_subscription_id) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    await p.subscriptions.cancel(sub.paddle_subscription_id, {
      effectiveFrom: 'next_billing_period'
    });

    // Update local status to cancelling (not yet cancelled — still active until period ends)
    await upsertSubscription({
      userId,
      paddleCustomerId: sub.paddle_customer_id,
      paddleSubscriptionId: sub.paddle_subscription_id,
      status: 'cancelling',
      currentPeriodEnd: sub.current_period_end
    });

    res.json({ message: 'Subscription will cancel at end of billing period' });
  } catch (err) {
    console.error('Paddle cancel error:', err);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Paddle webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const { EventName } = require('@paddle/paddle-node-sdk');

  const signature = req.headers['paddle-signature'];
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('PADDLE_WEBHOOK_SECRET not set — skipping signature verification');
  }

  let event;
  try {
    if (webhookSecret && getPaddle()) {
      event = getPaddle().webhooks.unmarshal(req.body.toString(), webhookSecret, signature);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Paddle webhook parse error:', err.message);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  try {
    const eventType = event.eventType || event.event_type;
    const data = event.data;

    // Helper: find userId from customData OR by looking up paddle_customer_id in subscriptions
    async function resolveUserId(customData, customerId, subscriptionId) {
      // 1. Direct customData (set during checkout)
      const fromCustom = customData?.userId || customData?.user_id;
      if (fromCustom) return fromCustom;
      // 2. Look up by subscription ID
      if (subscriptionId) {
        const r = await pool.query(
          'SELECT user_id FROM subscriptions WHERE paddle_subscription_id = $1',
          [subscriptionId]
        );
        if (r.rows[0]) return r.rows[0].user_id;
      }
      // 3. Look up by customer ID
      if (customerId) {
        const r = await pool.query(
          'SELECT user_id FROM subscriptions WHERE paddle_customer_id = $1 ORDER BY updated_at DESC LIMIT 1',
          [customerId]
        );
        if (r.rows[0]) return r.rows[0].user_id;
      }
      return null;
    }

    switch (eventType) {
      case 'transaction.completed':
      case EventName?.TransactionCompleted: {
        const customData = data?.customData || data?.custom_data;
        const customerId = data?.customerId || data?.customer_id;
        const subscriptionId = data?.subscriptionId || data?.subscription_id;

        const userId = await resolveUserId(customData, customerId, subscriptionId);
        if (!userId) { console.warn('transaction.completed: could not resolve userId'); break; }

        await upsertSubscription({
          userId,
          paddleCustomerId: customerId,
          paddleSubscriptionId: subscriptionId,
          status: 'active',
          currentPeriodEnd: null
        });
        await setUserRole(userId, 'pro');
        console.log(`User ${userId} upgraded to PRO via transaction.completed`);
        break;
      }

      case 'subscription.activated':
      case EventName?.SubscriptionActivated: {
        const customData = data?.customData || data?.custom_data;
        const customerId = data?.customerId || data?.customer_id;

        const userId = await resolveUserId(customData, customerId, data?.id);
        if (!userId) { console.warn('subscription.activated: could not resolve userId'); break; }

        await upsertSubscription({
          userId,
          paddleCustomerId: customerId,
          paddleSubscriptionId: data.id,
          status: 'active',
          currentPeriodEnd: data?.nextBilledAt ? new Date(data.nextBilledAt) : null
        });
        await setUserRole(userId, 'pro');
        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case 'subscription.updated':
      case EventName?.SubscriptionUpdated: {
        const customerId = data?.customerId || data?.customer_id;
        const userId = await resolveUserId(null, customerId, data?.id);
        if (!userId) { console.warn('subscription.updated: could not resolve userId'); break; }

        const status = data.status === 'active' ? 'active' : data.status;
        await upsertSubscription({
          userId,
          paddleCustomerId: customerId,
          paddleSubscriptionId: data.id,
          status,
          currentPeriodEnd: data?.nextBilledAt ? new Date(data.nextBilledAt) : null
        });
        // Only revoke PRO if subscription is genuinely not active/trialing
        if (!['active', 'trialing'].includes(data.status)) {
          await setUserRole(userId, 'free');
        }
        break;
      }

      case 'subscription.canceled':
      case EventName?.SubscriptionCanceled: {
        const customerId = data?.customerId || data?.customer_id;
        const userId = await resolveUserId(null, customerId, data?.id);
        if (!userId) { console.warn('subscription.canceled: could not resolve userId'); break; }

        await upsertSubscription({
          userId,
          paddleCustomerId: customerId,
          paddleSubscriptionId: data.id,
          status: 'cancelled',
          currentPeriodEnd: data?.canceledAt ? new Date(data.canceledAt) : null
        });
        await setUserRole(userId, 'free');
        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled Paddle event: ${eventType}`);
    }
  } catch (err) {
    console.error('Paddle webhook handler error:', err);
  }

  res.json({ received: true });
});

module.exports = router;

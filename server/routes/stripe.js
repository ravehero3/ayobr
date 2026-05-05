const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { isAuthenticated } = require('../auth');
const { getUserById, upsertSubscription, setUserRole, getSubscription } = require('../storage');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;

// Create Stripe checkout session
router.post('/create-checkout', isAuthenticated, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe not configured' });
  try {
    const userId = req.user.claims.sub;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${req.protocol}://${req.hostname}/app?upgraded=true`,
      cancel_url: `${req.protocol}://${req.hostname}/app?cancelled=true`,
      metadata: { userId }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// Get subscription status
router.get('/subscription', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const sub = await getSubscription(userId);
    res.json(sub || { status: 'inactive' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create customer portal session (manage/cancel)
router.post('/portal', isAuthenticated, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe not configured' });
  try {
    const userId = req.user.claims.sub;
    const sub = await getSubscription(userId);
    if (!sub?.stripe_customer_id) {
      return res.status(404).json({ message: 'No subscription found' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${req.protocol}://${req.hostname}/app`
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).send('Stripe not configured');
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId) break;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await upsertSubscription({
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: 'active',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        });
        await setUserRole(userId, 'pro');
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const existing = await getSubscription(null); // we need to look up by stripe_subscription_id
        // Find user by stripe_subscription_id
        const { pool } = require('../db');
        const result = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
          [sub.id]
        );
        if (result.rows[0]) {
          const userId = result.rows[0].user_id;
          const status = sub.status === 'active' ? 'active' : sub.status;
          await upsertSubscription({
            userId,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000)
          });
          if (sub.status !== 'active') {
            await setUserRole(userId, 'free');
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const { pool } = require('../db');
        const result = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
          [sub.id]
        );
        if (result.rows[0]) {
          const userId = result.rows[0].user_id;
          await upsertSubscription({
            userId,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            status: 'cancelled',
            currentPeriodEnd: new Date(sub.current_period_end * 1000)
          });
          await setUserRole(userId, 'free');
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

module.exports = router;

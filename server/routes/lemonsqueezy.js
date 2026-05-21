const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { isAuthenticated } = require('../auth');
const { getUserById, upsertSubscription, setUserRole, setCreditsForRole, getSubscription } = require('../storage');
const { pool } = require('../db');

// Lazy reading of env vars
const getApiKey = () => process.env.LEMONSQUEEZY_API_KEY || null;
const getStoreId = () => process.env.LEMONSQUEEZY_STORE_ID || null;
const getWebhookSecret = () => process.env.LEMONSQUEEZY_WEBHOOK_SECRET || null;

const getProMonthlyVariantId = () => process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || null;
const getProYearlyVariantId = () => process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || null;
const getUnlimitedMonthlyVariantId = () => process.env.LEMONSQUEEZY_UNLIMITED_MONTHLY_VARIANT_ID || null;
const getUnlimitedYearlyVariantId = () => process.env.LEMONSQUEEZY_UNLIMITED_YEARLY_VARIANT_ID || null;

function roleForVariantId(variantId) {
  const vIdStr = String(variantId);
  const unlimitedIds = [getUnlimitedMonthlyVariantId(), getUnlimitedYearlyVariantId()].filter(Boolean).map(String);
  if (unlimitedIds.includes(vIdStr)) return 'unlimited';
  return 'pro';
}

function variantIdFromPayload(attributes, data) {
  if (!attributes) return null;
  return (
    attributes.variant_id
    || attributes.variantId
    || attributes.first_order_item?.variant_id
    || (data?.type === 'subscriptions' ? attributes.variant_id : null)
  );
}

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!secret || !signature) return !secret;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(digest, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Config endpoint
router.get('/config', (req, res) => {
  res.json({
    storeId: getStoreId(),
    proMonthlyVariantId: getProMonthlyVariantId(),
    proYearlyVariantId: getProYearlyVariantId(),
    unlimitedMonthlyVariantId: getUnlimitedMonthlyVariantId(),
    unlimitedYearlyVariantId: getUnlimitedYearlyVariantId()
  });
});

// Create checkout endpoint
router.post('/create-checkout', isAuthenticated, async (req, res) => {
  const apiKey = getApiKey();
  const storeId = getStoreId();
  if (!apiKey || !storeId) {
    return res.status(503).json({ message: 'Lemon Squeezy not configured' });
  }

  const { plan, interval } = req.body || {};
  let variantId = null;
  if (plan === 'unlimited') {
    variantId = interval === 'yearly' ? getUnlimitedYearlyVariantId() : getUnlimitedMonthlyVariantId();
  } else {
    variantId = interval === 'yearly' ? getProYearlyVariantId() : getProMonthlyVariantId();
  }

  if (!variantId) {
    return res.status(503).json({ message: 'Lemon Squeezy variant ID not configured' });
  }

  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const domain = process.env.FRONTEND_URL
      || (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : null)
      || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null)
      || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}` : null)
      || 'http://localhost:5000';

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: userId
              }
            },
            product_options: {
              redirect_url: `${domain}/app?upgraded=true`
            }
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: String(storeId)
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: String(variantId)
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Lemon Squeezy API checkout creation error:', errBody);
      return res.status(502).json({ message: 'Error from Lemon Squeezy API' });
    }

    const result = await response.json();
    const checkoutUrl = result?.data?.attributes?.url || null;

    res.json({ url: checkoutUrl });
  } catch (err) {
    console.error('Create Lemon Squeezy checkout error:', err);
    res.status(500).json({ message: 'Failed to create checkout' });
  }
});

// Get subscription endpoint
router.get('/subscription', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const sub = await getSubscription(userId);
    res.json(sub || { status: 'inactive' });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription endpoint
router.post('/cancel', isAuthenticated, async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) return res.status(503).json({ message: 'Lemon Squeezy not configured' });

  try {
    const userId = req.user.id;
    const sub = await getSubscription(userId);
    if (!sub?.provider_subscription_id) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    if (sub.provider_subscription_id.startsWith('gopay_')) {
      await upsertSubscription({
        userId,
        providerCustomerId: sub.provider_customer_id,
        providerSubscriptionId: sub.provider_subscription_id,
        status: 'cancelled',
        currentPeriodEnd: sub.current_period_end
      });
      return res.json({ message: 'GoPay subscription cancelled locally' });
    }

    // Call Lemon Squeezy API to cancel subscription (DELETE /v1/subscriptions/:id)
    const subId = sub.provider_subscription_id.replace('ls_', '');
    const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Lemon Squeezy cancel API error:', errBody);
      return res.status(502).json({ message: 'Failed to cancel subscription on payment provider' });
    }

    const result = await response.json();
    const endsAt = result?.data?.attributes?.ends_at;

    // Update local status to cancelled
    await upsertSubscription({
      userId,
      providerCustomerId: sub.provider_customer_id,
      providerSubscriptionId: sub.provider_subscription_id,
      status: 'cancelled',
      currentPeriodEnd: endsAt ? new Date(endsAt) : sub.current_period_end
    });

    res.json({ message: 'Subscription cancelled successfully at period end' });
  } catch (err) {
    console.error('Lemon Squeezy cancel error:', err);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Webhook endpoint (raw body parsed by app.js middleware)
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-signature'];
  const webhookSecret = getWebhookSecret();

  if (webhookSecret) {
    if (!verifyWebhookSignature(req.body, signature, webhookSecret)) {
      console.error('Lemon Squeezy webhook signature verification failed');
      return res.status(401).send('Invalid signature');
    }
  } else {
    console.warn('LEMONSQUEEZY_WEBHOOK_SECRET not set — skipping signature validation');
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Lemon Squeezy webhook JSON parse error:', err);
    return res.status(400).send('Invalid JSON payload');
  }

  try {
    const eventName = payload?.meta?.event_name;
    const data = payload?.data;
    const attributes = data?.attributes;

    async function resolveUserId() {
      const customUserId = payload?.meta?.custom_data?.user_id;
      if (customUserId) return String(customUserId);

      // Fallback: look up by subscription ID in database
      const subId = `ls_${data?.id}`;
      const r = await pool.query(
        'SELECT user_id FROM subscriptions WHERE provider_subscription_id = $1',
        [subId]
      );
      if (r.rows[0]) return r.rows[0].user_id;
      return null;
    }

    if (eventName === 'subscription_created') {
      const userId = await resolveUserId();
      if (!userId) {
        console.warn(`Lemon Squeezy webhook: could not resolve userId for event ${eventName}`);
        return res.json({ ok: true });
      }

      const storeId = attributes?.store_id || attributes?.storeId;
      const subId = `ls_${data.id}`;
      const variantId = variantIdFromPayload(attributes, data);
      const endsAt = attributes?.ends_at || attributes?.endsAt;
      const status = attributes?.status || 'active';
      const newRole = roleForVariantId(variantId);

      await upsertSubscription({
        userId,
        providerCustomerId: String(storeId || ''),
        providerSubscriptionId: subId,
        status: status === 'expired' ? 'inactive' : status,
        currentPeriodEnd: endsAt ? new Date(endsAt) : null
      });

      await setUserRole(userId, newRole);
      await setCreditsForRole(userId, newRole);
      console.log(`User ${userId} upgraded to ${newRole.toUpperCase()} via LS webhook (${eventName})`);
    }
    else if (eventName === 'subscription_updated') {
      const userId = await resolveUserId();
      if (!userId) {
        console.warn(`Lemon Squeezy webhook: could not resolve userId for event ${eventName}`);
        return res.json({ ok: true });
      }

      const storeId = attributes?.store_id || attributes?.storeId;
      const subId = `ls_${data.id}`;
      const variantId = variantIdFromPayload(attributes, data);
      const endsAt = attributes?.ends_at || attributes?.endsAt;
      const status = attributes?.status || 'active';

      const updatedRole = roleForVariantId(variantId);

      await upsertSubscription({
        userId,
        providerCustomerId: String(storeId),
        providerSubscriptionId: subId,
        status: status === 'expired' ? 'inactive' : status,
        currentPeriodEnd: endsAt ? new Date(endsAt) : null
      });

      if (['active', 'on_trial'].includes(status)) {
        await setUserRole(userId, updatedRole);
        await setCreditsForRole(userId, updatedRole);
      } else {
        await setUserRole(userId, 'free');
        await setCreditsForRole(userId, 'free');
      }
      console.log(`Subscription updated for user ${userId} — status: ${status}, role: ${updatedRole}`);
    } 
    else if (eventName === 'subscription_cancelled') {
      const userId = await resolveUserId();
      if (!userId) {
        console.warn(`Lemon Squeezy webhook: could not resolve userId for event ${eventName}`);
        return res.json({ ok: true });
      }

      const storeId = attributes?.store_id || attributes?.storeId;
      const subId = `ls_${data.id}`;
      const endsAt = attributes?.ends_at || attributes?.endsAt;

      await upsertSubscription({
        userId,
        providerCustomerId: String(storeId),
        providerSubscriptionId: subId,
        status: 'cancelled',
        currentPeriodEnd: endsAt ? new Date(endsAt) : null
      });
      // Note: Reversion to free role happens when currentPeriodEnd is reached OR on expiration,
      // but to be safe and customer-friendly, if it cancels we can let them enjoy it until period end
      // or if status says expired. We let subscription_updated or status check handle role expiration.
      console.log(`Subscription scheduled for cancellation for user ${userId}`);
    }
    else if (eventName === 'subscription_expired') {
      const userId = await resolveUserId();
      if (!userId) {
        console.warn(`Lemon Squeezy webhook: could not resolve userId for event ${eventName}`);
        return res.json({ ok: true });
      }

      const storeId = attributes?.store_id || attributes?.storeId;
      const subId = `ls_${data.id}`;

      await upsertSubscription({
        userId,
        providerCustomerId: String(storeId || ''),
        providerSubscriptionId: subId,
        status: 'expired',
        currentPeriodEnd: null
      });
      await setUserRole(userId, 'free');
      await setCreditsForRole(userId, 'free');
      console.log(`Subscription expired for user ${userId} — reverted to free`);
    }
  } catch (err) {
    console.error('Lemon Squeezy webhook processing error:', err);
  }

  res.json({ ok: true });
});

module.exports = router;

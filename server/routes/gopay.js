const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../auth');
const { getUserById, upsertSubscription, setUserRole, setCreditsForRole } = require('../storage');

// GoPay REST Credentials from environment
// IMPORTANT: Set GOPAY_GOID, GOPAY_CLIENT_ID, GOPAY_CLIENT_SECRET, and GOPAY_IS_PRODUCTION=true
// in your environment before going live. The fallbacks below are GoPay sandbox credentials only.
const GOPAY_GOID = process.env.GOPAY_GOID || '8229864229';
const GOPAY_CLIENT_ID = process.env.GOPAY_CLIENT_ID || '1482939626';
const GOPAY_CLIENT_SECRET = process.env.GOPAY_CLIENT_SECRET || 'rW7hHn92';
const GOPAY_IS_PRODUCTION = process.env.GOPAY_IS_PRODUCTION === 'true';

if (GOPAY_IS_PRODUCTION && (!process.env.GOPAY_GOID || !process.env.GOPAY_CLIENT_ID || !process.env.GOPAY_CLIENT_SECRET)) {
  console.error('[gopay] CRITICAL: GOPAY_IS_PRODUCTION=true but credentials are not set — using sandbox fallbacks in production!');
}

const GOPAY_BASE_URL = GOPAY_IS_PRODUCTION
  ? 'https://gate.gopay.cz/api'
  : 'https://gw.sandbox.gopay.com/api';

/**
 * Lazy helper to retrieve a GoPay API OAuth2 token
 */
async function getGoPayToken() {
  const credentialsBase64 = Buffer.from(`${GOPAY_CLIENT_ID}:${GOPAY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${GOPAY_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentialsBase64}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: 'grant_type=client_credentials&scope=payment-all'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GoPay token auth failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Helper to fetch a payment's details from GoPay
 */
async function getGoPayPaymentStatus(paymentId) {
  const token = await getGoPayToken();
  const response = await fetch(`${GOPAY_BASE_URL}/payments/payment/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch GoPay payment ${paymentId}: ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

/**
 * POST /api/gopay/create-payment
 * Body: { plan: 'pro' | 'unlimited', isAnnual: boolean }
 */
router.post('/create-payment', isAuthenticated, async (req, res) => {
  try {
    const { plan, isAnnual } = req.body || {};
    const userId = req.user.id;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine CZK amounts (stored as hellers/haléře: 1 CZK = 100 hellers)
    let amountHellers = 0;
    let planLabel = '';

    if (plan === 'unlimited') {
      if (isAnnual) {
        amountHellers = 418800; // 349 Kč * 12 = 4,188 Kč (Annual)
        planLabel = 'Neomezený (Roční)';
      } else {
        amountHellers = 42900; // 429 Kč (Monthly)
        planLabel = 'Neomezený (Měsíční)';
      }
    } else {
      if (isAnnual) {
        amountHellers = 214800; // 179 Kč * 12 = 2,148 Kč (Annual)
        planLabel = 'Pro (Roční)';
      } else {
        amountHellers = 22900; // 229 Kč (Monthly)
        planLabel = 'Pro (Měsíční)';
      }
    }

    // Fetch dynamic base domain matching current workspace
    const domain = process.env.APP_URL || 'https://typebeatz.voodoo808.com';

    // Encode parameters cleanly in return URLs to avoid losing state during external redirect
    const returnUrl = `${domain}/api/gopay/callback?userId=${encodeURIComponent(userId)}&plan=${encodeURIComponent(plan)}&isAnnual=${isAnnual ? 'true' : 'false'}`;
    const notificationUrl = `${domain}/api/gopay/notification?userId=${encodeURIComponent(userId)}&plan=${encodeURIComponent(plan)}&isAnnual=${isAnnual ? 'true' : 'false'}`;

    // Get access token
    const token = await getGoPayToken();

    // Prepare GoPay payment creation body
    const payload = {
      payer: {
        default_payment_instrument: 'PAYMENT_CARD',
        allowed_payment_instruments: ['PAYMENT_CARD'],
        contact: {
          email: user.email,
          country_code: 'CZE',
          ...(user.first_name ? { first_name: user.first_name } : {}),
          ...(user.last_name ? { last_name: user.last_name } : {})
        }
      },
      amount: amountHellers,
      currency: 'CZK',
      order_number: `tb_${Date.now()}_${userId.slice(0, 4)}`,
      order_description: `TypeBeatz - ${planLabel}`,
      items: [
        {
          name: `TypeBeatz - Předplatné ${planLabel}`,
          amount: amountHellers,
          count: 1
        }
      ],
      callback: {
        return_url: returnUrl,
        notification_url: notificationUrl
      },
      target: {
        type: 'ACCOUNT',
        goid: GOPAY_GOID
      },
      lang: 'CS'
    };

    const response = await fetch(`${GOPAY_BASE_URL}/payments/payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GoPay Payment Creation Failure:', errorText);
      return res.status(502).json({ message: 'GoPay gateway payment creation failed.' });
    }

    const paymentResult = await response.json();
    res.json({ gwUrl: paymentResult.gw_url });

  } catch (err) {
    console.error('GoPay create-payment route error:', err);
    res.status(500).json({ message: 'Failed to initiate GoPay payment gateway.' });
  }
});

/**
 * Helper callback utility to upgrade user subscription state in DB
 */
async function upgradeUserFromPayment(userId, plan, isAnnual, paymentId) {
  const finalRole = plan === 'unlimited' ? 'unlimited' : 'pro';
  
  // 1. Elevate user role
  await setUserRole(userId, finalRole);
  
  // 2. Set plan credits
  await setCreditsForRole(userId, finalRole);

  // 3. Map GoPay checkout into standard subscription table to preserve structural compatibility
  const durationDays = isAnnual ? 365 : 30;
  const currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await upsertSubscription({
    userId,
    providerCustomerId: `gopay_cust_${userId}`,
    providerSubscriptionId: `gopay_sub_${paymentId}`,
    status: 'active',
    currentPeriodEnd
  });
}

/**
 * GET /api/gopay/callback
 * Redirect handler returned from GoPay.
 */
router.get('/callback', async (req, res) => {
  const { id: paymentId, userId, plan, isAnnual } = req.query;

  if (!paymentId || !userId || !plan) {
    console.error('GoPay Return Callback is missing critical query parameters:', req.query);
    return res.redirect('/app?cancelled=true');
  }

  try {
    const payment = await getGoPayPaymentStatus(paymentId);
    
    // Status is 'PAID' or 'PAYMENT_METHOD_CHOSEN' or 'AUTHORIZED'
    if (payment.state === 'PAID') {
      await upgradeUserFromPayment(userId, plan, isAnnual === 'true', paymentId);
      const finalPlan = plan === 'unlimited' ? 'unlimited' : 'pro';
      return res.redirect(`/success?plan=${finalPlan}`);
    } else {
      console.warn(`GoPay Payment ${paymentId} has status ${payment.state}. Denying upgrade.`);
      return res.redirect('/app?cancelled=true');
    }
  } catch (err) {
    console.error('Error handling GoPay callback return:', err);
    res.redirect('/app?cancelled=true');
  }
});

/**
 * POST /api/gopay/notification
 * Webhook handler called by GoPay server background workers.
 */
router.post('/notification', async (req, res) => {
  const { id: paymentId, userId, plan, isAnnual } = req.query;

  if (!paymentId || !userId || !plan) {
    console.warn('GoPay Webhook notification is missing query parameters:', req.query);
    return res.status(400).send('Missing params');
  }

  try {
    const payment = await getGoPayPaymentStatus(paymentId);
    
    if (payment.state === 'PAID') {
      await upgradeUserFromPayment(userId, plan, isAnnual === 'true', paymentId);
      return res.status(200).send('OK');
    } else {
      return res.status(200).send(`Payment state is ${payment.state}`);
    }
  } catch (err) {
    console.error('Error handling GoPay webhook notification:', err);
    res.status(500).send('Internal Error');
  }
});

module.exports = router;

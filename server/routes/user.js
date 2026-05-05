const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../auth');
const { getUserById, getUserCredits, deductCredit, agreeToRights, getFeatureFlags, applyReferralCode, getReferralStats } = require('../storage');

// Get current user profile + credits
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const [user, credits] = await Promise.all([
      getUserById(userId),
      getUserCredits(userId)
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ ...user, credits });
  } catch (err) {
    console.error('GET /api/user/me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Agree to rights (called at signup)
router.post('/agree-rights', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await agreeToRights(userId);
    res.json(user);
  } catch (err) {
    console.error('POST /api/user/agree-rights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deduct a credit (called before video generation)
router.post('/deduct-credit', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await getUserById(userId);

    // PRO and admin users skip credit check
    if (user.role === 'pro' || user.role === 'admin') {
      return res.json({ success: true, creditsRemaining: null, isPro: true });
    }

    const result = await deductCredit(userId);
    if (!result) {
      return res.status(402).json({ message: 'No credits remaining. Upgrade to PRO for unlimited videos.' });
    }
    res.json({ success: true, creditsRemaining: result.credits_remaining });
  } catch (err) {
    console.error('POST /api/user/deduct-credit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feature flags for current user plan
router.get('/features', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await getUserById(userId);
    const flags = await getFeatureFlags();
    const plan = user?.role === 'pro' || user?.role === 'admin' ? 'pro' : 'free';
    const userFlags = flags
      .filter(f => f.plan === plan || f.plan === 'all')
      .reduce((acc, f) => ({ ...acc, [f.feature_key]: f.enabled }), {});
    res.json(userFlags);
  } catch (err) {
    console.error('GET /api/user/features error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get referral code + stats
router.get('/referral', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const stats = await getReferralStats(userId);
    res.json(stats);
  } catch (err) {
    console.error('GET /api/user/referral error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply a referral code (called once after sign-up)
router.post('/referral/apply', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Missing referral code' });
    }
    const result = await applyReferralCode(userId, code);
    res.json(result);
  } catch (err) {
    console.error('POST /api/user/referral/apply error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

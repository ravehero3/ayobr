const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../auth');
const { getUserById, getUserCredits, deductCredits, agreeToRights, getFeatureFlags, applyReferralCode, getReferralStats, updateUserProfile } = require('../storage');

const UNLIMITED_ROLES = ['unlimited', 'admin'];

// Get current user profile + credits
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
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
 
// Update user profile
router.post('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, producer_name } = req.body;
    const updated = await updateUserProfile(userId, { first_name, last_name, producer_name });
    res.json(updated);
  } catch (err) {
    console.error('POST /api/user/profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Agree to rights (called at signup)
router.post('/agree-rights', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
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
    const userId = req.user.id;
    const { count = 1 } = req.body || {};
    const user = await getUserById(userId);

    // Unlimited and admin bypass all credit checks
    if (UNLIMITED_ROLES.includes(user.role)) {
      return res.json({ success: true, creditsRemaining: null, isUnlimited: true });
    }

    // Free and PRO users go through the credits table
    // If multiple credits, we need to check if they have enough first
    const credits = await getUserCredits(userId);
    if (credits.credits_remaining < count) {
      const msg = user.role === 'pro'
        ? `You need ${count} credits but only have ${credits.credits_remaining}. Upgrade to Unlimited for unlimited video generation.`
        : `No credits remaining. You need ${count} credits but only have ${credits.credits_remaining}. Upgrade to PRO for 31 videos/month, or Unlimited for no limits.`;
      return res.status(402).json({ message: msg });
    }

    // Deduct multiple credits in a single transaction
    const lastResult = await deductCredits(userId, count);
    if (!lastResult) {
      return res.status(402).json({ message: 'Failed to deduct credits. Not enough balance.' });
    }

    res.json({ success: true, creditsRemaining: lastResult.credits_remaining });
  } catch (err) {
    console.error('POST /api/user/deduct-credit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feature flags for current user plan
router.get('/features', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    const flags = await getFeatureFlags();
    let plan = 'free';
    if (user?.role === 'unlimited' || user?.role === 'admin') plan = 'unlimited';
    else if (user?.role === 'pro') plan = 'pro';
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
    const userId = req.user.id;
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
    const userId = req.user.id;
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

// Update user profile picture
router.post('/profile-picture', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'Missing image' });
    }
    const updated = await updateUserProfile(userId, { profile_image_url: image });
    res.json(updated);
  } catch (err) {
    console.error('POST /api/user/profile-picture error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

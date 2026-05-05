const express = require('express');
const router = express.Router();
const { isAdmin } = require('../auth');
const { getAllUsers, setUserRole, getFeatureFlags, updateFeatureFlag, resetMonthlyCredits } = require('../storage');

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.patch('/users/:userId/role', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['free', 'pro', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await setUserRole(userId, role);
    res.json(user);
  } catch (err) {
    console.error('PATCH /api/admin/users/:id/role error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all feature flags
router.get('/features', isAdmin, async (req, res) => {
  try {
    const flags = await getFeatureFlags();
    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle a feature flag
router.patch('/features', isAdmin, async (req, res) => {
  try {
    const { featureKey, plan, enabled } = req.body;
    const flag = await updateFeatureFlag(featureKey, plan, enabled);
    res.json(flag);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manually reset monthly credits (in case cron fails)
router.post('/reset-credits', isAdmin, async (req, res) => {
  try {
    const count = await resetMonthlyCredits();
    res.json({ message: `Reset credits for ${count} free users` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

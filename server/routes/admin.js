const express = require('express');
const router = express.Router();
const { isAdmin } = require('../auth');
const {
  getAllUsers, setUserRole, getFeatureFlags, updateFeatureFlag,
  resetMonthlyCredits, getEmailOptIns, setEmailOptIn, getAdminStats
} = require('../storage');
const { EMAIL_TEMPLATES } = require('../email');

// Stats for dashboard
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// Export users CSV
router.get('/users/export', isAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    const header = 'ID,Email,First Name,Last Name,Role,Email Opt-in,Joined\n';
    const rows = users.map(u =>
      [u.id, u.email || '', u.first_name || '', u.last_name || '', u.role, u.email_opt_in ? 'yes' : 'no', u.created_at || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.status(200).send(header + rows);
  } catch (err) {
    console.error('GET /api/admin/users/export error:', err);
    res.status(500).send('Server error');
  }
});

// Update user role
router.patch('/users/:userId/role', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['free', 'pro', 'unlimited', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await setUserRole(userId, role);
    res.json(user);
  } catch (err) {
    console.error('PATCH /api/admin/users/:id/role error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get opted-in emails
router.get('/emails', isAdmin, async (req, res) => {
  try {
    const emails = await getEmailOptIns();
    res.json(emails);
  } catch (err) {
    console.error('GET /api/admin/emails error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export opted-in emails as CSV
router.get('/emails/export', isAdmin, async (req, res) => {
  try {
    const emails = await getEmailOptIns();
    const header = 'Email,First Name,Last Name,Role,Signed Up\n';
    const rows = emails.map(u =>
      [u.email || '', u.first_name || '', u.last_name || '', u.role, u.created_at || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=emails_export.csv');
    res.status(200).send(header + rows);
  } catch (err) {
    console.error('GET /api/admin/emails/export error:', err);
    res.status(500).send('Server error');
  }
});

// Toggle email opt-in for a user
router.patch('/users/:userId/email-opt-in', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { optIn } = req.body;
    const user = await setEmailOptIn(userId, !!optIn);
    res.json(user);
  } catch (err) {
    console.error('PATCH /api/admin/users/:id/email-opt-in error:', err);
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

// Manually reset monthly credits
router.post('/reset-credits', isAdmin, async (req, res) => {
  try {
    const count = await resetMonthlyCredits();
    res.json({ message: `Reset credits for ${count} free users` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get email template list (metadata only)
router.get('/email-templates', isAdmin, (req, res) => {
  res.json(EMAIL_TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    trigger: t.trigger,
    subject: t.subject,
  })));
});

// Get HTML preview of a specific email template
router.get('/email-templates/:id/preview', isAdmin, (req, res) => {
  const tpl = EMAIL_TEMPLATES.find(t => t.id === req.params.id);
  if (!tpl) return res.status(404).send('Template not found');
  const html = tpl.getHTML();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;

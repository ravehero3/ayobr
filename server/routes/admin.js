const express = require('express');
const router = express.Router();
const { isAdmin } = require('../auth');
const {
  getAllUsers, setUserRole, getFeatureFlags, updateFeatureFlag,
  resetMonthlyCredits, getEmailOptIns, setEmailOptIn, getAdminStats, getEmailsForSegment
} = require('../storage');
const { EMAIL_TEMPLATES, sendEmail, isSmtpConfigured } = require('../email');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const LANDING_DIR = path.join(__dirname, '../uploads/landing');
if (!fs.existsSync(LANDING_DIR)) fs.mkdirSync(LANDING_DIR, { recursive: true });

const LANDING_CONTENT_FILE = path.join(__dirname, '../data/landing-content.json');
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const landingStorage = multer.diskStorage({
  destination: LANDING_DIR,
  filename: (req, file, cb) => {
    const slot = req.params.slot;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    // Remove any existing file for this slot first
    const existing = fs.readdirSync(LANDING_DIR).filter(f => f.startsWith(`slot-${slot}.`));
    existing.forEach(f => { try { fs.unlinkSync(path.join(LANDING_DIR, f)); } catch(e) {} });
    cb(null, `slot-${slot}${ext}`);
  }
});

const landingUpload = multer({
  storage: landingStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  }
});

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

// SMTP status check
router.get('/smtp-status', isAdmin, (req, res) => {
  res.json({ configured: isSmtpConfigured() });
});

// Send newsletter campaign
router.post('/newsletter', isAdmin, async (req, res) => {
  try {
    const { segment = 'all', templateId, subject, customHtml } = req.body;
    if (!subject) return res.status(400).json({ message: 'Subject is required' });

    const recipients = await getEmailsForSegment(segment);
    if (!recipients.length) return res.json({ sent: 0, failed: 0, total: 0 });

    let sent = 0, failed = 0;
    for (const user of recipients) {
      let html;
      if (templateId) {
        const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
        html = tpl ? tpl.getHTML(user) : customHtml;
      } else {
        html = customHtml || '';
      }
      const ok = await sendEmail({ to: user.email, subject, html });
      if (ok) sent++; else failed++;
    }

    console.log(`[newsletter] Campaign sent: ${sent} ok, ${failed} failed, segment=${segment}`);
    res.json({ sent, failed, total: recipients.length });
  } catch (err) {
    console.error('POST /api/admin/newsletter error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Preview newsletter campaign email for a given recipient type
router.get('/newsletter/preview/:templateId', isAdmin, (req, res) => {
  const tpl = EMAIL_TEMPLATES.find(t => t.id === req.params.templateId);
  if (!tpl) return res.status(404).send('Template not found');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(tpl.getHTML());
});

// ── Landing page images ──────────────────────────────────────
router.post('/landing-images/:slot', isAdmin, (req, res, next) => {
  const { slot } = req.params;
  if (!['1','2','3','4'].includes(slot)) return res.status(400).json({ error: 'Invalid slot (1-4)' });
  next();
}, landingUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  res.json({ url: `/uploads/landing/${req.file.filename}` });
});

router.delete('/landing-images/:slot', isAdmin, (req, res) => {
  const { slot } = req.params;
  if (!['1','2','3','4'].includes(slot)) return res.status(400).json({ error: 'Invalid slot (1-4)' });
  const files = fs.existsSync(LANDING_DIR)
    ? fs.readdirSync(LANDING_DIR).filter(f => f.startsWith(`slot-${slot}.`))
    : [];
  files.forEach(f => { try { fs.unlinkSync(path.join(LANDING_DIR, f)); } catch(e) {} });
  res.json({ ok: true });
});

router.put('/landing-content', isAdmin, (req, res) => {
  try {
    const { steps } = req.body;
    if (!Array.isArray(steps) || steps.length !== 4) {
      return res.status(400).json({ error: 'Invalid content — must be array of 4 steps' });
    }
    const sanitized = steps.map(s => ({
      title: typeof s.title === 'string' ? s.title.trim() : '',
      desc:  typeof s.desc  === 'string' ? s.desc.trim()  : '',
    }));
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LANDING_CONTENT_FILE, JSON.stringify({ steps: sanitized }, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save landing content' });
  }
});

module.exports = router;

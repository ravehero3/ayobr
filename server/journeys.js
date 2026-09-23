const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const { sendEmail } = require('./email');

const DATA_DIR = path.join(__dirname, 'data');
const JOURNEYS_FILE = path.join(DATA_DIR, 'journeys.json');

let _cachedJourneys = null;

// Ensure database table for scheduled journey queue and settings exists
async function initJourneyDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journey_queue (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        journey_id VARCHAR NOT NULL,
        step_id VARCHAR NOT NULL,
        scheduled_for TIMESTAMP NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_journey_queue_status_sched ON journey_queue(status, scheduled_for);

      CREATE TABLE IF NOT EXISTS journey_settings (
        id VARCHAR PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Load from DB if present
    const res = await pool.query(`SELECT data FROM journey_settings WHERE id = 'active_journeys'`);
    if (res.rows.length > 0 && Array.isArray(res.rows[0].data)) {
      _cachedJourneys = res.rows[0].data;
      console.log(`[journeys] Loaded ${_cachedJourneys.length} journeys from database.`);
    } else {
      // Seed from JSON file into DB
      if (fs.existsSync(JOURNEYS_FILE)) {
        const fileData = JSON.parse(fs.readFileSync(JOURNEYS_FILE, 'utf8'));
        _cachedJourneys = fileData;
        await pool.query(`
          INSERT INTO journey_settings (id, data, updated_at)
          VALUES ('active_journeys', $1, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
        `, [JSON.stringify(fileData)]);
        console.log(`[journeys] Seeded ${fileData.length} journeys from file into database.`);
      }
    }
  } catch (err) {
    console.error('[journeys] DB init error:', err.message);
  }
}

// Call init on module load
initJourneyDB().catch(console.error);

/**
 * Load all customer journeys
 */
function getJourneys() {
  if (_cachedJourneys && Array.isArray(_cachedJourneys) && _cachedJourneys.length > 0) {
    return _cachedJourneys;
  }
  try {
    if (fs.existsSync(JOURNEYS_FILE)) {
      _cachedJourneys = JSON.parse(fs.readFileSync(JOURNEYS_FILE, 'utf8'));
      return _cachedJourneys;
    }
  } catch (e) {
    console.error('[journeys] Error reading journeys.json:', e.message);
  }
  return [];
}

/**
 * Save customer journeys to memory cache, file backup, and PostgreSQL database
 */
async function saveJourneys(journeys) {
  _cachedJourneys = journeys;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(JOURNEYS_FILE, JSON.stringify(journeys, null, 2), 'utf8');
  } catch (e) {
    console.error('[journeys] Error saving to journeys.json:', e.message);
  }

  try {
    await pool.query(`
      INSERT INTO journey_settings (id, data, updated_at)
      VALUES ('active_journeys', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `, [JSON.stringify(journeys)]);
    console.log(`[journeys] ✓ Successfully saved ${journeys.length} journeys to database.`);
  } catch (err) {
    console.error('[journeys] DB save error:', err.message);
  }
}

/**
 * Generate full HTML email for a journey step
 */
function renderJourneyStepHTML(step, user = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }, lang = 'cs') {
  const isCzech = (lang || user?.language || 'cs') === 'cs';
  const name = user?.first_name || (isCzech ? 'hudebníku' : 'producer');
  const appUrl = process.env.APP_URL || 'https://typebeatz.voodoo808.com';

  const badgeText = isCzech ? (step.badge_cs || step.badge || 'TYPEBEATZ') : (step.badge_en || step.badge || 'TYPEBEATZ');
  const title = (isCzech ? step.title_cs : step.title_en) || (isCzech ? step.subject_cs : step.subject_en);
  const rawBody = (isCzech ? step.body_cs : step.body_en) || '';
  const ctaText = (isCzech ? step.cta_text_cs : step.cta_text_en) || (isCzech ? 'Přejít do aplikace →' : 'Open TypeBeatz →');
  const ctaUrl = step.cta_url ? (step.cta_url.startsWith('http') ? step.cta_url : `${appUrl}${step.cta_url}`) : `${appUrl}/app`;

  const paragraphs = rawBody
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 18px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.75;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:400;">${p.replace('{{firstName}}', name)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="${isCzech ? 'cs' : 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TypeBeatz</title>
</head>
<!--
  Email design mirrors the TypeBeatz UpgradePage:
  - Pure #000 background
  - Deep navy glass card: linear-gradient(180deg, rgba(1,5,10,0.98) 0%, rgba(7,30,87,0.92) 100%)
  - Official TypeBeatz logo in header
  - Thin rgba(255,255,255,0.1) borders
  - Editorial weight 400-700 typography, -0.04em tracking on headings
  - White pill CTA (solid primary)
  - Subtle blue glow shadow
  - Minimal monochrome badge
-->
<body style="margin:0;padding:0;background:#000000;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;">
  <tr>
    <td align="center" style="padding:48px 16px;">

      <!-- Outer card container -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td>
            <div style="position:relative;">

              <!-- Main card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:linear-gradient(180deg, rgba(1,5,10,0.98) 0%, rgba(7,30,87,0.92) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;box-shadow:0 0 80px rgba(59,130,246,0.18), 0 30px 60px rgba(0,0,0,0.9);">

                <tr>
                  <td style="padding:44px 40px 40px;">

                    <!-- Brand Header: Logo + Badge -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td valign="middle" align="left">
                          <a href="${appUrl}" style="text-decoration:none;display:inline-block;" target="_blank">
                            <img src="${appUrl}/typebeatz-logo.png" alt="TypeBeatz" width="128" height="28" style="display:block;border:0;outline:none;text-decoration:none;height:28px;width:128px;max-width:128px;-ms-interpolation-mode:bicubic;" />
                          </a>
                        </td>
                        <td valign="middle" align="right">
                          <!-- Minimal monochrome badge pill -->
                          <span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.45);border:1px solid rgba(255,255,255,0.14);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${badgeText}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Thin divider -->
                    <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:32px;"></div>

                    <!-- Headline — matches UpgradePage h1: weight 700, -0.04em tracking -->
                    <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;letter-spacing:-0.04em;line-height:1.15;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${(title || '').replace('{{firstName}}', name)}</h1>

                    <!-- Body copy — matches UpgradePage desc: weight 400, rgba(255,255,255,0.32) muted -->
                    <div style="margin-bottom:36px;">
                      ${paragraphs}
                    </div>

                    <!-- Thin divider -->
                    <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:32px;"></div>

                    <!-- CTA — exactly matches UpgradePage solid pill button: white bg, black text, border-radius 9999 -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="border-radius:9999px;background:#ffffff;">
                          <a href="${ctaUrl}"
                            style="display:inline-block;padding:13px 48px;border-radius:9999px;font-weight:600;font-size:14px;text-decoration:none;letter-spacing:-0.01em;background:#ffffff;color:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer row inside card -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:20px;"></div>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:400;">
                      © ${new Date().getFullYear()} TypeBeatz<br>
                      ${isCzech ? 'Automatická zpráva odeslaná na základě tvé aktivity.' : 'Automated message sent based on your activity.'}<br>
                      <span style="color:rgba(255,255,255,0.12);">${user?.email || ''}</span>
                    </p>
                  </td>
                </tr>

              </table>
            </div>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Trigger a customer journey for a user
 * - Step 1 (delay 0): Sent immediately
 * - Step 2+ (delay > 0): Scheduled in journey_queue table
 */
async function triggerJourney(userId, journeyId) {
  try {
    const journeys = getJourneys();
    const journey = journeys.find(j => j.id === journeyId && j.enabled !== false);
    if (!journey || !journey.steps || journey.steps.length === 0) {
      console.log(`[journeys] Journey "${journeyId}" not found or disabled.`);
      return;
    }

    // Get user details
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    if (!user || !user.email) {
      console.warn(`[journeys] Cannot trigger "${journeyId}" — user ${userId} has no email.`);
      return;
    }

    console.log(`[journeys] Triggering journey "${journey.name}" for ${user.email}...`);

    for (const step of journey.steps) {
      if (step.enabled === false) continue;

      const delayHours = parseInt(step.delay_hours, 10) || 0;

      if (delayHours === 0) {
        // Send step 1 immediately
        const isCzech = user.language === 'cs';
        const subject = (isCzech ? step.subject_cs : step.subject_en) || step.subject_cs;
        const html = renderJourneyStepHTML(step, user, user.language);

        await sendEmail({ to: user.email, subject, html });
        console.log(`[journeys] ✓ Step 1 of "${journeyId}" sent immediately to ${user.email}`);

        // Log to email_logs
        try {
          await pool.query(
            `INSERT INTO email_logs (user_id, email, template, subject, success) VALUES ($1, $2, $3, $4, true)`,
            [user.id, user.email, `journey_${journeyId}_step_${step.step_number}`, subject]
          );
        } catch (e) {}
      } else {
        // Schedule subsequent step in journey_queue
        const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);
        await pool.query(
          `INSERT INTO journey_queue (user_id, journey_id, step_id, scheduled_for, status)
           VALUES ($1, $2, $3, $4, 'pending')`,
          [userId, journeyId, step.id, scheduledFor]
        );
        console.log(`[journeys] ⏱ Step ${step.step_number} of "${journeyId}" scheduled in ${delayHours}h for ${user.email} (at ${scheduledFor.toISOString()})`);
      }
    }
  } catch (err) {
    console.error(`[journeys] Error triggering journey "${journeyId}" for user ${userId}:`, err.message);
  }
}

/**
 * Worker: Process pending scheduled emails in journey_queue
 */
async function processJourneyQueue() {
  try {
    const dueRes = await pool.query(`
      SELECT q.id, q.user_id, q.journey_id, q.step_id, q.scheduled_for,
             u.email, u.first_name, u.language
      FROM journey_queue q
      JOIN users u ON u.id = q.user_id
      WHERE q.status = 'pending' AND q.scheduled_for <= NOW()
      ORDER BY q.scheduled_for ASC
      LIMIT 50
    `);

    if (dueRes.rows.length === 0) return 0;

    console.log(`[journeys] Processing ${dueRes.rows.length} due journey email(s)...`);
    const journeys = getJourneys();

    let processedCount = 0;
    for (const item of dueRes.rows) {
      const journey = journeys.find(j => j.id === item.journey_id);
      const step = journey?.steps?.find(s => s.id === item.step_id);

      if (!journey || !step || step.enabled === false) {
        // Mark cancelled if step or journey removed/disabled
        await pool.query(`UPDATE journey_queue SET status = 'cancelled' WHERE id = $1`, [item.id]);
        continue;
      }

      const user = {
        id: item.user_id,
        email: item.email,
        first_name: item.first_name,
        language: item.language || 'cs'
      };

      const isCzech = user.language === 'cs';
      const subject = (isCzech ? step.subject_cs : step.subject_en) || step.subject_cs;
      const html = renderJourneyStepHTML(step, user, user.language);

      const ok = await sendEmail({ to: user.email, subject, html });

      await pool.query(
        `UPDATE journey_queue SET status = $1, sent_at = NOW() WHERE id = $2`,
        [ok ? 'sent' : 'failed', item.id]
      );

      try {
        await pool.query(
          `INSERT INTO email_logs (user_id, email, template, subject, success) VALUES ($1, $2, $3, $4, $5)`,
          [user.id, user.email, `journey_${item.journey_id}_step_${step.step_number}`, subject, ok]
        );
      } catch (e) {}

      processedCount++;
    }

    return processedCount;
  } catch (err) {
    console.error('[journeys] Error in processJourneyQueue:', err.message);
    return 0;
  }
}

/**
 * Get statistics for journeys dashboard
 */
async function getJourneyStats() {
  try {
    const res = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
      FROM journey_queue
    `);
    return {
      pending: parseInt(res.rows[0]?.pending_count || 0, 10),
      sent: parseInt(res.rows[0]?.sent_count || 0, 10),
      failed: parseInt(res.rows[0]?.failed_count || 0, 10),
    };
  } catch (e) {
    return { pending: 0, sent: 0, failed: 0 };
  }
}

module.exports = {
  getJourneys,
  saveJourneys,
  renderJourneyStepHTML,
  triggerJourney,
  processJourneyQueue,
  getJourneyStats,
};

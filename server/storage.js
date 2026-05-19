const { pool } = require('./db');

async function upsertUser(userData) {
  const { id, email, first_name, last_name, profile_image_url } = userData;
  const result = await pool.query(
    `INSERT INTO users (id, email, first_name, last_name, profile_image_url, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       profile_image_url = EXCLUDED.profile_image_url,
       updated_at = NOW()
     RETURNING *`,
    [id, email, first_name, last_name, profile_image_url]
  );
  const user = result.rows[0];

  // Ensure credits row exists for new users
  await pool.query(
    `INSERT INTO credits (user_id, credits_remaining, credits_used_this_month)
     VALUES ($1, 5, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [id]
  );

  return user;
}
 
async function updateUserProfile(userId, { first_name, last_name, producer_name }) {
  const result = await pool.query(
    `UPDATE users
     SET first_name = $1,
         last_name = $2,
         producer_name = $3,
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [first_name, last_name, producer_name, userId]
  );
  return result.rows[0];
}

async function getUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function getAllUsers() {
  const result = await pool.query(`
    SELECT u.*, c.credits_remaining, c.credits_used_this_month, c.last_reset_at,
           s.status as subscription_status, s.current_period_end
    FROM users u
    LEFT JOIN credits c ON c.user_id = u.id
    LEFT JOIN subscriptions s ON s.user_id = u.id
    ORDER BY u.created_at DESC
  `);
  return result.rows;
}

async function getUserCredits(userId) {
  const result = await pool.query(
    'SELECT * FROM credits WHERE user_id = $1',
    [userId]
  );
  if (!result.rows[0]) {
    // Create credits row if missing
    const insert = await pool.query(
      `INSERT INTO credits (user_id, credits_remaining, credits_used_this_month)
       VALUES ($1, 5, 0) RETURNING *`,
      [userId]
    );
    return insert.rows[0];
  }
  return result.rows[0];
}

async function deductCredits(userId, count = 1) {
  const result = await pool.query(
    `UPDATE credits
     SET credits_remaining = credits_remaining - $2,
         credits_used_this_month = credits_used_this_month + $2,
         updated_at = NOW()
     WHERE user_id = $1 AND credits_remaining >= $2
     RETURNING *`,
    [userId, count]
  );
  return result.rows[0] || null;
}

async function deductCredit(userId) {
  return deductCredits(userId, 1);
}

async function setUserRole(userId, role) {
  const result = await pool.query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [role, userId]
  );
  return result.rows[0];
}

async function agreeToRights(userId) {
  const result = await pool.query(
    `UPDATE users SET rights_agreed = TRUE, rights_agreed_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

async function getFeatureFlags() {
  const result = await pool.query('SELECT * FROM feature_flags ORDER BY feature_key, plan');
  return result.rows;
}

async function updateFeatureFlag(featureKey, plan, enabled) {
  const result = await pool.query(
    `UPDATE feature_flags SET enabled = $1, updated_at = NOW()
     WHERE feature_key = $2 AND plan = $3 RETURNING *`,
    [enabled, featureKey, plan]
  );
  return result.rows[0];
}

async function getSubscription(userId) {
  const result = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

async function upsertSubscription(data) {
  const { userId, paddleCustomerId, paddleSubscriptionId, status, currentPeriodEnd } = data;
  const result = await pool.query(
    `INSERT INTO subscriptions (user_id, paddle_customer_id, paddle_subscription_id, status, current_period_end, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       paddle_customer_id = EXCLUDED.paddle_customer_id,
       paddle_subscription_id = EXCLUDED.paddle_subscription_id,
       status = EXCLUDED.status,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = NOW()
     RETURNING *`,
    [userId, paddleCustomerId, paddleSubscriptionId, status, currentPeriodEnd]
  );
  return result.rows[0];
}

async function resetMonthlyCredits() {
  // Free users → 5 credits
  const freeResult = await pool.query(
    `UPDATE credits
     SET credits_remaining = 5,
         credits_used_this_month = 0,
         last_reset_at = NOW(),
         updated_at = NOW()
     WHERE user_id IN (SELECT id FROM users WHERE role = 'free')`
  );
  // PRO users → 31 credits
  const proResult = await pool.query(
    `UPDATE credits
     SET credits_remaining = 31,
         credits_used_this_month = 0,
         last_reset_at = NOW(),
         updated_at = NOW()
     WHERE user_id IN (SELECT id FROM users WHERE role = 'pro')`
  );
  return freeResult.rowCount + proResult.rowCount;
}

/* Set credits when a user's role changes (e.g. on subscription activation) */
async function setCreditsForRole(userId, role) {
  const limit = role === 'pro' ? 31 : role === 'free' ? 5 : null;
  if (limit === null) return; // unlimited/admin don't use credits
  await pool.query(
    `INSERT INTO credits (user_id, credits_remaining, credits_used_this_month)
     VALUES ($1, $2, 0)
     ON CONFLICT (user_id) DO UPDATE SET
       credits_remaining = GREATEST(EXCLUDED.credits_remaining, 0),
       credits_used_this_month = 0,
       updated_at = NOW()`,
    [userId, limit]
  );
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function ensureReferralCode(userId) {
  const existing = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  if (existing.rows[0]?.referral_code) return existing.rows[0].referral_code;

  let code, attempts = 0;
  while (attempts < 10) {
    code = generateCode();
    try {
      const r = await pool.query(
        'UPDATE users SET referral_code = $1 WHERE id = $2 AND referral_code IS NULL RETURNING referral_code',
        [code, userId]
      );
      if (r.rows[0]) return r.rows[0].referral_code;
    } catch (e) {
      if (e.code !== '23505') throw e;
    }
    attempts++;
  }
  const final = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  return final.rows[0]?.referral_code;
}

async function applyReferralCode(newUserId, code) {
  const normalizedCode = code.trim().toUpperCase();

  const alreadyReferred = await pool.query(
    'SELECT referred_by FROM users WHERE id = $1', [newUserId]
  );
  if (alreadyReferred.rows[0]?.referred_by) {
    return { success: false, reason: 'already_referred' };
  }

  const referrer = await pool.query(
    'SELECT id FROM users WHERE referral_code = $1', [normalizedCode]
  );
  if (!referrer.rows[0]) return { success: false, reason: 'invalid_code' };
  const referrerId = referrer.rows[0].id;
  if (referrerId === newUserId) return { success: false, reason: 'self_referral' };

  await pool.query('BEGIN');
  try {
    await pool.query(
      'UPDATE users SET referred_by = $1 WHERE id = $2',
      [normalizedCode, newUserId]
    );
    await pool.query(
      `INSERT INTO referral_uses (referrer_user_id, new_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [referrerId, newUserId]
    );
    await pool.query(
      `UPDATE credits SET credits_remaining = credits_remaining + 1, updated_at = NOW() WHERE user_id = $1`,
      [newUserId]
    );
    await pool.query(
      `UPDATE credits SET credits_remaining = credits_remaining + 1, updated_at = NOW() WHERE user_id = $1`,
      [referrerId]
    );
    await pool.query('COMMIT');
    return { success: true, referrerId };
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
}

async function getReferralStats(userId) {
  const code = await ensureReferralCode(userId);
  const uses = await pool.query(
    'SELECT COUNT(*) as count FROM referral_uses WHERE referrer_user_id = $1',
    [userId]
  );
  return { code, uses: parseInt(uses.rows[0].count, 10) };
}

module.exports = {
  upsertUser, getUserById, getAllUsers,
  getUserCredits, deductCredit, deductCredits,
  setUserRole, agreeToRights,
  getSubscription, upsertSubscription,
  resetMonthlyCredits, setCreditsForRole,
  ensureReferralCode, applyReferralCode, getReferralStats,
  updateUserProfile, getFeatureFlags, updateFeatureFlag
};

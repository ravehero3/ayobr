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

async function deductCredit(userId) {
  const result = await pool.query(
    `UPDATE credits
     SET credits_remaining = credits_remaining - 1,
         credits_used_this_month = credits_used_this_month + 1,
         updated_at = NOW()
     WHERE user_id = $1 AND credits_remaining > 0
     RETURNING *`,
    [userId]
  );
  return result.rows[0] || null;
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
  const result = await pool.query(
    `UPDATE credits
     SET credits_remaining = 5,
         credits_used_this_month = 0,
         last_reset_at = NOW(),
         updated_at = NOW()
     WHERE user_id IN (
       SELECT id FROM users WHERE role = 'free'
     )`
  );
  return result.rowCount;
}

module.exports = {
  upsertUser, getUserById, getAllUsers,
  getUserCredits, deductCredit,
  setUserRole, agreeToRights,
  getFeatureFlags, updateFeatureFlag,
  getSubscription, upsertSubscription,
  resetMonthlyCredits
};

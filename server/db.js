const { Pool } = require('pg');

const isCloudDb = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('supabase') ||
  process.env.DATABASE_URL.includes('render.com') ||
  process.env.DATABASE_URL.includes('railway.app') ||
  process.env.NODE_ENV === 'production'
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false
});

module.exports = { pool };

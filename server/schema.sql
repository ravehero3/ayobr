-- TypeBeatz Platform Database Schema

-- Sessions table (required for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'admin'
  rights_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  rights_agreed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 5,
  credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Subscriptions table (Paddle)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paddle_customer_id VARCHAR,
  paddle_subscription_id VARCHAR UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'inactive',  -- 'active', 'inactive', 'cancelled', 'past_due'
  current_period_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Feature flags table (admin can toggle per plan)
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  feature_key VARCHAR NOT NULL,
  plan VARCHAR NOT NULL,  -- 'free', 'pro', 'all'
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description VARCHAR,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(feature_key, plan)
);

-- Insert default feature flags
INSERT INTO feature_flags (feature_key, plan, enabled, description) VALUES
  ('video_generation', 'free', TRUE, 'Allow free users to generate videos'),
  ('video_generation', 'pro', TRUE, 'Allow pro users to generate videos'),
  ('batch_download', 'free', TRUE, 'Allow free users to download all videos at once'),
  ('batch_download', 'pro', TRUE, 'Allow pro users to download all videos at once'),
  ('high_quality', 'free', FALSE, 'High quality video output (1080p AAC 320kbps)'),
  ('high_quality', 'pro', TRUE, 'High quality video output (1080p AAC 320kbps)')
ON CONFLICT (feature_key, plan) DO NOTHING;

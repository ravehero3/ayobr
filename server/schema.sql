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
  producer_name VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'admin'
  rights_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  rights_agreed_at TIMESTAMP,
  referral_code VARCHAR(8) UNIQUE,
  referred_by VARCHAR(8),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Add referral and details columns to existing users table (safe if already present)
DO $$ BEGIN
  BEGIN ALTER TABLE users ADD COLUMN referral_code VARCHAR(8) UNIQUE; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE users ADD COLUMN referred_by VARCHAR(8); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE users ADD COLUMN producer_name VARCHAR; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Referral uses table
CREATE TABLE IF NOT EXISTS referral_uses (
  id SERIAL PRIMARY KEY,
  referrer_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(new_user_id)
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

-- Subscriptions table (Lemon Squeezy, GoPay, etc.)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_customer_id VARCHAR,
  provider_subscription_id VARCHAR UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'inactive',  -- 'active', 'inactive', 'cancelled', 'past_due'
  current_period_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Migrate legacy Paddle column names (no-op on fresh installs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddle_customer_id'
  ) THEN
    ALTER TABLE subscriptions RENAME COLUMN paddle_customer_id TO provider_customer_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddle_subscription_id'
  ) THEN
    ALTER TABLE subscriptions RENAME COLUMN paddle_subscription_id TO provider_subscription_id;
  END IF;
END $$;

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
  ('video_generation', 'free',      TRUE,  'Allow free users to generate videos'),
  ('video_generation', 'pro',       TRUE,  'Allow pro users to generate videos'),
  ('video_generation', 'unlimited', TRUE,  'Allow unlimited users to generate videos'),
  ('batch_download',   'free',      TRUE,  'Allow free users to download all videos at once'),
  ('batch_download',   'pro',       TRUE,  'Allow pro users to download all videos at once'),
  ('batch_download',   'unlimited', TRUE,  'Allow unlimited users to download all videos at once'),
  ('high_quality',     'free',      FALSE, 'High quality video output (1080p AAC 320kbps)'),
  ('high_quality',     'pro',       TRUE,  'High quality video output (1080p AAC 320kbps)'),
  ('high_quality',     'unlimited', TRUE,  'High quality video output (1080p AAC 320kbps)'),
  ('ultra_quality',    'free',      FALSE, '4K video output'),
  ('ultra_quality',    'pro',       FALSE, '4K video output (PRO is 1080p only)'),
  ('ultra_quality',    'unlimited', TRUE,  '4K video output for unlimited users')
ON CONFLICT (feature_key, plan) DO NOTHING;

-- Safely add unlimited rows for existing databases
DO $$ BEGIN
  INSERT INTO feature_flags (feature_key, plan, enabled, description) VALUES
    ('video_generation', 'unlimited', TRUE,  'Allow unlimited users to generate videos'),
    ('batch_download',   'unlimited', TRUE,  'Allow unlimited users to download all videos at once'),
    ('high_quality',     'unlimited', TRUE,  'High quality video output for unlimited users'),
    ('ultra_quality',    'free',      FALSE, '4K video output'),
    ('ultra_quality',    'pro',       FALSE, '4K video output (PRO is 1080p only)'),
    ('ultra_quality',    'unlimited', TRUE,  '4K video output for unlimited users')
  ON CONFLICT (feature_key, plan) DO NOTHING;
EXCEPTION WHEN others THEN NULL;
END $$;

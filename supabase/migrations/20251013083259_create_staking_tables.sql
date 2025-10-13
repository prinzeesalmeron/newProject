/*
  # Create Staking Tables

  ## Overview
  Creates tables to track ETH staking activities including pools and user stakes.

  ## Tables Created
  
  ### staking_pools
  Stores staking pool configurations
  - `id` - Unique pool identifier
  - `name` - Pool name (Flexible, 30 Days, etc.)
  - `lock_period_days` - Lock period in days
  - `apy` - Annual percentage yield in basis points
  - `total_staked` - Total ETH staked in pool
  - `max_capacity` - Maximum ETH capacity for pool
  - `active` - Whether pool is accepting stakes
  - `created_at` - Pool creation timestamp
  - `updated_at` - Last update timestamp

  ### user_stakes
  Stores individual user stakes
  - `id` - Unique stake identifier
  - `user_id` - User who owns the stake
  - `pool_id` - Staking pool reference
  - `amount` - Amount of ETH staked
  - `start_time` - When stake was created
  - `last_claim_time` - Last rewards claim time
  - `tx_hash` - Blockchain transaction hash
  - `status` - Stake status (active, unstaked, claimed)
  - `created_at` - Record creation timestamp
  - `updated_at` - Last update timestamp

  ### staking_rewards
  Tracks reward claims
  - `id` - Unique reward identifier
  - `stake_id` - Reference to stake
  - `user_id` - User receiving reward
  - `amount` - Reward amount in ETH
  - `claimed_at` - When reward was claimed
  - `tx_hash` - Blockchain transaction hash

  ## Security
  - Enable RLS on all tables
  - Users can only view/modify their own stakes
  - Pool data is read-only for users
  - Only authenticated users can stake
*/

-- Create staking_pools table
CREATE TABLE IF NOT EXISTS staking_pools (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lock_period_days INTEGER NOT NULL,
  apy INTEGER NOT NULL, -- APY in basis points (e.g., 1000 = 10%)
  total_staked DECIMAL(20, 8) DEFAULT 0,
  max_capacity DECIMAL(20, 8) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_stakes table
CREATE TABLE IF NOT EXISTS user_stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id BIGINT NOT NULL REFERENCES staking_pools(id),
  amount DECIMAL(20, 8) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT now(),
  last_claim_time TIMESTAMPTZ DEFAULT now(),
  tx_hash TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unstaked', 'claimed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create staking_rewards table
CREATE TABLE IF NOT EXISTS staking_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID NOT NULL REFERENCES user_stakes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  tx_hash TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_stakes_user_id ON user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool_id ON user_stakes(pool_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_status ON user_stakes(status);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_user_id ON staking_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_stake_id ON staking_rewards(stake_id);

-- Enable Row Level Security
ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staking_pools
-- Everyone can read pool information
CREATE POLICY "Anyone can view staking pools"
  ON staking_pools FOR SELECT
  TO public
  USING (true);

-- Only admins can modify pools (handled by service role)

-- RLS Policies for user_stakes
CREATE POLICY "Users can view own stakes"
  ON user_stakes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stakes"
  ON user_stakes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stakes"
  ON user_stakes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for staking_rewards
CREATE POLICY "Users can view own rewards"
  ON staking_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rewards"
  ON staking_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert default staking pools
INSERT INTO staking_pools (name, lock_period_days, apy, max_capacity)
VALUES
  ('Flexible', 0, 500, 1000),      -- 5% APY, no lock
  ('30 Days', 30, 800, 500),        -- 8% APY, 30 day lock
  ('90 Days', 90, 1200, 300),       -- 12% APY, 90 day lock
  ('180 Days', 180, 1500, 200)      -- 15% APY, 180 day lock
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_staking_pools_updated_at
  BEFORE UPDATE ON staking_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stakes_updated_at
  BEFORE UPDATE ON user_stakes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

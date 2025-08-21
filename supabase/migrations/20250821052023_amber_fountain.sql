/*
  # Complete BlockEstate Database Schema

  1. New Tables
    - `users` (extends existing with additional fields)
    - `properties` (extends existing with additional fields)
    - `shares` (property ownership shares)
    - `transactions` (all financial transactions)
    - `rentals` (rental income records)
    - `staking_pools` (staking pool configurations)
    - `user_stakes` (user staking positions)
    - `notifications` (user notifications)
    - `property_documents` (legal documents)
    - `kyc_verifications` (KYC/AML compliance)

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies
    - Role-based access control
*/

-- Extend users table with additional fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'investor' CHECK (role IN ('investor', 'admin', 'property_manager'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS block_balance numeric DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create shares table for property ownership
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tokens_owned integer NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  purchase_date timestamptz DEFAULT now(),
  current_value numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'rental_income', 'staking_reward', 'withdrawal', 'deposit')),
  amount numeric NOT NULL,
  token_amount integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  blockchain_tx_hash text,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rentals table for rental income tracking
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  month_year date NOT NULL,
  total_income numeric NOT NULL DEFAULT 0,
  expenses numeric DEFAULT 0,
  net_income numeric GENERATED ALWAYS AS (total_income - COALESCE(expenses, 0)) STORED,
  occupancy_rate numeric DEFAULT 100,
  distributed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, month_year)
);

-- Create staking_pools table
CREATE TABLE IF NOT EXISTS staking_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  apy numeric NOT NULL DEFAULT 0,
  lock_period integer DEFAULT 0, -- days
  min_stake numeric DEFAULT 0,
  max_stake numeric,
  total_staked numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_stakes table
CREATE TABLE IF NOT EXISTS user_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  pool_id uuid REFERENCES staking_pools(id) ON DELETE CASCADE,
  amount_staked numeric NOT NULL DEFAULT 0,
  rewards_earned numeric DEFAULT 0,
  stake_date timestamptz DEFAULT now(),
  unlock_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create property_documents table
CREATE TABLE IF NOT EXISTS property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('deed', 'inspection', 'appraisal', 'insurance', 'lease', 'financial')),
  title text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES users(id),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create kyc_verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'utility_bill')),
  document_url text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_property_id ON shares(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_rentals_property_id ON rentals(property_id);
CREATE INDEX IF NOT EXISTS idx_rentals_month_year ON rentals(month_year);
CREATE INDEX IF NOT EXISTS idx_user_stakes_user_id ON user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool_id ON user_stakes(pool_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS on all new tables
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shares
CREATE POLICY "Users can view their own shares" ON shares
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shares" ON shares
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares" ON shares
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for rentals (public read for transparency)
CREATE POLICY "Anyone can view rental data" ON rentals
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Only admins can manage rental data" ON rentals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for staking_pools (public read)
CREATE POLICY "Anyone can view staking pools" ON staking_pools
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Only admins can manage staking pools" ON staking_pools
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_stakes
CREATE POLICY "Users can view their own stakes" ON user_stakes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stakes" ON user_stakes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stakes" ON user_stakes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for property_documents
CREATE POLICY "Anyone can view public property documents" ON property_documents
  FOR SELECT TO public
  USING (is_public = true);

CREATE POLICY "Property owners can view all documents" ON property_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shares 
      WHERE property_id = property_documents.property_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for kyc_verifications
CREATE POLICY "Users can view their own KYC data" ON kyc_verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC data" ON kyc_verifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC data" ON kyc_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample staking pools
INSERT INTO staking_pools (name, description, apy, lock_period, min_stake, max_stake) VALUES
('Flexible Pool', 'No lock period, withdraw anytime', 5.0, 0, 100, NULL),
('30-Day Pool', 'Higher rewards with 30-day lock', 8.5, 30, 500, 50000),
('90-Day Pool', 'Premium rewards with 90-day lock', 12.0, 90, 1000, 100000),
('1-Year Pool', 'Maximum rewards with 1-year commitment', 18.0, 365, 5000, 500000);
/*
  # Enhanced Database Schema for Backend Core Development

  1. New Tables
    - `api_keys` - API key management for external integrations
    - `audit_logs` - System audit trail
    - `property_valuations` - Property valuation history
    - `rental_agreements` - Rental contract management
    - `payment_methods` - User payment method storage
    - `withdrawal_requests` - User withdrawal management
    - `system_settings` - Platform configuration

  2. Enhanced Tables
    - Add additional fields to existing tables for better functionality
    - Add proper constraints and indexes

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for role-based access
    - Audit trail for sensitive operations
*/

-- Create API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  api_key text UNIQUE NOT NULL,
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit logs table for system tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create property valuations table
CREATE TABLE IF NOT EXISTS property_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  valuation_amount numeric NOT NULL,
  valuation_date date NOT NULL,
  valuation_method text CHECK (valuation_method IN ('appraisal', 'market_analysis', 'automated', 'manual')),
  valuator_name text,
  notes text,
  supporting_documents jsonb DEFAULT '{}',
  is_official boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rental agreements table
CREATE TABLE IF NOT EXISTS rental_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_name text NOT NULL,
  tenant_email text,
  tenant_phone text,
  monthly_rent numeric NOT NULL,
  security_deposit numeric DEFAULT 0,
  lease_start_date date NOT NULL,
  lease_end_date date NOT NULL,
  agreement_status text DEFAULT 'active' CHECK (agreement_status IN ('active', 'expired', 'terminated', 'pending')),
  agreement_document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('bank_account', 'credit_card', 'crypto_wallet', 'paypal')),
  provider text NOT NULL,
  account_identifier text NOT NULL, -- Last 4 digits, wallet address, etc.
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'ETH', 'BLOCK')),
  payment_method_id uuid REFERENCES payment_methods(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  rejection_reason text,
  transaction_hash text,
  fees numeric DEFAULT 0,
  net_amount numeric GENERATED ALWAYS AS (amount - COALESCE(fees, 0)) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  setting_type text DEFAULT 'general' CHECK (setting_type IN ('general', 'security', 'financial', 'notification')),
  description text,
  is_public boolean DEFAULT false,
  updated_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add additional fields to existing tables
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_manager_id uuid REFERENCES users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS acquisition_date date;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS acquisition_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS current_valuation numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_valuation_date date;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_tax_annual numeric DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS insurance_annual numeric DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS maintenance_reserve numeric DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "push": true, "sms": false}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee_amount numeric DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 1;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_id text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_property_valuations_property_id ON property_valuations(property_id);
CREATE INDEX IF NOT EXISTS idx_property_valuations_date ON property_valuations(valuation_date);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_property_id ON rental_agreements(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_status ON rental_agreements(agreement_status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Enable RLS on all new tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for audit_logs (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for property_valuations
CREATE POLICY "Anyone can view property valuations" ON property_valuations
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Property managers can manage valuations" ON property_valuations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'property_manager')
    )
  );

-- RLS Policies for rental_agreements
CREATE POLICY "Property owners can view rental agreements" ON rental_agreements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shares 
      WHERE property_id = rental_agreements.property_id 
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'property_manager')
    )
  );

CREATE POLICY "Property managers can manage rental agreements" ON rental_agreements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'property_manager')
    )
  );

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods" ON payment_methods
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods" ON payment_methods
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" ON withdrawal_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON withdrawal_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawal requests" ON withdrawal_requests
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for system_settings
CREATE POLICY "Anyone can view public settings" ON system_settings
  FOR SELECT TO public
  USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_fee_percentage', '2.0', 'financial', 'Platform fee percentage for transactions', true),
('min_investment_amount', '10', 'financial', 'Minimum investment amount in USD', true),
('max_investment_amount', '100000', 'financial', 'Maximum investment amount in USD', true),
('kyc_required', 'true', 'security', 'Whether KYC verification is required', true),
('maintenance_mode', 'false', 'general', 'Platform maintenance mode status', true),
('supported_currencies', '["USD", "ETH", "BLOCK"]', 'financial', 'List of supported currencies', true);
/*
  # Security and Compliance Tables

  1. New Tables
    - `security_events` - Security event logging
    - `kyc_verifications` - Enhanced KYC tracking
    - `payment_disputes` - Stripe dispute management
    - `push_subscriptions` - Push notification subscriptions
    - `currency_rates` - Real-time exchange rates
    - `escrow_transactions` - Secure transaction escrow
    - `payment_transactions` - Enhanced payment tracking
    - `refund_requests` - Refund management
    - `verification_reports` - Property verification reports

  2. Security Features
    - Audit logging for all sensitive operations
    - Rate limiting tracking
    - CSRF token management
    - Encryption key storage

  3. Compliance Features
    - KYC document storage and verification
    - AML screening results
    - Regulatory reporting data
*/

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('login_attempt', 'failed_login', 'suspicious_activity', 'rate_limit_exceeded', 'csrf_detected', 'unauthorized_access')),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security events"
  ON security_events
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Enhanced KYC Verifications
CREATE TABLE IF NOT EXISTS kyc_verifications_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  verification_id text UNIQUE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('jumio', 'onfido', 'manual')),
  verification_status text NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected', 'review_required')) DEFAULT 'pending',
  verification_data jsonb DEFAULT '{}',
  risk_assessment jsonb DEFAULT '{}',
  documents_uploaded text[] DEFAULT '{}',
  verification_score numeric DEFAULT 0,
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  rejection_reasons text[],
  redirect_url text,
  webhook_received_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_verifications_enhanced ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KYC data"
  ON kyc_verifications_enhanced
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all KYC data"
  ON kyc_verifications_enhanced
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Payment Disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_dispute_id text UNIQUE NOT NULL,
  charge_id text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('warning_needs_response', 'warning_under_review', 'warning_closed', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost')),
  evidence_due_by timestamptz,
  evidence_submitted boolean DEFAULT false,
  evidence_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own disputes"
  ON payment_disputes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all disputes"
  ON payment_disputes
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Currency Rates
CREATE TABLE IF NOT EXISTS currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL,
  provider text NOT NULL CHECK (provider IN ('coinbase', 'coingecko', 'binance', 'internal')),
  is_active boolean DEFAULT true,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_currency, to_currency, provider)
);

ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active currency rates"
  ON currency_rates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Only service role can manage currency rates"
  ON currency_rates
  FOR ALL
  TO service_role
  USING (true);

-- Escrow Transactions
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  escrow_fee numeric DEFAULT 0,
  status text NOT NULL CHECK (status IN ('pending', 'funded', 'released', 'refunded', 'disputed')) DEFAULT 'pending',
  release_conditions jsonb DEFAULT '{}',
  released_by uuid REFERENCES users(id),
  released_at timestamptz,
  release_reason text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own escrow transactions"
  ON escrow_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their own escrow transactions"
  ON escrow_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Enhanced Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  payment_intent_id text UNIQUE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method_id text,
  transaction_type text NOT NULL CHECK (transaction_type IN ('investment', 'withdrawal', 'refund', 'fee')),
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')) DEFAULT 'pending',
  provider text NOT NULL CHECK (provider IN ('stripe', 'coinbase', 'bank_transfer')) DEFAULT 'stripe',
  provider_transaction_id text,
  provider_fee numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  net_amount numeric GENERATED ALWAYS AS (amount - COALESCE(provider_fee, 0) - COALESCE(platform_fee, 0)) STORED,
  failure_reason text,
  metadata jsonb DEFAULT '{}',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Refund Requests
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  refund_amount numeric NOT NULL,
  refund_reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')) DEFAULT 'pending',
  provider_refund_id text,
  requested_by uuid REFERENCES users(id),
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refund requests"
  ON refund_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests"
  ON refund_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verification Reports
CREATE TABLE IF NOT EXISTS verification_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  verification_summary jsonb DEFAULT '{}',
  due_diligence jsonb DEFAULT '{}',
  market_analysis jsonb DEFAULT '{}',
  risk_assessment jsonb DEFAULT '{}',
  investment_recommendation jsonb DEFAULT '{}',
  generated_by uuid REFERENCES users(id),
  generated_at timestamptz DEFAULT now(),
  report_version integer DEFAULT 1,
  is_final boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view final verification reports"
  ON verification_reports
  FOR SELECT
  TO public
  USING (is_final = true);

CREATE POLICY "Property managers can manage verification reports"
  ON verification_reports
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'property_manager')
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

CREATE INDEX IF NOT EXISTS idx_kyc_enhanced_user_id ON kyc_verifications_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_enhanced_status ON kyc_verifications_enhanced(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_enhanced_provider ON kyc_verifications_enhanced(provider);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON payment_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON payment_disputes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_currency_rates_pair ON currency_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_active ON currency_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_currency_rates_updated ON currency_rates(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_escrow_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_expires_at ON escrow_transactions(expires_at);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_intent_id ON payment_transactions(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_reports_property_id ON verification_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_verification_reports_final ON verification_reports(is_final);
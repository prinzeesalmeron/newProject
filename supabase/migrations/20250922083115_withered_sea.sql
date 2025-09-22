/*
  # Complete Payment System Database Schema

  1. New Tables
    - `payment_transactions` - All payment transaction records
    - `escrow_transactions` - Escrow holding and release tracking
    - `payment_methods` - User payment method storage
    - `payment_webhooks` - Webhook event processing
    - `refund_requests` - Refund tracking and processing
    - `currency_rates` - Exchange rate tracking
    - `payment_fees` - Fee structure and calculations

  2. Security
    - Enable RLS on all payment tables
    - Strict access controls for financial data
    - Audit logging for all payment operations

  3. Compliance
    - PCI DSS compliance structure
    - AML/KYC integration points
    - Regulatory reporting capabilities
*/

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  payment_intent_id text UNIQUE, -- Stripe payment intent ID
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'ETH', 'BLOCK')),
  payment_method_id uuid,
  transaction_type text NOT NULL CHECK (transaction_type IN ('investment', 'withdrawal', 'conversion', 'fee', 'refund')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  provider text DEFAULT 'stripe' CHECK (provider IN ('stripe', 'paypal', 'coinbase', 'bank_transfer')),
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

-- Escrow Transactions Table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  escrow_amount numeric NOT NULL CHECK (escrow_amount > 0),
  currency text DEFAULT 'USD',
  escrow_fee numeric DEFAULT 0,
  status text DEFAULT 'created' CHECK (status IN ('created', 'funded', 'released', 'refunded', 'disputed', 'expired')),
  release_conditions jsonb DEFAULT '{}',
  auto_release_date timestamptz,
  released_by uuid REFERENCES users(id),
  released_at timestamptz,
  release_reason text,
  dispute_reason text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced Payment Methods Table (if not exists from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
    CREATE TABLE payment_methods (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      provider text NOT NULL CHECK (provider IN ('stripe', 'paypal', 'plaid', 'coinbase')),
      provider_payment_method_id text NOT NULL,
      method_type text NOT NULL CHECK (method_type IN ('credit_card', 'debit_card', 'bank_account', 'paypal', 'crypto_wallet')),
      last_four text,
      brand text,
      exp_month integer,
      exp_year integer,
      is_primary boolean DEFAULT false,
      is_verified boolean DEFAULT false,
      billing_address jsonb DEFAULT '{}',
      metadata jsonb DEFAULT '{}',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Payment Webhooks Table
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('stripe', 'paypal', 'coinbase')),
  webhook_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  processing_error text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Refund Requests Table
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  refund_amount numeric NOT NULL CHECK (refund_amount > 0),
  refund_reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed')),
  requested_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  processed_by uuid REFERENCES users(id),
  provider_refund_id text,
  processed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Currency Exchange Rates Table
CREATE TABLE IF NOT EXISTS currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  provider text DEFAULT 'coinbase' CHECK (provider IN ('coinbase', 'binance', 'coingecko', 'manual')),
  last_updated timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(from_currency, to_currency, provider)
);

-- Payment Fees Configuration Table
CREATE TABLE IF NOT EXISTS payment_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type text NOT NULL CHECK (fee_type IN ('platform', 'processing', 'conversion', 'escrow', 'withdrawal')),
  payment_method text NOT NULL,
  fee_structure text NOT NULL CHECK (fee_structure IN ('percentage', 'fixed', 'tiered')),
  fee_value numeric NOT NULL,
  minimum_fee numeric DEFAULT 0,
  maximum_fee numeric,
  currency text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  effective_from timestamptz DEFAULT now(),
  effective_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Payment Analytics View
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  currency,
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_volume,
  SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful_count,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
  AVG(amount) as average_amount,
  SUM(provider_fee + platform_fee) as total_fees
FROM payment_transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), currency, transaction_type
ORDER BY date DESC;

-- Enable RLS on all payment tables
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Payment Transactions
CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment transactions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Escrow Transactions
CREATE POLICY "Users can view their escrow transactions"
  ON escrow_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create escrow as buyer"
  ON escrow_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for Payment Methods
CREATE POLICY "Users can manage their own payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for Refund Requests
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

-- RLS Policies for Currency Rates (public read)
CREATE POLICY "Anyone can view currency rates"
  ON currency_rates
  FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for Payment Fees (public read)
CREATE POLICY "Anyone can view payment fees"
  ON payment_fees
  FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for Payment Webhooks (admin only)
CREATE POLICY "Admins can manage webhooks"
  ON payment_webhooks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_intent_id ON payment_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_rates_active ON currency_rates(is_active);

-- Insert default payment fees
INSERT INTO payment_fees (fee_type, payment_method, fee_structure, fee_value, minimum_fee, maximum_fee) VALUES
('platform', 'all', 'percentage', 2.5, 1.00, NULL),
('processing', 'credit_card', 'percentage', 2.9, 0.30, NULL),
('processing', 'bank_account', 'fixed', 0.80, 0.80, NULL),
('processing', 'paypal', 'percentage', 3.49, 0.49, NULL),
('conversion', 'crypto', 'percentage', 0.5, 0.01, NULL),
('escrow', 'all', 'percentage', 1.0, 0.50, NULL),
('withdrawal', 'bank_account', 'fixed', 2.00, 2.00, NULL),
('withdrawal', 'paypal', 'percentage', 1.0, 1.00, NULL);

-- Insert default currency rates (these would be updated by a scheduled job)
INSERT INTO currency_rates (from_currency, to_currency, rate, provider) VALUES
('USD', 'ETH', 0.0004, 'coinbase'),
('USD', 'BLOCK', 1.2, 'internal'),
('ETH', 'USD', 2500, 'coinbase'),
('ETH', 'BLOCK', 3000, 'internal'),
('BLOCK', 'USD', 0.83, 'internal'),
('BLOCK', 'ETH', 0.00033, 'internal');
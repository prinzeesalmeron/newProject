/*
  # Fix Missing Payment System Tables

  1. New Tables
    - `payment_webhooks` - Webhook event processing and retry logic
    - `payment_fees` - Fee structure configuration for different payment methods

  2. Views
    - `payment_analytics` - Aggregated payment transaction analytics

  3. Security
    - Enable RLS on new tables
    - Add appropriate access policies
    - Admin-only access for webhooks
    - Public read access for fees

  4. Performance
    - Add indexes for webhook processing
    - Add indexes for active currency rates
*/

-- Payment Webhooks Table (only if missing)
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

-- Payment Fees Configuration Table (only if missing)
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

-- Payment Analytics View (recreate safely)
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

-- Enable RLS on new tables
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policy for Payment Webhooks (admin only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_webhooks' 
    AND policyname = 'Admins can manage webhooks'
  ) THEN
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
  END IF;
END $$;

-- RLS Policy for Payment Fees (public read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_fees' 
    AND policyname = 'Anyone can view payment fees'
  ) THEN
    CREATE POLICY "Anyone can view payment fees"
      ON payment_fees
      FOR SELECT
      TO public
      USING (is_active = true);
  END IF;
END $$;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_created_at ON payment_webhooks(created_at);

-- Insert default payment fees (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_fees LIMIT 1) THEN
    INSERT INTO payment_fees (fee_type, payment_method, fee_structure, fee_value, minimum_fee, maximum_fee) VALUES
    ('platform', 'all', 'percentage', 2.5, 1.00, NULL),
    ('processing', 'credit_card', 'percentage', 2.9, 0.30, NULL),
    ('processing', 'bank_account', 'fixed', 0.80, 0.80, NULL),
    ('processing', 'paypal', 'percentage', 3.49, 0.49, NULL),
    ('conversion', 'crypto', 'percentage', 0.5, 0.01, NULL),
    ('escrow', 'all', 'percentage', 1.0, 0.50, NULL),
    ('withdrawal', 'bank_account', 'fixed', 2.00, 2.00, NULL),
    ('withdrawal', 'paypal', 'percentage', 1.0, 1.00, NULL);
  END IF;
END $$;

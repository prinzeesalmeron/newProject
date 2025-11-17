/*
  # Integration Infrastructure Tables
  
  Creates tables to support third-party integrations:
  - Property data cache
  - Market data cache  
  - Webhook events
  - API rate limits
  - KYC verifications
  - Payment methods
  
  1. New Tables
    - `property_data_cache` - Cache for Zillow/Realtor property data
    - `market_data_cache` - Cache for market data feeds
    - `webhook_events` - Incoming webhook event log
    - `api_rate_limits` - Rate limiting per API provider
    - `kyc_verifications` - KYC verification records
    - `payment_methods` - Saved payment methods
  
  2. Security
    - Enable RLS on all tables
    - Appropriate access policies
*/

-- Property data cache table
CREATE TABLE IF NOT EXISTS property_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  source text DEFAULT 'aggregated',
  confidence_score numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_property_cache_address ON property_data_cache(address);
CREATE INDEX IF NOT EXISTS idx_property_cache_expires ON property_data_cache(expires_at);

ALTER TABLE property_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property cache readable by authenticated users"
  ON property_data_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Property cache writable by service"
  ON property_data_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Market data cache table
CREATE TABLE IF NOT EXISTS market_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  data_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_market_cache_key ON market_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_market_cache_expires ON market_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_market_cache_type ON market_data_cache(data_type);

ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market cache readable by authenticated users"
  ON market_data_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Market cache writable by service"
  ON market_data_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text NOT NULL,
  event_id text,
  payload jsonb NOT NULL,
  signature text,
  verified boolean DEFAULT false,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_created ON webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_event_id ON webhook_events(event_id);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage webhook events"
  ON webhook_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- API rate limits tracking
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 0,
  limit_per_window integer NOT NULL,
  window_start timestamptz DEFAULT now(),
  window_duration interval DEFAULT interval '1 hour',
  last_request_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_provider ON api_rate_limits(provider);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON api_rate_limits(window_start);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage rate limits"
  ON api_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- KYC verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  verification_id text UNIQUE NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  verification_status text,
  risk_score numeric,
  checks jsonb,
  fields jsonb,
  redirect_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verification_id ON kyc_verifications(verification_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC verifications"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage KYC verifications"
  ON kyc_verifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL,
  card_details jsonb,
  bank_details jsonb,
  billing_details jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM property_data_cache WHERE expires_at < now();
  DELETE FROM market_data_cache WHERE expires_at < now();
  DELETE FROM webhook_events WHERE created_at < now() - interval '30 days';
END;
$$;

-- Function to check and update API rate limits
CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_provider text,
  p_endpoint text,
  p_limit integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz;
BEGIN
  INSERT INTO api_rate_limits (provider, endpoint, limit_per_window, request_count)
  VALUES (p_provider, p_endpoint, p_limit, 0)
  ON CONFLICT (provider, endpoint) DO NOTHING;
  
  SELECT request_count, window_start
  INTO v_current_count, v_window_start
  FROM api_rate_limits
  WHERE provider = p_provider AND endpoint = p_endpoint;
  
  IF now() - v_window_start > interval '1 hour' THEN
    UPDATE api_rate_limits
    SET request_count = 1,
        window_start = now(),
        last_request_at = now()
    WHERE provider = p_provider AND endpoint = p_endpoint;
    
    RETURN true;
  END IF;
  
  IF v_current_count < p_limit THEN
    UPDATE api_rate_limits
    SET request_count = request_count + 1,
        last_request_at = now()
    WHERE provider = p_provider AND endpoint = p_endpoint;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

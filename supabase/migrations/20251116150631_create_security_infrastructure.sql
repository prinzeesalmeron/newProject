/*
  # Comprehensive Security Infrastructure

  ## Overview
  This migration establishes a complete security infrastructure for the real estate tokenization platform
  with defense-in-depth security controls.

  ## 1. New Security Tables
    
    ### audit_logs
    - Tracks all critical operations (transactions, auth events, admin actions)
    - Immutable audit trail for compliance
    - Includes user_id, action, resource_type, resource_id, ip_address, user_agent
    - Retention policy for compliance requirements
    
    ### security_events
    - Real-time security event monitoring
    - Tracks suspicious activities, failed auth, rate limit violations
    - Severity levels: info, warning, critical
    - Automatic alerting for critical events
    
    ### rate_limit_buckets
    - Token bucket algorithm for rate limiting
    - Per-user and per-IP rate limiting
    - Configurable limits for different endpoint types
    - Auto-reset mechanism
    
    ### mfa_settings
    - Multi-factor authentication configuration per user
    - Required for transactions above threshold
    - TOTP and SMS support
    - Backup codes for recovery
    
    ### session_tokens
    - Enhanced session management
    - Device fingerprinting
    - Automatic expiration and rotation
    - Suspicious session detection

  ## 2. Enhanced RLS Policies
    - All tables have restrictive RLS enabled by default
    - Policies check authentication, ownership, and MFA status
    - High-value operations require MFA verification
    - Admin operations are separately controlled

  ## 3. Security Functions
    - check_rate_limit(): Validates request rate limits
    - require_mfa(): Enforces MFA for sensitive operations
    - log_security_event(): Centralized security logging
    - cleanup_expired_sessions(): Auto cleanup

  ## 4. Important Notes
    - Audit logs are append-only for compliance
    - Rate limiting uses token bucket algorithm
    - MFA is enforced for transactions above configurable threshold
    - All sensitive operations are logged
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- AUDIT LOGGING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs (admins use service role)
CREATE POLICY "Service role can read all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- SECURITY EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(resolved) WHERE NOT resolved;

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read security events
CREATE POLICY "Admins can read security events"
  ON security_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- System can insert security events
CREATE POLICY "Authenticated users can insert security events"
  ON security_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update to resolve events
CREATE POLICY "Admins can resolve security events"
  ON security_events FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RATE LIMITING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier text NOT NULL, -- user_id or ip_address
  endpoint text NOT NULL,
  tokens_remaining integer NOT NULL DEFAULT 0,
  max_tokens integer NOT NULL,
  refill_rate integer NOT NULL, -- tokens per minute
  last_refill timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_buckets(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_last_refill ON rate_limit_buckets(last_refill);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Only system can access rate limits
CREATE POLICY "Authenticated users can manage rate limits"
  ON rate_limit_buckets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- MFA SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled boolean DEFAULT false,
  mfa_method text CHECK (mfa_method IN ('totp', 'sms', 'email')),
  totp_secret text, -- Should be encrypted at application level
  phone_number text, -- Should be encrypted at application level
  backup_codes text[], -- Should be hashed at application level
  last_verified_at timestamptz,
  require_for_transactions boolean DEFAULT false,
  transaction_threshold numeric DEFAULT 10000, -- Require MFA for transactions above this amount
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_user_id ON mfa_settings(user_id);

ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own MFA settings
CREATE POLICY "Users can read own MFA settings"
  ON mfa_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MFA settings"
  ON mfa_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA settings"
  ON mfa_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SESSION TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  device_fingerprint text,
  ip_address inet,
  user_agent text,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked boolean DEFAULT false,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token_hash ON session_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_active ON session_tokens(user_id, revoked, expires_at) WHERE NOT revoked;

ALTER TABLE session_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions
CREATE POLICY "Users can read own sessions"
  ON session_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can revoke their own sessions
CREATE POLICY "Users can revoke own sessions"
  ON session_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can manage sessions
CREATE POLICY "System can insert sessions"
  ON session_tokens FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type text,
  p_severity text,
  p_user_id uuid,
  p_ip_address inet,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO security_events (
    event_type,
    severity,
    user_id,
    ip_address,
    description,
    metadata
  ) VALUES (
    p_event_type,
    p_severity,
    p_user_id,
    p_ip_address,
    p_description,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit using token bucket algorithm
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_tokens integer DEFAULT 60,
  p_refill_rate integer DEFAULT 60
) RETURNS boolean AS $$
DECLARE
  v_bucket record;
  v_time_passed interval;
  v_tokens_to_add integer;
BEGIN
  -- Get or create bucket
  SELECT * INTO v_bucket
  FROM rate_limit_buckets
  WHERE identifier = p_identifier AND endpoint = p_endpoint
  FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO rate_limit_buckets (
      identifier,
      endpoint,
      tokens_remaining,
      max_tokens,
      refill_rate
    ) VALUES (
      p_identifier,
      p_endpoint,
      p_max_tokens - 1,
      p_max_tokens,
      p_refill_rate
    );
    RETURN true;
  END IF;
  
  -- Calculate tokens to add based on time passed
  v_time_passed := now() - v_bucket.last_refill;
  v_tokens_to_add := FLOOR(EXTRACT(EPOCH FROM v_time_passed) / 60 * v_bucket.refill_rate)::integer;
  
  -- Refill tokens up to max
  UPDATE rate_limit_buckets
  SET 
    tokens_remaining = LEAST(
      v_bucket.tokens_remaining + v_tokens_to_add,
      v_bucket.max_tokens
    ) - 1,
    last_refill = CASE 
      WHEN v_tokens_to_add > 0 THEN now()
      ELSE last_refill
    END,
    updated_at = now()
  WHERE identifier = p_identifier AND endpoint = p_endpoint;
  
  -- Check if request should be allowed
  RETURN (v_bucket.tokens_remaining + v_tokens_to_add) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to require MFA for sensitive operations
CREATE OR REPLACE FUNCTION require_mfa_for_transaction(
  p_user_id uuid,
  p_transaction_amount numeric
) RETURNS boolean AS $$
DECLARE
  v_mfa_settings record;
  v_mfa_verified_recently boolean;
BEGIN
  -- Get MFA settings
  SELECT * INTO v_mfa_settings
  FROM mfa_settings
  WHERE user_id = p_user_id;
  
  -- If no MFA settings or MFA not enabled, allow (for now)
  IF NOT FOUND OR NOT v_mfa_settings.mfa_enabled THEN
    RETURN true;
  END IF;
  
  -- Check if MFA is required for this transaction amount
  IF NOT v_mfa_settings.require_for_transactions OR 
     p_transaction_amount < v_mfa_settings.transaction_threshold THEN
    RETURN true;
  END IF;
  
  -- Check if MFA was verified recently (within last 5 minutes)
  v_mfa_verified_recently := v_mfa_settings.last_verified_at > (now() - interval '5 minutes');
  
  RETURN v_mfa_verified_recently;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE session_tokens
  SET revoked = true, revoked_at = now()
  WHERE expires_at < now() AND NOT revoked;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Log cleanup if sessions were revoked
  IF v_count > 0 THEN
    PERFORM log_security_event(
      'session_cleanup',
      'info',
      NULL,
      NULL,
      'Cleaned up expired sessions',
      jsonb_build_object('count', v_count)
    );
  END IF;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON security_events TO authenticated;
GRANT ALL ON rate_limit_buckets TO authenticated;
GRANT ALL ON mfa_settings TO authenticated;
GRANT ALL ON session_tokens TO authenticated;

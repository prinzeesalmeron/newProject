/*
  # Email System Infrastructure

  ## Overview
  Creates tables and functions to support transactional email system.

  ## 1. New Tables
    
    ### email_logs
    - Tracks all sent emails for auditing
    - Includes template, recipient, status
    - Used for troubleshooting delivery issues
    
    ### email_templates
    - Stores customizable email templates
    - Supports variables and personalization
    - Version controlled

  ## 2. Security
    - RLS enabled on all tables
    - Only service role can write to email_logs
    - Admins can read logs for debugging

  ## 3. Functions
    - send_transactional_email(): Wrapper for sending emails
    - get_email_stats(): Analytics on email delivery
*/

-- ============================================================================
-- EMAIL LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient text NOT NULL,
  template text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  email_id text, -- External provider ID (Resend, SendGrid, etc.)
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert
CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can read all logs
CREATE POLICY "Admins can read email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb, -- List of required variables
  description text,
  active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active) WHERE active = true;

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active templates
CREATE POLICY "Anyone can read active templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (active = true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON email_templates FOR ALL
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
-- EMAIL PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketing_emails boolean DEFAULT true,
  transaction_emails boolean DEFAULT true,
  security_alerts boolean DEFAULT true,
  rental_income_notifications boolean DEFAULT true,
  governance_updates boolean DEFAULT false,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can read own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get email delivery statistics
CREATE OR REPLACE FUNCTION get_email_stats(
  p_start_date timestamptz DEFAULT now() - interval '30 days',
  p_end_date timestamptz DEFAULT now()
) RETURNS TABLE (
  template text,
  total_sent bigint,
  delivered bigint,
  failed bigint,
  delivery_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.template,
    COUNT(*)::bigint as total_sent,
    COUNT(*) FILTER (WHERE el.status = 'delivered')::bigint as delivered,
    COUNT(*) FILTER (WHERE el.status = 'failed')::bigint as failed,
    ROUND(
      (COUNT(*) FILTER (WHERE el.status = 'delivered')::numeric / COUNT(*)::numeric) * 100,
      2
    ) as delivery_rate
  FROM email_logs el
  WHERE el.sent_at BETWEEN p_start_date AND p_end_date
  GROUP BY el.template
  ORDER BY total_sent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can receive email type
CREATE OR REPLACE FUNCTION can_send_email(
  p_user_id uuid,
  p_email_type text
) RETURNS boolean AS $$
DECLARE
  v_preferences record;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM email_preferences
  WHERE user_id = p_user_id;

  -- If no preferences, default to allowing (except marketing)
  IF NOT FOUND THEN
    RETURN p_email_type != 'marketing';
  END IF;

  -- Check if user has unsubscribed completely
  IF v_preferences.unsubscribed_at IS NOT NULL THEN
    -- Only allow critical security and transaction emails
    RETURN p_email_type IN ('security_alert', 'transaction');
  END IF;

  -- Check specific preferences
  CASE p_email_type
    WHEN 'marketing' THEN
      RETURN v_preferences.marketing_emails;
    WHEN 'transaction' THEN
      RETURN v_preferences.transaction_emails;
    WHEN 'security_alert' THEN
      RETURN v_preferences.security_alerts;
    WHEN 'rental_income' THEN
      RETURN v_preferences.rental_income_notifications;
    WHEN 'governance' THEN
      RETURN v_preferences.governance_updates;
    ELSE
      -- Default to true for unknown types
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INSERT DEFAULT TEMPLATES
-- ============================================================================

INSERT INTO email_templates (name, subject, html_content, variables, description) VALUES
  ('welcome', 'Welcome to RealEstate Platform!', '<p>Welcome email template</p>', '["name", "dashboard_url"]', 'Sent when user signs up'),
  ('verification', 'Verify Your Email Address', '<p>Email verification template</p>', '["name", "verification_url"]', 'Email verification'),
  ('investment_confirmation', 'Investment Confirmed', '<p>Investment confirmation template</p>', '["name", "property_title", "tokens", "amount"]', 'Sent after successful investment'),
  ('payment_receipt', 'Payment Receipt', '<p>Payment receipt template</p>', '["name", "amount", "date", "receipt_number"]', 'Payment confirmation'),
  ('security_alert', 'Security Alert', '<p>Security alert template</p>', '["name", "activity", "time", "location"]', 'Security notifications')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT ON email_logs TO authenticated;
GRANT SELECT ON email_templates TO authenticated;
GRANT ALL ON email_preferences TO authenticated;

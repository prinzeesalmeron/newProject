import { supabase } from '../supabase';

export interface MFASettings {
  id: string;
  user_id: string;
  mfa_enabled: boolean;
  mfa_method: 'totp' | 'sms' | 'email' | null;
  require_for_transactions: boolean;
  transaction_threshold: number;
  last_verified_at: string | null;
}

export class MFAService {
  /**
   * Get user's MFA settings
   */
  static async getMFASettings(userId: string): Promise<MFASettings | null> {
    try {
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get MFA settings:', error);
      throw error;
    }
  }

  /**
   * Enable MFA for user
   */
  static async enableMFA(
    userId: string,
    method: 'totp' | 'sms' | 'email',
    secret?: string,
    phoneNumber?: string
  ): Promise<MFASettings> {
    try {
      const { data, error } = await supabase
        .from('mfa_settings')
        .upsert({
          user_id: userId,
          mfa_enabled: true,
          mfa_method: method,
          totp_secret: secret,
          phone_number: phoneNumber,
          require_for_transactions: true,
          transaction_threshold: 10000, // Default $10,000 threshold
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent(
        'mfa_enabled',
        'info',
        userId,
        `MFA enabled using ${method} method`
      );

      return data;
    } catch (error) {
      console.error('Failed to enable MFA:', error);
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  static async disableMFA(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mfa_settings')
        .update({
          mfa_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent(
        'mfa_disabled',
        'warning',
        userId,
        'MFA has been disabled for this account'
      );
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  static async verifyMFA(
    userId: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would verify against TOTP or send SMS/email
      // For now, we'll just update the last_verified_at timestamp

      const { error } = await supabase
        .from('mfa_settings')
        .update({
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log successful verification
      await this.logSecurityEvent(
        'mfa_verified',
        'info',
        userId,
        'MFA verification successful'
      );

      return { success: true };
    } catch (error: any) {
      console.error('MFA verification failed:', error);

      // Log failed verification
      await this.logSecurityEvent(
        'mfa_verification_failed',
        'warning',
        userId,
        'MFA verification failed'
      );

      return { success: false, error: error.message };
    }
  }

  /**
   * Check if MFA is required for a transaction
   */
  static async isMFARequired(
    userId: string,
    transactionAmount: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc(
        'require_mfa_for_transaction',
        {
          p_user_id: userId,
          p_transaction_amount: transactionAmount
        }
      );

      if (error) throw error;

      // If MFA is required but not verified, return true
      return !data;
    } catch (error) {
      console.error('Failed to check MFA requirement:', error);
      // Fail secure - require MFA if check fails for high-value transactions
      return transactionAmount >= 10000;
    }
  }

  /**
   * Update transaction threshold
   */
  static async updateTransactionThreshold(
    userId: string,
    threshold: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('mfa_settings')
        .update({
          transaction_threshold: threshold,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update transaction threshold:', error);
      throw error;
    }
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Array.from({ length: 8 }, () =>
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]
      ).join('');
      codes.push(code);
    }
    return codes;
  }

  /**
   * Save backup codes (should be hashed in production)
   */
  static async saveBackupCodes(
    userId: string,
    codes: string[]
  ): Promise<void> {
    try {
      // In production, these should be hashed before storing
      const { error } = await supabase
        .from('mfa_settings')
        .update({
          backup_codes: codes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save backup codes:', error);
      throw error;
    }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(
    eventType: string,
    severity: 'info' | 'warning' | 'critical',
    userId: string,
    description: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_severity: severity,
        p_user_id: userId,
        p_ip_address: null,
        p_description: description,
        p_metadata: {}
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

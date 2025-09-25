import { supabase } from '../supabase';
import { DatabaseService } from '../database';

export interface SecurityEvent {
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'csrf_detected';
  user_id?: string;
  ip_address: string;
  user_agent: string;
  metadata: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

/**
 * Security Service - Handles rate limiting, CSRF protection, and security monitoring
 */
export class SecurityService {
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private static csrfTokens = new Map<string, { token: string; expires: number }>();

  /**
   * Rate limiting implementation
   */
  static checkRateLimit(
    identifier: string,
    config: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    let record = this.rateLimitStore.get(key);
    
    // Reset if window has expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }
    
    record.count++;
    this.rateLimitStore.set(key, record);
    
    const allowed = record.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - record.count);
    
    if (!allowed) {
      this.recordSecurityEvent({
        type: 'rate_limit_exceeded',
        ip_address: identifier,
        user_agent: 'unknown',
        metadata: { requests: record.count, limit: config.maxRequests },
        severity: 'medium'
      });
    }
    
    return {
      allowed,
      remaining,
      resetTime: record.resetTime
    };
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(sessionId: string): string {
    const token = this.generateSecureToken(32);
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour
    
    this.csrfTokens.set(sessionId, { token, expires });
    
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(sessionId: string, token: string): boolean {
    const record = this.csrfTokens.get(sessionId);
    
    if (!record) {
      this.recordSecurityEvent({
        type: 'csrf_detected',
        ip_address: 'unknown',
        user_agent: 'unknown',
        metadata: { session_id: sessionId, provided_token: token },
        severity: 'high'
      });
      return false;
    }
    
    if (Date.now() > record.expires) {
      this.csrfTokens.delete(sessionId);
      return false;
    }
    
    const isValid = record.token === token;
    
    if (!isValid) {
      this.recordSecurityEvent({
        type: 'csrf_detected',
        ip_address: 'unknown',
        user_agent: 'unknown',
        metadata: { session_id: sessionId, expected: record.token, provided: token },
        severity: 'high'
      });
    }
    
    return isValid;
  }

  /**
   * Encrypt sensitive data
   */
  static async encryptData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate a random key for this encryption
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Export the key
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    
    // Combine key, IV, and encrypted data
    const combined = new Uint8Array(exportedKey.byteLength + iv.length + encrypted.byteLength);
    combined.set(new Uint8Array(exportedKey), 0);
    combined.set(iv, exportedKey.byteLength);
    combined.set(new Uint8Array(encrypted), exportedKey.byteLength + iv.length);
    
    // Return as base64
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt sensitive data
   */
  static async decryptData(encryptedData: string): Promise<string> {
    try {
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract key, IV, and encrypted data
      const keyData = combined.slice(0, 32);
      const iv = combined.slice(32, 44);
      const encrypted = combined.slice(44);
      
      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
      
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Validate payment card (PCI compliance)
   */
  static validatePaymentCard(cardNumber: string): {
    valid: boolean;
    type: string;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Remove spaces and non-digits
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Check length
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.push('Invalid card number length');
    }
    
    // Luhn algorithm validation
    if (!this.luhnCheck(cleanNumber)) {
      errors.push('Invalid card number');
    }
    
    // Determine card type
    const cardType = this.getCardType(cleanNumber);
    
    return {
      valid: errors.length === 0,
      type: cardType,
      errors
    };
  }

  /**
   * Record security event
   */
  static async recordSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      if (supabase) {
        await supabase
          .from('security_events')
          .insert([{
            event_type: event.type,
            user_id: event.user_id,
            ip_address: event.ip_address,
            user_agent: event.user_agent,
            metadata: event.metadata,
            severity: event.severity,
            created_at: new Date().toISOString()
          }]);
      }

      // Log to console for development
      console.log('Security Event:', event);

      // Alert on critical events
      if (event.severity === 'critical') {
        await this.alertSecurityTeam(event);
      }

    } catch (error) {
      console.error('Failed to record security event:', error);
    }
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Common patterns
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Avoid repeating characters');

    return {
      score,
      feedback,
      isStrong: score >= 5
    };
  }

  /**
   * Detect suspicious activity patterns
   */
  static async detectSuspiciousActivity(
    userId: string,
    activityType: string,
    metadata: any
  ): Promise<{ suspicious: boolean; risk_score: number; reasons: string[] }> {
    try {
      const reasons: string[] = [];
      let riskScore = 0;

      // Check for rapid successive actions
      const recentActivity = await this.getRecentUserActivity(userId, activityType);
      if (recentActivity.length > 10) {
        reasons.push('Unusually high activity frequency');
        riskScore += 30;
      }

      // Check for unusual amounts
      if (metadata.amount && metadata.amount > 100000) {
        reasons.push('Large transaction amount');
        riskScore += 20;
      }

      // Check for new device/location
      if (metadata.new_device) {
        reasons.push('Activity from new device');
        riskScore += 15;
      }

      // Check for off-hours activity
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        reasons.push('Activity during unusual hours');
        riskScore += 10;
      }

      return {
        suspicious: riskScore >= 50,
        risk_score: riskScore,
        reasons
      };

    } catch (error) {
      console.error('Suspicious activity detection failed:', error);
      return { suspicious: false, risk_score: 0, reasons: [] };
    }
  }

  // Private helper methods
  private static luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  private static getCardType(cardNumber: string): string {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      diners: /^3[0689]/,
      jcb: /^35/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type;
      }
    }

    return 'unknown';
  }

  private static async getRecentUserActivity(userId: string, activityType: string): Promise<any[]> {
    if (!supabase) return [];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action', activityType)
      .gte('created_at', oneHourAgo);

    return data || [];
  }

  private static async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    // In production, integrate with alerting systems
    console.error('CRITICAL SECURITY EVENT:', event);
    
    // Send to security team via email/Slack/PagerDuty
    // await sendSecurityAlert(event);
  }

  /**
   * Record system health metrics
   */
  static recordHealthMetric(
    metric: string,
    value: number,
    unit: string = 'count'
  ): void {
    // In production, send to monitoring service
    console.log(`Health Metric: ${metric} = ${value} ${unit}`);
  }
}
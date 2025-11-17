import { supabase } from '../supabase';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  user_id: string | null;
  ip_address: string | null;
  description: string;
  metadata: any;
  resolved: boolean;
  created_at: string;
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async logAudit(params: {
    action: string;
    resourceType: string;
    resourceId?: string;
    oldData?: any;
    newData?: any;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id || null;

      const { error } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId || null,
        old_data: params.oldData || null,
        new_data: params.newData || null,
        ip_address: null, // Client-side doesn't have access to real IP
        user_agent: navigator.userAgent,
        success: params.success !== undefined ? params.success : true,
        error_message: params.errorMessage || null
      });

      if (error && error.code !== '42501') {
        // Ignore permission errors (RLS)
        console.error('Failed to log audit:', error);
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Log a security event
   */
  static async logSecurityEvent(params: {
    eventType: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
    metadata?: any;
  }): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id || null;

      await supabase.rpc('log_security_event', {
        p_event_type: params.eventType,
        p_severity: params.severity,
        p_user_id: userId,
        p_ip_address: null,
        p_description: params.description,
        p_metadata: params.metadata || {}
      });
    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  }

  /**
   * Log transaction
   */
  static async logTransaction(params: {
    transactionId: string;
    amount: number;
    type: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.logAudit({
      action: 'transaction',
      resourceType: 'payment',
      resourceId: params.transactionId,
      newData: {
        amount: params.amount,
        type: params.type
      },
      success: params.success,
      errorMessage: params.errorMessage
    });

    if (params.success) {
      await this.logSecurityEvent({
        eventType: 'transaction_completed',
        severity: 'info',
        description: `Transaction completed: ${params.type} - $${params.amount}`,
        metadata: { transaction_id: params.transactionId }
      });
    } else {
      await this.logSecurityEvent({
        eventType: 'transaction_failed',
        severity: 'warning',
        description: `Transaction failed: ${params.errorMessage}`,
        metadata: { transaction_id: params.transactionId }
      });
    }
  }

  /**
   * Log authentication event
   */
  static async logAuth(params: {
    action: 'login' | 'logout' | 'signup' | 'password_reset';
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.logAudit({
      action: params.action,
      resourceType: 'auth',
      success: params.success,
      errorMessage: params.errorMessage
    });

    if (!params.success) {
      await this.logSecurityEvent({
        eventType: `auth_${params.action}_failed`,
        severity: 'warning',
        description: `Authentication ${params.action} failed: ${params.errorMessage}`,
        metadata: { action: params.action }
      });
    }
  }

  /**
   * Log data access
   */
  static async logDataAccess(params: {
    resourceType: string;
    resourceId: string;
    action: 'read' | 'create' | 'update' | 'delete';
  }): Promise<void> {
    await this.logAudit({
      action: `${params.action}_${params.resourceType}`,
      resourceType: params.resourceType,
      resourceId: params.resourceId
    });
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(params: {
    description: string;
    metadata?: any;
  }): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'suspicious_activity',
      severity: 'critical',
      description: params.description,
      metadata: params.metadata
    });
  }

  /**
   * Detect anomalies in user behavior
   */
  static async detectAnomalies(userId: string): Promise<{
    hasAnomalies: boolean;
    anomalies: string[];
  }> {
    try {
      // Get recent user activity
      const { data: recentLogs, error } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order('created_at', { ascending: false });

      if (error) throw error;

      const anomalies: string[] = [];

      // Check for rapid transaction attempts
      const transactionCount = recentLogs?.filter(log =>
        log.action.includes('transaction')
      ).length || 0;

      if (transactionCount > 10) {
        anomalies.push('Excessive transaction attempts detected');
      }

      // Check for multiple failed auth attempts
      const failedAuthCount = recentLogs?.filter(log =>
        log.action.includes('login') && !log.success
      ).length || 0;

      if (failedAuthCount > 5) {
        anomalies.push('Multiple failed authentication attempts');
      }

      // Log if anomalies detected
      if (anomalies.length > 0) {
        await this.logSuspiciousActivity({
          description: `Anomalies detected for user: ${anomalies.join(', ')}`,
          metadata: { user_id: userId, anomalies }
        });
      }

      return {
        hasAnomalies: anomalies.length > 0,
        anomalies
      };
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return { hasAnomalies: false, anomalies: [] };
    }
  }

  /**
   * Get audit logs (admin only)
   */
  static async getAuditLogs(params: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.userId) {
        query = query.eq('user_id', params.userId);
      }

      if (params.action) {
        query = query.eq('action', params.action);
      }

      if (params.resourceType) {
        query = query.eq('resource_type', params.resourceType);
      }

      if (params.startDate) {
        query = query.gte('created_at', params.startDate);
      }

      if (params.endDate) {
        query = query.lte('created_at', params.endDate);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get security events (admin only)
   */
  static async getSecurityEvents(params: {
    severity?: 'info' | 'warning' | 'critical';
    resolved?: boolean;
    limit?: number;
  }): Promise<SecurityEvent[]> {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.severity) {
        query = query.eq('severity', params.severity);
      }

      if (params.resolved !== undefined) {
        query = query.eq('resolved', params.resolved);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }
}

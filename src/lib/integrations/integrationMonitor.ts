import { supabase } from '../supabase';

/**
 * Integration Monitoring Service
 * Monitors health and performance of all third-party integrations
 */

export interface IntegrationHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastChecked: string;
  lastError?: string;
  uptime: number;
}

export interface IntegrationMetrics {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  rateLimitHits: number;
  lastHour: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
  last24Hours: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}

export class IntegrationMonitorService {
  private static readonly CHECK_INTERVAL = 60000; // 1 minute
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static metrics: Map<string, IntegrationMetrics> = new Map();

  /**
   * Start monitoring all integrations
   */
  static startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllIntegrations();
    }, this.CHECK_INTERVAL);

    // Run initial check
    this.checkAllIntegrations();
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check health of all integrations
   */
  static async checkAllIntegrations(): Promise<IntegrationHealth[]> {
    const integrations = [
      { name: 'persona', check: () => this.checkPersona() },
      { name: 'stripe', check: () => this.checkStripe() },
      { name: 'resend', check: () => this.checkResend() },
      { name: 'coingecko', check: () => this.checkCoinGecko() },
      { name: 'zillow', check: () => this.checkZillow() }
    ];

    const results = await Promise.allSettled(
      integrations.map(async ({ name, check }) => {
        const startTime = Date.now();
        try {
          await check();
          const responseTime = Date.now() - startTime;

          const health: IntegrationHealth = {
            provider: name,
            status: responseTime > 5000 ? 'degraded' : 'healthy',
            responseTime,
            errorRate: await this.getErrorRate(name),
            lastChecked: new Date().toISOString(),
            uptime: await this.getUptime(name)
          };

          await this.recordHealthCheck(health);
          return health;
        } catch (error: any) {
          const health: IntegrationHealth = {
            provider: name,
            status: 'down',
            responseTime: Date.now() - startTime,
            errorRate: 100,
            lastChecked: new Date().toISOString(),
            lastError: error.message,
            uptime: await this.getUptime(name)
          };

          await this.recordHealthCheck(health);
          await this.alertOnFailure(name, error.message);
          return health;
        }
      })
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<IntegrationHealth>).value);
  }

  /**
   * Get integration metrics
   */
  static async getIntegrationMetrics(provider: string): Promise<IntegrationMetrics> {
    const cached = this.metrics.get(provider);
    if (cached) return cached;

    const { data: logs } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('provider', provider)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const total = logs?.length || 0;
    const successful = logs?.filter(l => !l.error).length || 0;
    const failed = total - successful;

    const lastHour = logs?.filter(l =>
      new Date(l.created_at).getTime() > Date.now() - 60 * 60 * 1000
    ) || [];

    const metrics: IntegrationMetrics = {
      provider,
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: 0,
      errorRate: total > 0 ? (failed / total) * 100 : 0,
      rateLimitHits: 0,
      lastHour: {
        requests: lastHour.length,
        errors: lastHour.filter(l => l.error).length,
        avgResponseTime: 0
      },
      last24Hours: {
        requests: total,
        errors: failed,
        avgResponseTime: 0
      }
    };

    this.metrics.set(provider, metrics);
    return metrics;
  }

  /**
   * Record API request for monitoring
   */
  static async recordAPIRequest(
    provider: string,
    endpoint: string,
    success: boolean,
    responseTime: number,
    error?: string
  ): Promise<void> {
    try {
      await supabase
        .from('webhook_events')
        .insert({
          provider,
          event_type: 'api_request',
          event_id: `${provider}_${endpoint}_${Date.now()}`,
          payload: {
            endpoint,
            success,
            response_time: responseTime,
            error
          },
          verified: true,
          processed: true,
          processed_at: new Date().toISOString(),
          error: success ? null : error
        });

      // Update cached metrics
      const metrics = await this.getIntegrationMetrics(provider);
      metrics.totalRequests++;
      if (success) {
        metrics.successfulRequests++;
      } else {
        metrics.failedRequests++;
      }
      metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
      this.metrics.set(provider, metrics);
    } catch (err) {
      console.error('Failed to record API request:', err);
    }
  }

  /**
   * Check if API rate limit allows request
   */
  static async checkRateLimit(
    provider: string,
    endpoint: string,
    limit: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_api_rate_limit', {
        p_provider: provider,
        p_endpoint: endpoint,
        p_limit: limit
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow request on error
    }
  }

  /**
   * Get integration dashboard data
   */
  static async getDashboardData(): Promise<{
    integrations: IntegrationHealth[];
    totalRequests: number;
    totalErrors: number;
    averageUptime: number;
    criticalAlerts: number;
  }> {
    const integrations = await this.checkAllIntegrations();

    const totalRequests = Array.from(this.metrics.values())
      .reduce((sum, m) => sum + m.totalRequests, 0);

    const totalErrors = Array.from(this.metrics.values())
      .reduce((sum, m) => sum + m.failedRequests, 0);

    const averageUptime = integrations
      .reduce((sum, i) => sum + i.uptime, 0) / integrations.length;

    const criticalAlerts = integrations
      .filter(i => i.status === 'down').length;

    return {
      integrations,
      totalRequests,
      totalErrors,
      averageUptime,
      criticalAlerts
    };
  }

  // Private helper methods

  private static async checkPersona(): Promise<void> {
    const apiKey = import.meta.env.VITE_PERSONA_API_KEY;
    if (!apiKey) return;

    const response = await fetch('https://withpersona.com/api/v1/inquiries?page[size]=1', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Persona-Version': '2023-01-05'
      }
    });

    if (!response.ok) {
      throw new Error(`Persona API error: ${response.status}`);
    }
  }

  private static async checkStripe(): Promise<void> {
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publicKey) return;

    // Simple connectivity check
    const response = await fetch('https://api.stripe.com/healthcheck');
    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status}`);
    }
  }

  private static async checkResend(): Promise<void> {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (!apiKey) return;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Resend API error: ${response.status}`);
    }
  }

  private static async checkCoinGecko(): Promise<void> {
    const response = await fetch('https://api.coingecko.com/api/v3/ping');
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
  }

  private static async checkZillow(): Promise<void> {
    // Zillow/property APIs don't have a simple health check
    // We'll just verify the API key is configured
    if (!import.meta.env.VITE_ZILLOW_API_KEY) {
      throw new Error('Zillow API key not configured');
    }
  }

  private static async getErrorRate(provider: string): Promise<number> {
    const { data } = await supabase
      .from('webhook_events')
      .select('error')
      .eq('provider', provider)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0;

    const errors = data.filter(d => d.error).length;
    return (errors / data.length) * 100;
  }

  private static async getUptime(provider: string): Promise<number> {
    const { data } = await supabase
      .from('webhook_events')
      .select('error')
      .eq('provider', provider)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 100;

    const successful = data.filter(d => !d.error).length;
    return (successful / data.length) * 100;
  }

  private static async recordHealthCheck(health: IntegrationHealth): Promise<void> {
    try {
      await supabase
        .from('webhook_events')
        .insert({
          provider: health.provider,
          event_type: 'health_check',
          event_id: `health_${health.provider}_${Date.now()}`,
          payload: {
            status: health.status,
            response_time: health.responseTime,
            error_rate: health.errorRate,
            uptime: health.uptime
          },
          verified: true,
          processed: true,
          processed_at: new Date().toISOString(),
          error: health.lastError
        });
    } catch (error) {
      console.error('Failed to record health check:', error);
    }
  }

  private static async alertOnFailure(provider: string, error: string): Promise<void> {
    try {
      await supabase
        .from('security_events')
        .insert({
          event_type: 'integration_failure',
          severity: 'critical',
          description: `${provider} integration is down`,
          metadata: {
            provider,
            error,
            timestamp: new Date().toISOString()
          }
        });

      console.error(`ALERT: ${provider} integration failure:`, error);
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  }
}

/**
 * Decorator for monitoring API calls
 */
export function monitoredAPICall(provider: string, endpoint: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const responseTime = Date.now() - startTime;

        await IntegrationMonitorService.recordAPIRequest(
          provider,
          endpoint,
          true,
          responseTime
        );

        return result;
      } catch (error: any) {
        const responseTime = Date.now() - startTime;

        await IntegrationMonitorService.recordAPIRequest(
          provider,
          endpoint,
          false,
          responseTime,
          error.message
        );

        throw error;
      }
    };

    return descriptor;
  };
}

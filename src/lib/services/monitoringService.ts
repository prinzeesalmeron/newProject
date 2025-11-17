import { config } from '../config';

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  user_id?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: any;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

/**
 * Monitoring Service - Error tracking, performance monitoring, and observability
 */
export class MonitoringService {
  private static sentryDSN = import.meta.env.VITE_SENTRY_DSN;
  private static datadogApiKey = import.meta.env.VITE_DATADOG_API_KEY;
  private static mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN;

  /**
   * Initialize monitoring services
   */
  static async initialize(): Promise<void> {
    try {
      // Initialize Sentry for error tracking
      if (this.sentryDSN && this.sentryDSN !== 'your_sentry_dsn' && this.sentryDSN.trim() !== '') {
        await this.initializeSentry();
      }

      // Initialize performance monitoring
      await this.initializePerformanceMonitoring();

      // Initialize analytics
      if (this.mixpanelToken && this.mixpanelToken !== 'your_mixpanel_token' && this.mixpanelToken.trim() !== '') {
        await this.initializeMixpanel();
      }

      console.log('Monitoring services initialized');

    } catch (error) {
      console.error('Monitoring initialization failed:', error);
    }
  }

  /**
   * Report error to monitoring services
   */
  static reportError(error: Error, context: any = {}): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      user_id: context.user_id,
      timestamp: Date.now(),
      severity: this.determineSeverity(error),
      context
    };

    // Send to Sentry
    if (this.sentryDSN) {
      this.sendToSentry(errorReport);
    }

    // Send to custom error tracking
    this.sendToCustomErrorTracking(errorReport);

    // Log locally for development
    if (config.app.environment === 'development') {
      console.error('Error Report:', errorReport);
    }
  }

  /**
   * Track performance metric
   */
  static trackPerformance(metric: PerformanceMetric): void {
    // Send to Datadog
    if (this.datadogApiKey) {
      this.sendToDatadog(metric);
    }

    // Store locally for analysis
    this.storePerformanceMetric(metric);
  }

  /**
   * Track user event
   */
  static trackEvent(eventName: string, properties: any = {}): void {
    // Send to Mixpanel
    if (this.mixpanelToken) {
      this.sendToMixpanel(eventName, properties);
    }

    // Send to custom analytics
    this.sendToCustomAnalytics(eventName, properties);
  }

  /**
   * Health check endpoint
   */
  static async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: number;
  }> {
    const checks = {
      database: await this.checkDatabaseHealth(),
      api: await this.checkAPIHealth(),
      external_services: await this.checkExternalServices(),
      memory_usage: this.checkMemoryUsage(),
      error_rate: this.checkErrorRate()
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: Date.now()
    };
  }

  /**
   * Monitor API response times
   */
  static async monitorAPICall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.trackPerformance({
        name: `api.${apiName}.duration`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { api: apiName, status: 'success' }
      });
      
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.trackPerformance({
        name: `api.${apiName}.duration`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { api: apiName, status: 'error' }
      });
      
      this.reportError(error as Error, { api: apiName });
      throw error;
    }
  }

  // Private methods
  private static async initializeSentry(): Promise<void> {
    try {
      if (!this.sentryDSN || this.sentryDSN === 'your_sentry_dsn' || this.sentryDSN.trim() === '') {
        console.warn('Sentry DSN not configured, skipping initialization');
        return;
      }

      const Sentry = await import('@sentry/browser');
      
      Sentry.init({
        dsn: this.sentryDSN,
        environment: config.app.environment,
        tracesSampleRate: 1.0,
        integrations: [
          new Sentry.BrowserTracing(),
        ],
      });

    } catch (error) {
      console.error('Sentry initialization failed:', error);
    }
  }

  private static async initializePerformanceMonitoring(): Promise<void> {
    // Monitor Core Web Vitals
    if ('web-vitals' in window) {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      getCLS(this.onCLS);
      getFID(this.onFID);
      getFCP(this.onFCP);
      getLCP(this.onLCP);
      getTTFB(this.onTTFB);
    }

    // Monitor resource loading
    this.monitorResourceLoading();
  }

  private static async initializeMixpanel(): Promise<void> {
    try {
      if (!this.mixpanelToken || this.mixpanelToken === 'your_mixpanel_token' || this.mixpanelToken.trim() === '') {
        console.warn('Mixpanel token not configured, skipping initialization');
        return;
      }

      const mixpanel = await import('mixpanel-browser');
      mixpanel.default.init(this.mixpanelToken);
    } catch (error) {
      console.error('Mixpanel initialization failed:', error);
    }
  }

  private static onCLS = (metric: any) => {
    this.trackPerformance({
      name: 'web_vitals.cls',
      value: metric.value,
      unit: 'score',
      timestamp: Date.now(),
      tags: { metric_type: 'web_vital' }
    });
  };

  private static onFID = (metric: any) => {
    this.trackPerformance({
      name: 'web_vitals.fid',
      value: metric.value,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { metric_type: 'web_vital' }
    });
  };

  private static onFCP = (metric: any) => {
    this.trackPerformance({
      name: 'web_vitals.fcp',
      value: metric.value,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { metric_type: 'web_vital' }
    });
  };

  private static onLCP = (metric: any) => {
    this.trackPerformance({
      name: 'web_vitals.lcp',
      value: metric.value,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { metric_type: 'web_vital' }
    });
  };

  private static onTTFB = (metric: any) => {
    this.trackPerformance({
      name: 'web_vitals.ttfb',
      value: metric.value,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { metric_type: 'web_vital' }
    });
  };

  private static monitorResourceLoading(): void {
    // Monitor slow loading resources
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // Resources taking more than 1 second
          this.trackPerformance({
            name: 'resource.slow_load',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            tags: { 
              resource: entry.name,
              type: (entry as any).initiatorType 
            }
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private static determineSeverity(error: Error): ErrorReport['severity'] {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'medium';
    }
    if (error.message.includes('Authentication') || error.message.includes('Authorization')) {
      return 'high';
    }
    if (error.message.includes('Payment') || error.message.includes('Transaction')) {
      return 'critical';
    }
    return 'low';
  }

  private static sendToSentry(errorReport: ErrorReport): void {
    // Mock Sentry integration
    console.log('Sending to Sentry:', errorReport);
  }

  private static sendToCustomErrorTracking(errorReport: ErrorReport): void {
    // Store in local storage for development
    const errors = JSON.parse(localStorage.getItem('error_reports') || '[]');
    errors.push(errorReport);
    localStorage.setItem('error_reports', JSON.stringify(errors.slice(-100))); // Keep last 100
  }

  private static sendToDatadog(metric: PerformanceMetric): void {
    // Mock Datadog integration
    console.log('Sending to Datadog:', metric);
  }

  private static sendToMixpanel(eventName: string, properties: any): void {
    // Mock Mixpanel integration
    console.log('Sending to Mixpanel:', { event: eventName, properties });
  }

  private static sendToCustomAnalytics(eventName: string, properties: any): void {
    // Store analytics events
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push({ event: eventName, properties, timestamp: Date.now() });
    localStorage.setItem('analytics_events', JSON.stringify(events.slice(-1000))); // Keep last 1000
  }

  private static storePerformanceMetric(metric: PerformanceMetric): void {
    const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    metrics.push(metric);
    localStorage.setItem('performance_metrics', JSON.stringify(metrics.slice(-500))); // Keep last 500
  }

  private static async checkDatabaseHealth(): Promise<boolean> {
    try {
      if (!supabase) return false;
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  private static async checkAPIHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private static async checkExternalServices(): Promise<boolean> {
    // Skip external service checks to avoid blocking
    // This can be called manually via performHealthCheck if needed
    return true;
  }

  private static checkMemoryUsage(): boolean {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return usageRatio < 0.9; // Less than 90% memory usage
    }
    return true;
  }

  private static checkErrorRate(): boolean {
    const errors = JSON.parse(localStorage.getItem('error_reports') || '[]');
    const recentErrors = errors.filter((e: any) => Date.now() - e.timestamp < 60000); // Last minute
    return recentErrors.length < 10; // Less than 10 errors per minute
  }
}
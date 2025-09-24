import { SecurityService } from './securityService';
import { CacheService } from './cacheService';

export interface PerformanceMetrics {
  page_load_time: number;
  api_response_time: number;
  database_query_time: number;
  cache_hit_rate: number;
  error_rate: number;
  user_satisfaction: number;
}

/**
 * Performance Service - Monitors and optimizes application performance
 */
export class PerformanceService {
  private static metrics: Map<string, number[]> = new Map();

  /**
   * Record performance metric
   */
  static recordMetric(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const values = this.metrics.get(metricName)!;
    values.push(value);

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }

    // Record in system health if significant
    if (this.isSignificantMetric(metricName, value)) {
      SecurityService.recordHealthMetric(metricName, value, this.getMetricUnit(metricName));
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(metricName: string): {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    const values = this.metrics.get(metricName) || [];
    
    if (values.length === 0) {
      return { average: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      average: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Monitor API performance
   */
  static async monitorApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.recordMetric(`api_${apiName}_duration`, duration);
      this.recordMetric('api_success_rate', 1);
      
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(`api_${apiName}_duration`, duration);
      this.recordMetric('api_error_rate', 1);
      
      throw error;
    }
  }

  /**
   * Monitor database query performance
   */
  static async monitorDatabaseQuery<T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await query();
      const duration = performance.now() - startTime;
      
      this.recordMetric(`db_${queryName}_duration`, duration);
      
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(`db_${queryName}_error`, duration);
      
      throw error;
    }
  }

  /**
   * Optimize images for performance
   */
  static optimizeImageUrl(
    originalUrl: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    // In production, integrate with image optimization service (Cloudinary, ImageKit, etc.)
    if (originalUrl.includes('pexels.com')) {
      // Pexels supports query parameters for optimization
      const url = new URL(originalUrl);
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('cs', 'tinysrgb');
      return url.toString();
    }

    return originalUrl;
  }

  /**
   * Preload critical resources
   */
  static preloadCriticalResources(): void {
    // Preload critical CSS
    const criticalCSS = document.createElement('link');
    criticalCSS.rel = 'preload';
    criticalCSS.as = 'style';
    criticalCSS.href = '/src/index.css';
    document.head.appendChild(criticalCSS);

    // Preload critical fonts
    const font = document.createElement('link');
    font.rel = 'preload';
    font.as = 'font';
    font.type = 'font/woff2';
    font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    font.crossOrigin = 'anonymous';
    document.head.appendChild(font);

    // Preload critical API endpoints
    this.prefetchCriticalData();
  }

  /**
   * Prefetch critical data
   */
  static async prefetchCriticalData(): Promise<void> {
    try {
      // Prefetch properties data
      const propertiesPromise = CacheService.cachedApiCall(
        'properties_list',
        () => fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/properties`).then(r => r.json()),
        10 * 60 * 1000, // 10 minutes
        ['properties']
      );

      // Prefetch staking pools
      const stakingPromise = CacheService.cachedApiCall(
        'staking_pools',
        () => fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/staking-pools`).then(r => r.json()),
        15 * 60 * 1000, // 15 minutes
        ['staking']
      );

      await Promise.all([propertiesPromise, stakingPromise]);

    } catch (error) {
      console.error('Critical data prefetch failed:', error);
    }
  }

  /**
   * Implement lazy loading for images
   */
  static setupLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Bundle splitting and code splitting optimization
   */
  static async loadComponentDynamically<T>(
    componentLoader: () => Promise<{ default: T }>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const module = await componentLoader();
      const loadTime = performance.now() - startTime;
      
      this.recordMetric('component_load_time', loadTime);
      
      return module.default;

    } catch (error) {
      console.error('Dynamic component loading failed:', error);
      throw error;
    }
  }

  /**
   * Database connection pooling simulation
   */
  static async optimizeDatabaseQueries(): Promise<void> {
    // In production, implement actual connection pooling
    console.log('Database query optimization active');
    
    // Batch similar queries
    // Implement query result caching
    // Use read replicas for read-heavy operations
  }

  /**
   * CDN integration for static assets
   */
  static getCDNUrl(assetPath: string): string {
    const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL;
    
    if (CDN_BASE_URL) {
      return `${CDN_BASE_URL}${assetPath}`;
    }
    
    return assetPath;
  }

  // Private helper methods
  private static isSignificantMetric(metricName: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'page_load_time': 3000, // 3 seconds
      'api_response_time': 1000, // 1 second
      'database_query_time': 500, // 500ms
      'error_rate': 5 // 5%
    };

    return value > (thresholds[metricName] || 1000);
  }

  private static getMetricUnit(metricName: string): string {
    if (metricName.includes('time') || metricName.includes('duration')) {
      return 'ms';
    }
    if (metricName.includes('rate')) {
      return '%';
    }
    if (metricName.includes('size')) {
      return 'bytes';
    }
    return 'count';
  }
}
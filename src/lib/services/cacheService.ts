/**
 * Cache Service - Intelligent caching for API responses and data
 */
export class CacheService {
  private static cache = new Map<string, { data: any; expires: number; tags: string[] }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data
   */
  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cached data
   */
  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL, tags: string[] = []): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      tags
    });
  }

  /**
   * Invalidate cache by key
   */
  static invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache by tags
   */
  static invalidateByTags(tags: string[]): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Cached API call wrapper
   */
  static async cachedApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    tags: string[] = []
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Make API call
    const data = await apiCall();
    
    // Cache the result
    this.set(key, data, ttl, tags);
    
    return data;
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const size = this.cache.size;
    const memoryUsage = JSON.stringify([...this.cache.entries()]).length;
    
    return {
      size,
      hitRate: 0, // Would track hits/misses in production
      memoryUsage
    };
  }
}
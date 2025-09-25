import { SecurityService } from '../services/securityService';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

/**
 * Rate limiting middleware for API protection
 */
export class RateLimitMiddleware {
  private static defaultOptions: Required<RateLimitOptions> = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip || 'unknown'
  };

  /**
   * Create rate limit middleware
   */
  static create(options: RateLimitOptions = {}) {
    const config = { ...this.defaultOptions, ...options };

    return async (req: any, res: any, next: any) => {
      try {
        const key = config.keyGenerator(req);
        const rateLimitResult = SecurityService.checkRateLimit(key, {
          windowMs: config.windowMs,
          maxRequests: config.maxRequests,
          skipSuccessfulRequests: config.skipSuccessfulRequests,
          skipFailedRequests: config.skipFailedRequests
        });

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

        if (!rateLimitResult.allowed) {
          return res.status(429).json({
            error: config.message,
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          });
        }

        next();

      } catch (error) {
        console.error('Rate limit middleware error:', error);
        next();
      }
    };
  }

  /**
   * API-specific rate limits
   */
  static apiLimits = {
    // Authentication endpoints
    auth: this.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 login attempts per 15 minutes
      message: 'Too many authentication attempts'
    }),

    // Investment endpoints
    investment: this.create({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 investments per minute
      message: 'Too many investment requests'
    }),

    // General API
    general: this.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // 1000 requests per 15 minutes
      message: 'Rate limit exceeded'
    }),

    // File uploads
    upload: this.create({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 uploads per minute
      message: 'Too many file uploads'
    })
  };
}
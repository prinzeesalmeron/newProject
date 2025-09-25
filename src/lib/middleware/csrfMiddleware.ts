import { SecurityService } from '../services/securityService';

/**
 * CSRF Protection Middleware
 */
export class CSRFMiddleware {
  private static readonly CSRF_HEADER = 'X-CSRF-Token';
  private static readonly CSRF_COOKIE = 'csrf_token';

  /**
   * Generate CSRF token for session
   */
  static generateToken(sessionId: string): string {
    return SecurityService.generateCSRFToken(sessionId);
  }

  /**
   * Validate CSRF token
   */
  static validateToken(sessionId: string, token: string): boolean {
    return SecurityService.validateCSRFToken(sessionId, token);
  }

  /**
   * CSRF protection middleware
   */
  static protect() {
    return async (req: any, res: any, next: any) => {
      try {
        // Skip CSRF for safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return next();
        }

        const sessionId = req.sessionId || req.headers['x-session-id'];
        if (!sessionId) {
          return res.status(403).json({ error: 'Session required' });
        }

        const token = req.headers[this.CSRF_HEADER.toLowerCase()] || 
                     req.body?.csrf_token ||
                     req.cookies?.[this.CSRF_COOKIE];

        if (!token) {
          return res.status(403).json({ error: 'CSRF token required' });
        }

        if (!this.validateToken(sessionId, token)) {
          return res.status(403).json({ error: 'Invalid CSRF token' });
        }

        next();

      } catch (error) {
        console.error('CSRF middleware error:', error);
        res.status(500).json({ error: 'CSRF validation failed' });
      }
    };
  }

  /**
   * Set CSRF token in response
   */
  static setToken(res: any, sessionId: string): void {
    const token = this.generateToken(sessionId);
    
    // Set as header
    res.setHeader(this.CSRF_HEADER, token);
    
    // Set as cookie
    res.cookie(this.CSRF_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
  }
}
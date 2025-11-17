/**
 * CSRF Protection Utility
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

export class CSRFProtection {
  /**
   * Generate a cryptographically secure random token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get or create CSRF token for current session
   */
  static getToken(): string {
    let token = sessionStorage.getItem(CSRF_TOKEN_KEY);

    if (!token) {
      token = this.generateToken();
      sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    }

    return token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  }

  /**
   * Add CSRF token to headers
   */
  static addTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = this.getToken();

    return {
      ...headers,
      [CSRF_HEADER_NAME]: token
    };
  }

  /**
   * Validate CSRF token from request
   */
  static validateToken(requestToken: string): boolean {
    const sessionToken = this.getToken();

    if (!sessionToken || !requestToken) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return this.constantTimeEqual(sessionToken, requestToken);
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Rotate CSRF token (call after sensitive operations)
   */
  static rotateToken(): string {
    this.clearToken();
    return this.getToken();
  }

  /**
   * Fetch wrapper with CSRF protection
   */
  static async protectedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Add CSRF token to headers
    const headers = this.addTokenToHeaders(options.headers);

    // Merge options
    const requestOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'same-origin' // Include cookies
    };

    try {
      const response = await fetch(url, requestOptions);

      // If unauthorized or forbidden, might be CSRF issue
      if (response.status === 401 || response.status === 403) {
        // Rotate token and retry once
        this.rotateToken();
        const retryHeaders = this.addTokenToHeaders(options.headers);
        const retryOptions: RequestInit = {
          ...options,
          headers: retryHeaders,
          credentials: 'same-origin'
        };

        return await fetch(url, retryOptions);
      }

      return response;
    } catch (error) {
      console.error('Protected fetch failed:', error);
      throw error;
    }
  }
}

/**
 * React Hook for CSRF protection
 */
export function useCSRFProtection() {
  const getToken = () => CSRFProtection.getToken();
  const clearToken = () => CSRFProtection.clearToken();
  const rotateToken = () => CSRFProtection.rotateToken();

  const protectedFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    return CSRFProtection.protectedFetch(url, options);
  };

  return {
    getToken,
    clearToken,
    rotateToken,
    protectedFetch
  };
}

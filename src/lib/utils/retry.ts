import { errorHandler, ErrorCategory, ErrorSeverity } from '../errors/ErrorHandler';

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitorInterval: number;
}

enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = ['network', 'timeout', 'ECONNREFUSED', '503', '504'],
    onRetry
  } = config;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = retryableErrors.some(keyword =>
        error.message?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      console.log(
        `Retry attempt ${attempt}/${maxAttempts} after ${Math.round(totalDelay)}ms`,
        error.message
      );

      if (onRetry) {
        onRetry(attempt, error);
      }

      await sleep(totalDelay);
    }
  }

  throw lastError!;
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        console.log('Circuit breaker transitioning to HALF_OPEN');
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw errorHandler.constructor.createError(
          'Circuit breaker is OPEN. Service temporarily unavailable.',
          ErrorCategory.NETWORK,
          ErrorSeverity.MEDIUM,
          { state: this.state, failureCount: this.failureCount }
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // Require 3 successful calls to fully close circuit
      if (this.successCount >= 3) {
        console.log('Circuit breaker transitioning to CLOSED');
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.failureCount >= this.config.failureThreshold
    ) {
      console.log('Circuit breaker transitioning to OPEN');
      this.state = CircuitState.OPEN;

      // Log critical event
      errorHandler.handleError(
        errorHandler.constructor.createError(
          `Circuit breaker opened after ${this.failureCount} failures`,
          ErrorCategory.NETWORK,
          ErrorSeverity.HIGH,
          { state: this.state }
        )
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Rate limiter to prevent overwhelming services
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens <= 0) {
      const waitTime = (1 / this.refillRate) * 1000;
      await sleep(waitTime);
      this.refill();
    }

    this.tokens--;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            errorHandler.constructor.createError(
              timeoutMessage,
              ErrorCategory.NETWORK,
              ErrorSeverity.MEDIUM,
              { timeout: timeoutMs }
            )
          ),
        timeoutMs
      )
    )
  ]);
}

/**
 * Bulk retry with concurrent limit
 */
export async function retryBulk<T>(
  operations: Array<() => Promise<T>>,
  config: RetryConfig & { concurrency?: number } = {}
): Promise<Array<T | Error>> {
  const { concurrency = 5, ...retryConfig } = config;
  const results: Array<T | Error> = [];
  const queue = [...operations];

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const operation = queue.shift()!;
      try {
        const result = await retryWithBackoff(operation, retryConfig);
        results.push(result);
      } catch (error) {
        results.push(error as Error);
      }
    }
  }

  // Process with limited concurrency
  const workers = Array(Math.min(concurrency, operations.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);
  return results;
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create resilient API client
 */
export function createResilientClient(baseConfig: {
  retryConfig?: RetryConfig;
  circuitBreaker?: CircuitBreakerConfig;
  timeout?: number;
}) {
  const circuitBreaker = baseConfig.circuitBreaker
    ? new CircuitBreaker(baseConfig.circuitBreaker)
    : null;

  return async function fetch<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    const operation = async () => {
      const fetchPromise = window.fetch(url, options).then(async response => {
        if (!response.ok) {
          throw errorHandler.constructor.createError(
            `HTTP ${response.status}: ${response.statusText}`,
            ErrorCategory.NETWORK,
            ErrorSeverity.MEDIUM,
            { status: response.status, url }
          );
        }
        return response.json();
      });

      if (baseConfig.timeout) {
        return withTimeout(
          fetchPromise,
          baseConfig.timeout,
          `Request to ${url} timed out`
        );
      }

      return fetchPromise;
    };

    let result: T;

    // Apply retry logic
    if (baseConfig.retryConfig) {
      result = await retryWithBackoff(operation, baseConfig.retryConfig);
    } else {
      result = await operation();
    }

    // Apply circuit breaker if configured
    if (circuitBreaker) {
      return circuitBreaker.execute(() => Promise.resolve(result));
    }

    return result;
  };
}

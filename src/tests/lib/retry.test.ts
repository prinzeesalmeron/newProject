import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryWithBackoff, CircuitBreaker, withTimeout, CircuitBreakerConfig } from '../../lib/utils/retry';

describe('Retry Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(operation, {
        maxAttempts: 3,
        baseDelay: 10
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('network error'));

      await expect(
        retryWithBackoff(operation, { maxAttempts: 3, baseDelay: 10 })
      ).rejects.toThrow('network error');

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('validation error'));

      await expect(
        retryWithBackoff(operation, {
          maxAttempts: 3,
          baseDelay: 10,
          retryableErrors: ['network']
        })
      ).rejects.toThrow('validation error');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      await retryWithBackoff(operation, {
        maxAttempts: 3,
        baseDelay: 10,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });

  describe('CircuitBreaker', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitorInterval: 100
    };

    it('should allow operations when circuit is closed', async () => {
      const breaker = new CircuitBreaker(config);
      const operation = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(operation);

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });

    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker(config);
      const operation = vi.fn().mockRejectedValue(new Error('failed'));

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch {}
      }

      expect(breaker.getState()).toBe('open');

      // Next call should fail immediately
      await expect(breaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to half-open after timeout', async () => {
      const breaker = new CircuitBreaker({
        ...config,
        resetTimeout: 100
      });
      const operation = vi.fn().mockRejectedValue(new Error('failed'));

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch {}
      }

      expect(breaker.getState()).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next call should transition to half-open
      operation.mockResolvedValue('success');
      await breaker.execute(operation);

      expect(breaker.getState()).toBe('half_open');
    });

    it('should close circuit after successful calls in half-open state', async () => {
      const breaker = new CircuitBreaker({
        ...config,
        resetTimeout: 100
      });
      const operation = vi.fn();

      // Open circuit
      operation.mockRejectedValue(new Error('failed'));
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch {}
      }

      // Wait and transition to half-open
      await new Promise(resolve => setTimeout(resolve, 150));

      // Succeed 3 times to close circuit
      operation.mockResolvedValue('success');
      for (let i = 0; i < 3; i++) {
        await breaker.execute(operation);
      }

      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if operation completes in time', async () => {
      const operation = new Promise(resolve =>
        setTimeout(() => resolve('success'), 10)
      );

      const result = await withTimeout(operation, 100);

      expect(result).toBe('success');
    });

    it('should reject if operation times out', async () => {
      const operation = new Promise(resolve =>
        setTimeout(() => resolve('success'), 200)
      );

      await expect(
        withTimeout(operation, 50, 'Timeout!')
      ).rejects.toThrow('Timeout!');
    });
  });
});

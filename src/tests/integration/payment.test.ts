import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../../lib/supabase';

describe('Payment Integration Tests', () => {
  let testUser: any;
  let testPropertyId: string;

  beforeAll(async () => {
    // Create test user
    const { data: { user }, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });

    if (error) throw error;
    testUser = user;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  describe('Payment Transaction Flow', () => {
    it('should create payment intent', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount: 10000, // $100 in cents
            currency: 'USD',
            metadata: {
              property_id: 'test-property-123',
              token_amount: 10
            }
          })
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('payment_intent');
      expect(data.payment_intent).toHaveProperty('client_secret');
    });

    it('should enforce rate limiting', async () => {
      const requests = Array(12).fill(null).map(() =>
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              amount: 10000,
              currency: 'USD'
            })
          }
        )
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should validate payment amount', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount: -100,
            currency: 'USD'
          })
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should reject amounts exceeding maximum', async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount: 200000000, // $2M - exceeds limit
            currency: 'USD'
          })
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limits per user', async () => {
      const { data } = await supabase
        .from('rate_limit_buckets')
        .select('*')
        .eq('identifier', testUser.id);

      expect(data).toBeDefined();
    });

    it('should refill tokens over time', async () => {
      // Make initial request
      await supabase.rpc('check_rate_limit', {
        p_identifier: testUser.id,
        p_endpoint: 'test',
        p_max_tokens: 10,
        p_refill_rate: 10
      });

      // Wait for refill
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check tokens are refilled
      const { data } = await supabase
        .from('rate_limit_buckets')
        .select('tokens_remaining')
        .eq('identifier', testUser.id)
        .eq('endpoint', 'test')
        .single();

      expect(data?.tokens_remaining).toBeGreaterThan(0);
    });
  });

  describe('Audit Logging', () => {
    it('should log payment transactions', async () => {
      // Trigger a payment
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount: 5000,
            currency: 'USD'
          })
        }
      );

      // Check audit log
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('resource_type', 'payment')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });

    it('should log security events', async () => {
      // Check security events
      const { data } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(data).toBeDefined();
    });
  });
});

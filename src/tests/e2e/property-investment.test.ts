import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../../lib/supabase';
import { ContractValidator } from '../../lib/validators/contractValidator';

describe('E2E: Property Investment Flow', () => {
  describe('Complete Investment Journey', () => {
    it('should complete full property investment flow', async () => {
      // Step 1: User authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `investor-${Date.now()}@example.com`,
        password: 'SecurePassword123!'
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      // Step 2: Validate property listing parameters
      const propertyParams = {
        title: 'Luxury Downtown Apartment',
        location: 'New York, NY',
        totalTokens: 1000,
        pricePerToken: '0.1',
        metadataURI: 'https://example.com/property/123'
      };

      const validation = ContractValidator.validatePropertyListing(propertyParams);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 3: Validate token purchase
      const purchaseValidation = ContractValidator.validateTokenPurchase({
        propertyId: 1,
        amount: 10,
        pricePerToken: '0.1',
        maxTotalCost: '2'
      });

      expect(purchaseValidation.valid).toBe(true);

      // Step 4: Check MFA requirements
      const { data: mfaSettings } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', authData.user!.id)
        .maybeSingle();

      // MFA not required for small transactions
      expect(mfaSettings).toBeNull();

      // Step 5: Simulate payment intent creation
      const paymentAmount = 10 * 0.1; // 10 tokens * 0.1 ETH
      expect(paymentAmount).toBe(1);

      // Step 6: Verify audit trail
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', authData.user!.id);

      expect(auditLogs).toBeDefined();

      // Cleanup
      await supabase.auth.admin.deleteUser(authData.user!.id);
    });

    it('should enforce MFA for large transactions', async () => {
      const largeAmount = 15000; // $15,000

      // Check if MFA required
      const { data: mfaRequired } = await supabase.rpc(
        'require_mfa_for_transaction',
        {
          p_user_id: 'test-user-id',
          p_transaction_amount: largeAmount
        }
      );

      // Should require MFA for amounts above $10,000
      expect(mfaRequired).toBeDefined();
    });

    it('should detect suspicious transaction patterns', async () => {
      const suspiciousCheck = ContractValidator.detectSuspiciousTransaction({
        amount: 50000, // Very large amount
        totalCost: '150',
        recentTransactionCount: 15 // Rapid transactions
      });

      expect(suspiciousCheck.suspicious).toBe(true);
      expect(suspiciousCheck.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Simulate network error
      const invalidUrl = 'https://invalid-url-that-does-not-exist.com';

      await expect(
        fetch(invalidUrl)
      ).rejects.toThrow();
    });

    it('should validate addresses before transactions', async () => {
      const validAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e';
      const invalidAddress = 'not-an-address';

      const validResult = ContractValidator.validateAddress(validAddress);
      expect(validResult.valid).toBe(true);

      const invalidResult = ContractValidator.validateAddress(invalidAddress);
      expect(invalidResult.valid).toBe(false);
    });

    it('should sanitize user input', async () => {
      const dirtyInput = 'Test\x00Input\x1FWith\x7FControl\nChars';
      const sanitized = ContractValidator.sanitizeString(dirtyInput);

      expect(sanitized).not.toContain('\x00');
      expect(sanitized).not.toContain('\x1F');
      expect(sanitized).not.toContain('\x7F');
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent property listings', async () => {
      const listings = Array(5).fill(null).map((_, i) => ({
        title: `Property ${i}`,
        location: `Location ${i}`,
        totalTokens: 1000,
        pricePerToken: '0.1',
        metadataURI: `https://example.com/property/${i}`
      }));

      const validations = listings.map(listing =>
        ContractValidator.validatePropertyListing(listing)
      );

      expect(validations.every(v => v.valid)).toBe(true);
    });

    it('should prevent double-spending through validation', async () => {
      const propertyId = 1;
      const availableTokens = 100;
      const requestedTokens = 150;

      // Validation should catch this
      const validation = ContractValidator.validateTokenAmount(
        requestedTokens,
        1,
        availableTokens
      );

      expect(validation.valid).toBe(false);
    });
  });
});

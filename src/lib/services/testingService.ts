/**
 * Testing Service - Utilities for unit, integration, and E2E testing
 */
export class TestingService {
  /**
   * Mock API responses for testing
   */
  static mockApiResponse<T>(data: T, delay: number = 100): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  }

  /**
   * Mock error responses
   */
  static mockApiError(message: string, delay: number = 100): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), delay);
    });
  }

  /**
   * Generate test data
   */
  static generateTestProperty() {
    return {
      id: `test_prop_${Date.now()}`,
      title: 'Test Property',
      description: 'A test property for automated testing',
      image_url: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
      location: 'Test City, TX',
      property_type: 'Single Family' as const,
      price_per_token: 100,
      total_tokens: 1000,
      available_tokens: 1000,
      rental_yield: 8.0,
      projected_return: 12.0,
      rating: 4.5,
      features: ['Test Feature'],
      is_yield_property: true,
      yield_percentage: '8.0%',
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Generate test user
   */
  static generateTestUser() {
    return {
      id: `test_user_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      full_name: 'Test User',
      role: 'investor' as const,
      kyc_status: 'verified' as const,
      block_balance: 1000,
      total_portfolio_value: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Generate test transaction
   */
  static generateTestTransaction(userId: string, propertyId?: string) {
    return {
      id: `test_tx_${Date.now()}`,
      user_id: userId,
      property_id: propertyId,
      transaction_type: 'purchase' as const,
      amount: 1000,
      token_amount: 10,
      status: 'completed' as const,
      description: 'Test transaction',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Setup test environment
   */
  static async setupTestEnvironment(): Promise<void> {
    // Clear any existing test data
    await this.cleanupTestData();
    
    // Set test mode flag
    localStorage.setItem('test_mode', 'true');
    
    console.log('Test environment setup complete');
  }

  /**
   * Cleanup test data
   */
  static async cleanupTestData(): Promise<void> {
    // Remove test data from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('test_') || key.includes('mock_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear test mode flag
    localStorage.removeItem('test_mode');
    
    console.log('Test data cleanup complete');
  }

  /**
   * Assert function for testing
   */
  static assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Wait for condition to be true
   */
  static async waitFor(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for condition');
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  /**
   * Mock wallet connection for testing
   */
  static mockWalletConnection() {
    return {
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      blockBalance: 2500,
      provider: 'metamask' as const
    };
  }

  /**
   * Test API endpoints
   */
  static async testAPIEndpoints(): Promise<{ passed: number; failed: number; results: any[] }> {
    const tests = [
      { name: 'Health Check', url: '/api/health' },
      { name: 'Properties', url: '/api/properties' },
      { name: 'Staking Pools', url: '/api/staking-pools' },
      { name: 'Users', url: '/api/users' }
    ];

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1${test.url}`);
        const success = response.ok;
        
        results.push({
          name: test.name,
          url: test.url,
          status: response.status,
          success
        });

        if (success) passed++;
        else failed++;

      } catch (error) {
        results.push({
          name: test.name,
          url: test.url,
          status: 0,
          success: false,
          error: (error as Error).message
        });
        failed++;
      }
    }

    return { passed, failed, results };
  }
}
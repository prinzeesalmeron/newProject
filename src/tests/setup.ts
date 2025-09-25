import { TestingService } from '../lib/services/testingService';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(async () => {
  await TestingService.setupTestEnvironment();
});

afterAll(async () => {
  await TestingService.cleanupTestData();
});

beforeEach(() => {
  // Reset any global state before each test
  localStorage.clear();
});

afterEach(() => {
  // Cleanup after each test
  // Reset any mocks or stubs
});

// Mock implementations for testing
export const mockSupabase = {
  from: (table: string) => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: {}, error: null }),
    update: () => ({ data: {}, error: null }),
    delete: () => ({ data: {}, error: null }),
    eq: () => mockSupabase.from(table),
    single: () => ({ data: {}, error: null })
  }),
  auth: {
    getUser: () => ({ data: { user: null }, error: null }),
    signUp: () => ({ data: { user: {} }, error: null }),
    signInWithPassword: () => ({ data: { user: {} }, error: null }),
    signOut: () => ({ error: null })
  }
};

export const mockWallet = {
  isConnected: false,
  address: null,
  balance: '0',
  blockBalance: 0,
  connect: async () => {},
  disconnect: () => {}
};

// Test utilities
export const createMockUser = () => TestingService.generateTestUser();
export const createMockProperty = () => TestingService.generateTestProperty();
export const createMockTransaction = (userId: string) => TestingService.generateTestTransaction(userId);
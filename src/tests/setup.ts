import { TestingService } from '../lib/services/testingService';
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock auth module
vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: null,
    initialized: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    initialize: vi.fn()
  })
}));

// Mock Supabase module
vi.mock('../lib/supabase', () => {
  const createChainableMock = () => {
    const chain: any = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      neq: () => chain,
      gt: () => chain,
      gte: () => chain,
      lt: () => chain,
      lte: () => chain,
      like: () => chain,
      ilike: () => chain,
      is: () => chain,
      in: () => chain,
      contains: () => chain,
      containedBy: () => chain,
      range: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => Promise.resolve({ data: {}, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null })
    };
    return chain;
  };

  const mockClient = {
    from: (table: string) => createChainableMock(),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      admin: {
        deleteUser: () => Promise.resolve({ data: null, error: null }),
        createUser: () => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })
      }
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: { path: 'test-path' }, error: null }),
        download: () => Promise.resolve({ data: new Blob(), error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } })
      })
    }
  };

  return {
    supabase: mockClient
  };
});

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
    single: () => ({ data: {}, error: null }),
    maybeSingle: () => ({ data: null, error: null })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  rpc: () => Promise.resolve({ data: null, error: null }),
  storage: {
    from: (bucket: string) => ({
      upload: () => Promise.resolve({ data: { path: 'test-path' }, error: null }),
      download: () => Promise.resolve({ data: new Blob(), error: null }),
      remove: () => Promise.resolve({ data: null, error: null })
    })
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
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../../lib/auth';
import { mockSupabase, createMockUser } from '../setup';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize auth state', async () => {
    const { initialize } = useAuth.getState();
    await initialize();
    
    expect(useAuth.getState().initialized).toBe(true);
  });

  it('should handle user registration', async () => {
    const { signUp } = useAuth.getState();
    const mockUser = createMockUser();
    
    await expect(signUp(
      mockUser.email,
      'password123',
      mockUser.full_name
    )).resolves.not.toThrow();
  });

  it('should handle user sign in', async () => {
    const { signIn } = useAuth.getState();
    
    await expect(signIn(
      'test@example.com',
      'password123'
    )).resolves.not.toThrow();
  });

  it('should handle sign out', async () => {
    const { signOut } = useAuth.getState();
    
    await signOut();
    
    const state = useAuth.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });
});
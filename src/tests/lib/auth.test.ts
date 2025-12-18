import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '../../lib/auth';
import { createMockUser } from '../setup';

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear any state before each test
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
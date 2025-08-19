import { create } from 'zustand';

interface AuthState {
  user: any | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (userData: any) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      // Check if user is stored in localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        set({ user, initialized: true });
      } else {
        set({ initialized: true });
      }

      // Listen for auth events
      const handleAuthEvent = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          set({ user });
        } else {
          set({ user: null });
        }
      };

      window.addEventListener('userAuthenticated', handleAuthEvent);
      window.addEventListener('userSignedOut', handleAuthEvent);
      window.addEventListener('userUpdated', handleAuthEvent);

      // Cleanup function would be needed in a real app
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const userData = {
        id: '1',
        email,
        fullName: 'Demo User',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ loading: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const userData = {
        id: Date.now().toString(),
        email,
        fullName,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      localStorage.removeItem('user');
      set({ user: null });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateUser: (userData: any) => {
    set({ user: userData });
  },
}));
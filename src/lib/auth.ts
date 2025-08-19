import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockApi } from './mockData';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getUser: () => Promise<{ data: { user: User | null } }>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,

      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const { user, error } = await mockApi.signIn(email, password);
          if (error) {
            set({ loading: false });
            return { error };
          }
          set({ user, loading: false });
          return {};
        } catch (error) {
          set({ loading: false });
          return { error: 'An unexpected error occurred' };
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ loading: true });
        try {
          const { user, error } = await mockApi.signUp(email, password, fullName);
          if (error) {
            set({ loading: false });
            return { error };
          }
          set({ user, loading: false });
          return {};
        } catch (error) {
          set({ loading: false });
          return { error: 'An unexpected error occurred' };
        }
      },

      signOut: async () => {
        set({ loading: true });
        await mockApi.signOut();
        set({ user: null, loading: false });
      },

      getUser: async () => {
        const { user } = get();
        return { data: { user } };
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);
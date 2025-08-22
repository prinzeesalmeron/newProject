import { create } from 'zustand';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, additionalData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        console.warn('Supabase is not configured. Auth features will be disabled.');
        
        // Check for mock user in localStorage
        const mockUserData = localStorage.getItem('mock_user');
        if (mockUserData) {
          try {
            const { user, profile } = JSON.parse(mockUserData);
            set({ 
              user, 
              profile,
              initialized: true 
            });
            console.log('Loaded mock user from localStorage');
            return;
          } catch (e) {
            console.error('Error parsing mock user data:', e);
            localStorage.removeItem('mock_user');
          }
        }
        
        set({ initialized: true });
        return;
      }

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        set({ initialized: true });
        return;
      }

      if (session?.user) {
        // Get user profile from database
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }

          set({ 
            user: session.user, 
            session, 
            profile,
            initialized: true 
          });
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          set({ 
            user: session.user, 
            session, 
            profile: null,
            initialized: true 
          });
        }
      } else {
        set({ initialized: true });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile on auth change:', profileError);
            }

            set({ 
              user: session.user, 
              session, 
              profile 
            });
          } catch (error) {
            console.error('Error fetching profile on auth change:', error);
            set({ 
              user: session.user, 
              session, 
              profile: null 
            });
          }
        } else {
          set({ 
            user: null, 
            session: null, 
            profile: null 
          });
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }
    
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Profile will be loaded by the auth state change listener
        console.log('Sign in successful');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string, additionalData = {}) => {
    if (!supabase) {
      // If Supabase is not configured, simulate successful registration
      console.warn('Supabase not configured - simulating registration');
      const mockUser = {
        id: Date.now().toString(),
        email,
        created_at: new Date().toISOString(),
        user_metadata: { full_name: fullName }
      };
      
      // Store in localStorage for demo purposes
      localStorage.setItem('mock_user', JSON.stringify({
        user: mockUser,
        profile: {
          id: mockUser.id,
          email,
          full_name: fullName,
          ...additionalData
        }
      }));
      
      set({ 
        user: mockUser as any,
        profile: {
          id: mockUser.id,
          email,
          full_name: fullName,
          ...additionalData
        }
      });
      
      return;
    }
    
    set({ loading: true });
    try {
      console.log('Starting Supabase registration for:', email);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...additionalData
          },
          emailRedirectTo: undefined
        }
      });

      if (error) {
        console.error('Supabase auth signup error:', error);
        throw error;
      }

      console.log('Supabase auth signup successful:', data.user?.email);

      if (data.user) {
        // Create user profile in database
        try {
          console.log('Creating user profile in database...');
          
          const { error: profileError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
              ...additionalData
            }]);

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            
            // If it's a duplicate key error, that's actually okay
            if (profileError.code === '23505') {
              console.log('User profile already exists, continuing...');
            } else {
              // For other errors, we should still notify the user but not fail completely
              console.warn('Profile creation failed but auth user was created:', profileError.message);
            }
          } else {
            console.log('User profile created successfully');
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          console.warn('Profile creation failed but auth user was created');
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create account';
      if (error.message?.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message?.includes('password')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        // Clear mock user data
        localStorage.removeItem('mock_user');
        console.log('Cleared mock user data');
      }
      
      set({ 
        user: null, 
        session: null, 
        profile: null 
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates: any) => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');
    if (!supabase) throw new Error('Supabase is not configured');

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      set({ profile: data });
      return data;
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error refreshing profile:', error);
        return;
      }

      set({ profile: data });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },
}));

// JWT token management for API calls
export const getAuthToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Role-based access control
export const hasRole = (user: any, role: string): boolean => {
  return user?.role === role;
};

export const isAdmin = (user: any): boolean => {
  return hasRole(user, 'admin');
};

export const isPropertyManager = (user: any): boolean => {
  return hasRole(user, 'property_manager') || isAdmin(user);
};

// KYC status check
export const isKYCVerified = (user: any): boolean => {
  return user?.kyc_status === 'verified';
};
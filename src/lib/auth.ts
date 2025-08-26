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

      // Get initial session with refresh token error handling
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        
        // Handle invalid refresh token errors
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('refresh_token_not_found')) {
          console.log('Invalid refresh token detected, clearing session...');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out after invalid refresh token:', signOutError);
          }
          set({ 
            user: null, 
            session: null, 
            profile: null,
            initialized: true 
          });
          return;
        }
        
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
            // Try to get existing profile
            let { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            // If no profile exists and this is a new signup, create one
            if (!profile && event === 'SIGNED_UP') {
              console.log('Creating user profile for new signup...');
              
              const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert([{
                  id: session.user.id,
                  email: session.user.email!,
                  full_name: session.user.user_metadata?.full_name || '',
                  phone: session.user.user_metadata?.phone || null,
                  date_of_birth: session.user.user_metadata?.date_of_birth || null,
                  address: session.user.user_metadata?.address || null,
                  kyc_status: 'pending',
                  role: 'investor',
                  block_balance: 0,
                  total_portfolio_value: 0,
                  is_active: true
                }])
                .select()
                .single();

              if (createError) {
                console.error('Error creating profile in auth state change:', createError);
                // Don't throw error, just continue without profile
                profile = null;
              } else {
                profile = newProfile;
                console.log('Profile created successfully in auth state change');
              }
            } else if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile on auth change:', profileError);
              profile = null;
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
      // Check for mock user in localStorage
      const mockUserData = localStorage.getItem('mock_user');
      if (mockUserData) {
        try {
          const { user, profile } = JSON.parse(mockUserData);
          if (user.email === email) {
            set({ 
              user, 
              profile,
              session: null 
            });
            return;
          }
        } catch (e) {
          console.error('Error parsing mock user data:', e);
        }
      }
      throw new Error('No account found with these credentials. Please register first to create an account.');
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
      
      // Provide more specific error messages
      let errorMessage = 'Failed to sign in';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials or register if you don\'t have an account.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email. Please register first.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string, additionalData = {}) => {
    if (!supabase) {
      // Create mock user for demo when Supabase is not configured
      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const mockProfile = {
        id: mockUser.id,
        email,
        full_name: fullName,
        total_portfolio_value: 0,
        block_balance: 0,
        kyc_status: 'pending',
        role: 'investor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...additionalData
      };
      
      // Store in localStorage for demo
      localStorage.setItem('mock_user', JSON.stringify({
        user: mockUser,
        profile: mockProfile
      }));
      
      set({ 
        user: mockUser as any, 
        profile: mockProfile,
        session: null 
      });
      
      console.log('Mock user registered successfully:', email);
      return;
    }
    
    set({ loading: true });
    try {
      console.log('Starting Supabase registration for:', email);
      console.log('Supabase URL configured:', !!import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key configured:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
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
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.status
        });
        throw error;
      }

      console.log('Supabase auth signup successful:', data.user?.email);
      console.log('User ID:', data.user?.id);
      console.log('Session created:', !!data.session);

      if (data.user) {
        // Wait for the auth state change to handle profile creation
        // The profile will be created by the trigger or we'll create it in the auth state change handler
        console.log('User created successfully, waiting for auth state change...');
        
        // Set initial state - profile will be loaded by auth state change listener
        set({ 
          user: data.user, 
          session: data.session,
          profile: null 
        });
      } else {
        throw new Error('User registration failed - no user data returned');
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
      } else if (error.message?.includes('JWT')) {
        errorMessage = 'Authentication error. Please check your Supabase configuration.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and Supabase URL.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    // Clear mock user data
    localStorage.removeItem('mock_user');
    
    if (!supabase) {
      set({ 
        user: null, 
        session: null, 
        profile: null 
      });
      return;
    }
    
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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
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
      throw new Error('Supabase is not configured. Please set up your environment variables or use the demo with mock data.');
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
        // Create user profile in database
        try {
          console.log('Creating user profile in database...');
          console.log('Profile data:', {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName
          });
          
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
              phone: (additionalData as any).phone || null,
              date_of_birth: (additionalData as any).date_of_birth || null,
              address: (additionalData as any).address || null,
              kyc_status: 'pending',
              role: 'investor',
              block_balance: 0,
              total_portfolio_value: 0,
              is_active: true,
              ...additionalData
            }])
            .select()
            .single();

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            console.error('Profile error details:', {
              message: profileError.message,
              code: profileError.code,
              details: profileError.details,
              hint: profileError.hint
            });
            
            // If it's a duplicate key error, that's actually okay
            if (profileError.code === '23505') {
              console.log('User profile already exists, continuing...');
              
              // Try to fetch existing profile
              const { data: existingProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
              
              set({ 
                user: data.user, 
                session: data.session,
                profile: existingProfile 
              });
            } else {
              // For other errors, we should still notify the user but not fail completely
              console.warn('Profile creation failed but auth user was created:', profileError.message);
              throw new Error(`Failed to create user profile: ${profileError.message}. Code: ${profileError.code}. ${profileError.hint || ''}`);
            }
          } else {
            console.log('User profile created successfully');
            console.log('Profile created:', profileData);
            
            // Set the user and profile in state
            set({ 
              user: data.user, 
              session: data.session,
              profile: profileData 
            });
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          throw new Error(`Failed to create user profile in database: ${profileError}`);
        }
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
      } else if (error.message?.includes('user profile')) {
        errorMessage = error.message;
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
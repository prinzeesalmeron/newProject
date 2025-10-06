import { supabase } from '../supabase';
import { DatabaseService } from '../database';
import type { UserProfile } from '../supabase';

export interface AuthResponse {
  user: any;
  session: any;
  profile?: UserProfile;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  address?: any;
  role?: 'investor' | 'property_manager' | 'admin';
}

export class AuthAPI {
  /**
   * Register new user with enhanced profile creation
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Authentication service not configured');
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            date_of_birth: userData.date_of_birth,
            address: userData.address,
            role: userData.role || 'investor'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // The profile will be created by the database trigger
      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the created profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'user_registered',
        resource_type: 'user',
        resource_id: authData.user.id,
        new_values: { email: userData.email, role: userData.role || 'investor' }
      });

      return {
        user: authData.user,
        session: authData.session,
        profile
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Sign in user with audit logging
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Authentication service not configured');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Sign in failed');
      }

      // Update last login
      const { data: currentUser } = await supabase
        .from('users')
        .select('login_count')
        .eq('id', data.user.id)
        .single();

      await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: (currentUser?.login_count || 0) + 1
        })
        .eq('id', data.user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'user_signed_in',
        resource_type: 'user',
        resource_id: data.user.id,
        new_values: { email }
      });

      return {
        user: data.user,
        session: data.session,
        profile
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Update user profile with validation
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Get current profile for audit trail
      const { data: currentProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'profile_updated',
        resource_type: 'user',
        resource_id: userId,
        old_values: currentProfile,
        new_values: updates
      });

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update user KYC status
   */
  static async updateKYCStatus(
    userId: string, 
    status: 'pending' | 'verified' | 'rejected',
    verifiedBy?: string,
    rejectionReason?: string
  ) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Update user KYC status
      const { data, error } = await supabase
        .from('users')
        .update({
          kyc_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update KYC verification record if exists
      if (status === 'verified' || status === 'rejected') {
        await supabase
          .from('kyc_verifications')
          .update({
            verification_status: status === 'verified' ? 'approved' : 'rejected',
            verified_by: verifiedBy,
            verified_at: new Date().toISOString(),
            rejection_reason: rejectionReason
          })
          .eq('user_id', userId);
      }

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'kyc_status_updated',
        resource_type: 'user',
        resource_id: userId,
        new_values: { kyc_status: status, verified_by: verifiedBy }
      });

      return data;
    } catch (error) {
      console.error('Error updating KYC status:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(userId: string) {
    if (!supabase) {
      return null;
    }

    try {
      const [
        { data: transactions },
        { data: shares },
        { data: stakes },
        { data: notifications }
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).limit(10),
        supabase.from('shares').select('*').eq('user_id', userId),
        supabase.from('user_stakes').select('*').eq('user_id', userId),
        supabase.from('notifications').select('*').eq('user_id', userId).eq('is_read', false)
      ]);

      return {
        recent_transactions: transactions || [],
        total_properties: shares?.length || 0,
        active_stakes: stakes?.filter(s => s.is_active).length || 0,
        unread_notifications: notifications?.length || 0
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return null;
    }
  }

  /**
   * Create API key for user
   */
  static async createAPIKey(userId: string, keyName: string, permissions: any = {}) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const apiKey = `bk_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;

      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          user_id: userId,
          key_name: keyName,
          api_key: apiKey,
          permissions,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'api_key_created',
        resource_type: 'api_key',
        resource_id: data.id,
        new_values: { key_name: keyName, permissions }
      });

      return data;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  }

  /**
   * Validate API key
   */
  static async validateAPIKey(apiKey: string) {
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select(`
          *,
          users (*)
        `)
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return null;
      }

      // Check if key is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);

      return data;
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }
}
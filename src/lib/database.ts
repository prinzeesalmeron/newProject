import { supabase } from './supabase';
import type { 
  Property, 
  StakingPool, 
  Course, 
  Article, 
  UserProfile, 
  Investment 
} from './supabase';

// Enhanced Database service for all data operations
export class DatabaseService {
  // User Management
  static async createUser(userData: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    date_of_birth?: string;
    address?: any;
    role?: string;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        kyc_status: 'pending',
        role: userData.role || 'investor',
        block_balance: 0,
        total_portfolio_value: 0,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserProfile(userId: string): Promise<UserProfile> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Property Management
  static async getProperties(filters?: any): Promise<Property[]> {
    if (!supabase) {
      return [];
    }

    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'active');

    if (filters) {
      if (filters.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getProperty(id: string): Promise<Property> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProperty(id: string, updates: Partial<Property>) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('properties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Shares Management
  static async getUserShares(userId: string) {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('shares')
      .select(`
        *,
        properties (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  static async createShare(shareData: {
    user_id: string;
    property_id: string;
    tokens_owned: number;
    purchase_price: number;
    current_value: number;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('shares')
      .insert([shareData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateShare(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('shares')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Transaction Management
  static async createTransaction(transactionData: {
    user_id: string;
    property_id?: string;
    transaction_type: string;
    amount: number;
    token_amount?: number;
    status?: string;
    blockchain_tx_hash?: string;
    description?: string;
    metadata?: any;
    fee_amount?: number;
    reference_id?: string;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        status: transactionData.status || 'pending',
        reference_id: transactionData.reference_id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserTransactions(userId: string, options?: {
    limit?: number;
    offset?: number;
    transaction_type?: string;
    status?: string;
  }) {
    if (!supabase) {
      return [];
    }

    let query = supabase
      .from('transactions')
      .select(`
        *,
        properties (title, location)
      `)
      .eq('user_id', userId);

    if (options?.transaction_type) {
      query = query.eq('transaction_type', options.transaction_type);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateTransactionStatus(id: string, status: string, metadata?: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const updates: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (metadata) {
      updates.metadata = metadata;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Rental Income Management
  static async getRentalIncome(propertyId: string) {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('property_id', propertyId)
      .order('month_year', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createRentalIncome(rentalData: {
    property_id: string;
    month_year: string;
    total_income: number;
    expenses?: number;
    occupancy_rate?: number;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('rentals')
      .insert([rentalData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async distributeRentalIncome(propertyId: string, monthYear: string) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    // Get all shareholders for the property
    const { data: shares, error: sharesError } = await supabase
      .from('shares')
      .select('user_id, tokens_owned')
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (sharesError) throw sharesError;

    // Get rental income for the month
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('net_income')
      .eq('property_id', propertyId)
      .eq('month_year', monthYear)
      .single();

    if (rentalError) throw rentalError;

    // Get total tokens for the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('total_tokens')
      .eq('id', propertyId)
      .single();

    if (propertyError) throw propertyError;

    // Calculate and create transactions for each shareholder
    const transactions = shares?.map(share => ({
      user_id: share.user_id,
      property_id: propertyId,
      transaction_type: 'rental_income',
      amount: (rental.net_income * share.tokens_owned) / property.total_tokens,
      token_amount: share.tokens_owned,
      status: 'completed',
      description: `Rental income for ${monthYear}`,
      metadata: { month_year: monthYear }
    })) || [];

    if (transactions.length > 0) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactions);

      if (transactionError) throw transactionError;
    }

    // Mark rental as distributed
    const { data, error } = await supabase
      .from('rentals')
      .update({ distributed_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .eq('month_year', monthYear)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Staking Management
  static async getStakingPools(): Promise<StakingPool[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('staking_pools')
      .select('*')
      .eq('is_active', true)
      .order('apy', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserStakes(userId: string) {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_stakes')
      .select(`
        *,
        staking_pools (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  static async createStake(stakeData: {
    user_id: string;
    pool_id: string;
    amount_staked: number;
    unlock_date?: string;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('user_stakes')
      .insert([stakeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateStake(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('user_stakes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Notification Management
  static async getUserNotifications(userId: string) {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  static async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type?: string;
    action_url?: string;
    metadata?: any;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markNotificationAsRead(id: string) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // KYC Management
  static async submitKYCDocument(kycData: {
    user_id: string;
    document_type: string;
    document_url: string;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('kyc_verifications')
      .insert([kycData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserKYCStatus(userId: string) {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Analytics and Reporting
  static async getUserPortfolioSummary(userId: string) {
    if (!supabase) {
      return {
        shares: [],
        transactions: [],
        summary: {
          total_investment: 0,
          current_value: 0,
          total_rental_income: 0,
          total_return: 0,
          properties_count: 0
        }
      };
    }

    // Get user shares with property details
    const { data: shares, error: sharesError } = await supabase
      .from('shares')
      .select(`
        *,
        properties (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (sharesError) throw sharesError;

    // Get user transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (transactionsError) throw transactionsError;

    // Calculate portfolio metrics
    const totalInvestment = shares?.reduce((sum, share) => sum + share.purchase_price, 0) || 0;
    const currentValue = shares?.reduce((sum, share) => sum + share.current_value, 0) || 0;
    const totalRentalIncome = transactions?.filter(t => t.transaction_type === 'rental_income')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    return {
      shares: shares || [],
      transactions: transactions || [],
      summary: {
        total_investment: totalInvestment,
        current_value: currentValue,
        total_rental_income: totalRentalIncome,
        total_return: currentValue - totalInvestment + totalRentalIncome,
        properties_count: shares?.length || 0
      }
    };
  }

  // Property Performance Analytics
  static async getPropertyPerformance(propertyId: string) {
    if (!supabase) {
      return null;
    }

    const { data: rentals, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('property_id', propertyId)
      .order('month_year', { ascending: true });

    if (error) throw error;

    const totalIncome = rentals?.reduce((sum, rental) => sum + rental.total_income, 0) || 0;
    const totalExpenses = rentals?.reduce((sum, rental) => sum + (rental.expenses || 0), 0) || 0;
    const averageOccupancy = rentals?.length > 0 
      ? rentals.reduce((sum, rental) => sum + (rental.occupancy_rate || 100), 0) / rentals.length 
      : 0;

    return {
      rentals: rentals || [],
      performance: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_income: totalIncome - totalExpenses,
        average_occupancy: averageOccupancy,
        months_tracked: rentals?.length || 0
      }
    };
  }

  // Audit Logging
  static async createAuditLog(logData: {
    action: string;
    resource_type: string;
    resource_id?: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    if (!supabase) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          ...logData,
          user_id: user?.id || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  // System Settings
  static async getSystemSetting(key: string) {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .maybeSingle();

    if (error) throw error;
    return data?.setting_value || null;
  }

  static async updateSystemSetting(key: string, value: any, updatedBy?: string) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('system_settings')
      .upsert([{
        setting_key: key,
        setting_value: value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Payment Methods
  static async getUserPaymentMethods(userId: string) {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addPaymentMethod(paymentData: {
    user_id: string;
    method_type: string;
    provider: string;
    account_identifier: string;
    is_primary?: boolean;
    metadata?: any;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Withdrawal Management
  static async createWithdrawalRequest(withdrawalData: {
    user_id: string;
    amount: number;
    currency?: string;
    payment_method_id?: string;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert([withdrawalData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserWithdrawals(userId: string) {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        payment_methods (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
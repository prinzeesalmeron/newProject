import { supabase } from '../supabase';
import { DatabaseService } from '../database';

export interface TransactionData {
  user_id: string;
  property_id?: string;
  transaction_type: 'purchase' | 'sale' | 'rental_income' | 'staking_reward' | 'withdrawal' | 'deposit';
  amount: number;
  token_amount?: number;
  fee_amount?: number;
  currency?: string;
  description?: string;
  metadata?: any;
  reference_id?: string;
}

export class TransactionAPI {
  /**
   * Create a new transaction with validation
   */
  static async createTransaction(transactionData: TransactionData) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    // Validate transaction data
    if (!transactionData.user_id || !transactionData.transaction_type || !transactionData.amount) {
      throw new Error('User ID, transaction type, and amount are required');
    }

    if (transactionData.amount <= 0) {
      throw new Error('Transaction amount must be greater than 0');
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          status: 'pending',
          reference_id: transactionData.reference_id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'transaction_created',
        resource_type: 'transaction',
        resource_id: data.id,
        new_values: transactionData
      });

      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    transactionId: string, 
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
    metadata?: any
  ) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { data: currentTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (metadata) {
        updates.metadata = { ...currentTransaction?.metadata, ...metadata };
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .maybeSingle();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'transaction_status_updated',
        resource_type: 'transaction',
        resource_id: transactionId,
        old_values: { status: currentTransaction?.status },
        new_values: { status }
      });

      return data;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Get user transactions with pagination and filtering
   */
  static async getUserTransactions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      transaction_type?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ) {
    if (!supabase) {
      return { transactions: [], total: 0, page: 1, limit: 20 };
    }

    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('transactions')
        .select(`
          *,
          properties (title, location)
        `, { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (options?.transaction_type) {
        query = query.eq('transaction_type', options.transaction_type);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.start_date) {
        query = query.gte('created_at', options.start_date);
      }
      if (options?.end_date) {
        query = query.lte('created_at', options.end_date);
      }

      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        transactions: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  }

  /**
   * Process property investment transaction
   */
  static async processPropertyInvestment(
    userId: string,
    propertyId: string,
    tokenAmount: number,
    totalCost: number,
    paymentMethodId?: string
  ) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Check user wallet balance first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('block_balance')
        .eq('id', userId)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        throw new Error('User not found');
      }

      if (userData.block_balance < totalCost) {
        throw new Error(`Insufficient wallet balance. You have $${userData.block_balance.toLocaleString()} but need $${totalCost.toLocaleString()}`);
      }

      // Start transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          property_id: propertyId,
          transaction_type: 'purchase',
          amount: totalCost,
          token_amount: tokenAmount,
          status: 'pending',
          description: `Investment in property tokens`,
          metadata: { payment_method_id: paymentMethodId }
        }])
        .select()
        .single();

      if (txError) throw txError;

      // Deduct from user wallet balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          block_balance: userData.block_balance - totalCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      // Update property available tokens
      // First, get the current property data
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('available_tokens')
        .eq('id', propertyId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Check if enough tokens are available
      if (!property || property.available_tokens < tokenAmount) {
        throw new Error('Insufficient tokens available for purchase');
      }

      // Update with the calculated value
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          available_tokens: property.available_tokens - tokenAmount
        })
        .eq('id', propertyId);

      if (propertyError) throw propertyError;

      // Create or update user shares
      const { data: existingShare } = await supabase
        .from('shares')
        .select('*')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existingShare) {
        // Update existing share
        await supabase
          .from('shares')
          .update({
            tokens_owned: existingShare.tokens_owned + tokenAmount,
            current_value: existingShare.current_value + totalCost,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingShare.id);
      } else {
        // Create new share
        await supabase
          .from('shares')
          .insert([{
            user_id: userId,
            property_id: propertyId,
            tokens_owned: tokenAmount,
            purchase_price: totalCost,
            current_value: totalCost
          }]);
      }

      // Update transaction status to completed
      await this.updateTransactionStatus(transaction.id, 'completed');

      return transaction;
    } catch (error) {
      console.error('Error processing property investment:', error);
      throw error;
    }
  }

  /**
   * Get transaction analytics
   */
  static async getTransactionAnalytics(userId: string, timeframe: '7d' | '30d' | '90d' | '1y' = '30d') {
    if (!supabase) {
      return null;
    }

    try {
      const startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const analytics = {
        total_transactions: data?.length || 0,
        total_invested: data?.filter(t => t.transaction_type === 'purchase').reduce((sum, t) => sum + t.amount, 0) || 0,
        total_income: data?.filter(t => t.transaction_type === 'rental_income').reduce((sum, t) => sum + t.amount, 0) || 0,
        total_fees: data?.reduce((sum, t) => sum + (t.fee_amount || 0), 0) || 0,
        by_type: data?.reduce((acc, t) => {
          acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };

      return analytics;
    } catch (error) {
      console.error('Error fetching transaction analytics:', error);
      return null;
    }
  }
}
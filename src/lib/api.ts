import { supabase } from './supabase';
import { DatabaseService } from './database';
import { getAuthToken } from './auth';

// Property Management APIs
export class PropertyAPI {
  static async getAllProperties() {
    return await DatabaseService.getProperties();
  }

  static async getProperty(id: string) {
    return await DatabaseService.getProperty(id);
  }

  static async createProperty(propertyData: any) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    return await DatabaseService.createProperty(propertyData);
  }

  static async updateProperty(id: string, updates: any) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    return await DatabaseService.updateProperty(id, updates);
  }

  static async investInProperty(propertyId: string, tokenAmount: number, totalCost: number) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    // Start transaction
    const { data, error } = await supabase.rpc('invest_in_property', {
      p_user_id: user.id,
      p_property_id: propertyId,
      p_token_amount: tokenAmount,
      p_total_cost: totalCost
    });

    if (error) throw error;
    return data;
  }

  static async getPropertyPerformance(propertyId: string) {
    return await DatabaseService.getPropertyPerformance(propertyId);
  }
}

// Transaction Engine APIs
export class TransactionAPI {
  static async createTransaction(transactionData: any) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.createTransaction({
      ...transactionData,
      user_id: user.id
    });
  }

  static async getUserTransactions() {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.getUserTransactions(user.id);
  }

  static async updateTransactionStatus(id: string, status: string, txHash?: string) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    return await DatabaseService.updateTransactionStatus(id, status, txHash);
  }

  static async processRentalDistribution(propertyId: string, monthYear: string) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    return await DatabaseService.distributeRentalIncome(propertyId, monthYear);
  }
}

// Staking APIs
export class StakingAPI {
  static async getStakingPools() {
    return await DatabaseService.getStakingPools();
  }

  static async getUserStakes() {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.getUserStakes(user.id);
  }

  static async stakeTokens(poolId: string, amount: number) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    // Calculate unlock date based on pool lock period
    const pools = await DatabaseService.getStakingPools();
    const pool = pools.find(p => p.id === poolId);
    if (!pool) throw new Error('Staking pool not found');

    const unlockDate = pool.lock_period > 0 
      ? new Date(Date.now() + pool.lock_period * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    // Create stake record
    const stake = await DatabaseService.createStake({
      user_id: user.id,
      pool_id: poolId,
      amount_staked: amount,
      unlock_date: unlockDate
    });

    // Create transaction record
    await DatabaseService.createTransaction({
      user_id: user.id,
      transaction_type: 'deposit',
      amount: amount,
      status: 'completed',
      description: `Staked ${amount} BLOCK tokens in ${pool.name}`,
      metadata: { stake_id: stake.id, pool_name: pool.name }
    });

    return stake;
  }

  static async unstakeTokens(stakeId: string) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    // Update stake to inactive
    const stake = await DatabaseService.updateStake(stakeId, { is_active: false });

    // Create transaction record
    await DatabaseService.createTransaction({
      user_id: user.id,
      transaction_type: 'withdrawal',
      amount: stake.amount_staked,
      status: 'completed',
      description: `Unstaked ${stake.amount_staked} BLOCK tokens`,
      metadata: { stake_id: stakeId }
    });

    return stake;
  }
}

// User Portfolio APIs
export class PortfolioAPI {
  static async getUserPortfolio() {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.getUserPortfolioSummary(user.id);
  }

  static async getUserShares() {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.getUserShares(user.id);
  }
}

// Notification APIs
export class NotificationAPI {
  static async getUserNotifications() {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.getUserNotifications(user.id);
  }

  static async markAsRead(notificationId: string) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    return await DatabaseService.markNotificationAsRead(notificationId);
  }

  static async sendNotification(userId: string, title: string, message: string, type = 'info') {
    return await DatabaseService.createNotification({
      user_id: userId,
      title,
      message,
      type
    });
  }
}

// KYC APIs
export class KYCAPI {
  static async submitDocument(documentType: string, documentUrl: string) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.submitKYCDocument({
      user_id: user.id,
      document_type: documentType,
      document_url: documentUrl
    });
  }

  static async getKYCStatus() {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    return await DatabaseService.getUserKYCStatus(user.id);
  }
}
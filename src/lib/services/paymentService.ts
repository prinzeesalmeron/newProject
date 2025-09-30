import { supabase } from '../supabase';
import { DatabaseService } from '../database';
import { NotificationAPI } from '../api/notificationAPI';
import { StripeService } from './stripeService';

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'crypto_wallet' | 'paypal';
  provider: string;
  last_four: string;
  is_primary: boolean;
  is_verified: boolean;
  metadata: any;
}

export interface PaymentRequest {
  amount: number;
  currency: 'USD' | 'ETH' | 'BLOCK';
  payment_method_id?: string;
  description: string;
  metadata?: any;
}

export interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  property_id?: string;
  token_amount?: number;
  escrow_fee: number;
  release_conditions: any;
  created_at: string;
  expires_at: string;
}

export interface CryptoConversion {
  from_currency: 'USD' | 'ETH';
  to_currency: 'ETH';
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  fee_percentage: number;
  fee_amount: number;
  provider: 'coinbase' | 'binance' | 'uniswap';
}

/**
 * Comprehensive Payment Service
 * Handles fiat payments, crypto conversions, escrow, and refunds
 */
export class PaymentService {
  private static stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  private static coinbaseApiKey = import.meta.env.VITE_COINBASE_API_KEY;

  /**
   * Initialize Stripe (mock implementation)
   */
  static async initializeStripe() {
    if (!this.stripePublicKey) {
      console.warn('Stripe not configured - using mock payment processing');
      return null;
    }

    // In production: const stripe = await loadStripe(this.stripePublicKey);
    console.log('Stripe initialized with key:', this.stripePublicKey);
    return { mock: true };
  }

  /**
   * Process fiat payment (USD to platform)
   */
  static async processFiatPayment(
    userId: string,
    paymentRequest: PaymentRequest
  ): Promise<{ success: boolean; transaction_id: string; payment_intent_id?: string }> {
    try {
      // Create payment intent with Stripe
      const { client_secret, payment_intent_id } = await StripeService.createPaymentIntent(
        paymentRequest.amount,
        paymentRequest.currency,
        {
          user_id: userId,
          description: paymentRequest.description,
          payment_method_id: paymentRequest.payment_method_id
        }
      );

      // Create transaction record
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .insert([{
          user_id: userId,
          payment_intent_id,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          payment_method_id: paymentRequest.payment_method_id,
          transaction_type: 'investment',
          status: 'pending',
          provider: 'stripe',
          metadata: paymentRequest.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        transaction_id: transaction.id,
        payment_intent_id,
        client_secret
      };

    } catch (error) {
      console.error('Fiat payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Process payment with real Stripe integration
   */
  static async processStripePayment(
    userId: string,
    amount: number,
    paymentMethodId: string,
    metadata: any = {}
  ): Promise<{ success: boolean; transaction_id: string; payment_intent_id: string }> {
    try {
      // Calculate total with fees
      const fees = StripeService.calculateFees(amount, 'card');
      const totalAmount = amount + fees.totalFees;

      // Create payment intent
      const { client_secret, payment_intent_id } = await StripeService.createPaymentIntent(
        totalAmount,
        'USD',
        {
          user_id: userId,
          original_amount: amount,
          platform_fee: fees.platformFee,
          processing_fee: fees.processingFee,
          ...metadata
        }
      );

      // Create transaction record
      const transaction = await DatabaseService.createTransaction({
        user_id: userId,
        property_id: metadata.property_id,
        transaction_type: 'purchase',
        amount: paymentRequest.amount,
        token_amount: metadata.token_amount,
        description: paymentRequest.description,
        metadata: {
          payment_intent_id,
          payment_method_id: paymentMethodId,
          platform_fee: fees.platformFee,
          processing_fee: fees.processingFee,
          stripe_client_secret: client_secret
        }
      });

      return {
        success: true,
        transaction_id: transaction.id,
        payment_intent_id,
        client_secret
      };

    } catch (error) {
      console.error('Stripe payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Convert fiat to crypto (USD to BLOCK tokens)
   */
  static async convertFiatToCrypto(
    userId: string,
    fromAmount: number,
    fromCurrency: 'USD',
    toCurrency: 'BLOCK' | 'ETH'
  ): Promise<CryptoConversion> {
    try {
      // Get current exchange rates (mock implementation)
      const exchangeRates = await this.getExchangeRates();
      const rate = exchangeRates[`${fromCurrency}_${toCurrency}`];
      
      if (!rate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      const feePercentage = 0.5; // 0.5% conversion fee
      const feeAmount = fromAmount * (feePercentage / 100);
      const netAmount = fromAmount - feeAmount;
      const toAmount = netAmount * rate;

      const conversion: CryptoConversion = {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: fromAmount,
        to_amount: toAmount,
        exchange_rate: rate,
        fee_percentage: feePercentage,
        fee_amount: feeAmount,
        provider: 'coinbase'
      };

      // Create conversion transaction
      await DatabaseService.createTransaction({
        user_id: userId,
        transaction_type: 'deposit',
        amount: fromAmount,
        description: `Convert ${fromAmount} ${fromCurrency} to ${toAmount.toFixed(2)} ${toCurrency}`,
        metadata: {
          conversion_data: conversion,
          exchange_rate: rate
        }
      });

      // Update user crypto balance
      await this.updateUserBalance(userId, toAmount, toCurrency);

      return conversion;

    } catch (error) {
      console.error('Crypto conversion failed:', error);
      throw error;
    }
  }

  /**
   * Create escrow transaction for property purchases
   */
  static async createEscrowTransaction(
    buyerId: string,
    sellerId: string,
    amount: number,
    currency: string,
    propertyId?: string,
    tokenAmount?: number
  ): Promise<EscrowTransaction> {
    try {
      const escrowFee = amount * 0.01; // 1% escrow fee
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to complete

      const escrowData = {
        id: `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        currency,
        status: 'pending' as const,
        property_id: propertyId,
        token_amount: tokenAmount,
        escrow_fee: escrowFee,
        release_conditions: {
          requires_buyer_confirmation: true,
          requires_seller_delivery: true,
          auto_release_days: 7
        },
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      };

      // Store escrow transaction
      if (supabase) {
        await supabase
          .from('escrow_transactions')
          .insert([escrowData]);
      }

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'escrow_created',
        resource_type: 'escrow_transaction',
        resource_id: escrowData.id,
        new_values: escrowData
      });

      // Notify both parties
      await NotificationAPI.createNotification({
        user_id: buyerId,
        title: 'Escrow Transaction Created',
        message: `Your payment of ${amount} ${currency} is being held in escrow for property purchase.`,
        type: 'info'
      });

      await NotificationAPI.createNotification({
        user_id: sellerId,
        title: 'Escrow Payment Received',
        message: `Payment of ${amount} ${currency} is being held in escrow. Complete the transaction to release funds.`,
        type: 'info'
      });

      return escrowData;

    } catch (error) {
      console.error('Escrow creation failed:', error);
      throw error;
    }
  }

  /**
   * Release escrow funds to seller
   */
  static async releaseEscrowFunds(
    escrowId: string,
    releasedBy: string,
    reason: string = 'Transaction completed'
  ): Promise<void> {
    try {
      if (!supabase) {
        console.log(`Mock escrow release: ${escrowId} by ${releasedBy}`);
        return;
      }

      // Get escrow transaction
      const { data: escrow, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('id', escrowId)
        .single();

      if (error || !escrow) {
        throw new Error('Escrow transaction not found');
      }

      if (escrow.status !== 'funded') {
        throw new Error('Escrow is not in funded status');
      }

      // Update escrow status
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_by: releasedBy,
          released_at: new Date().toISOString(),
          release_reason: reason
        })
        .eq('id', escrowId);

      // Transfer funds to seller (mock implementation)
      await this.transferFunds(escrow.seller_id, escrow.amount - escrow.escrow_fee, escrow.currency);

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'escrow_released',
        resource_type: 'escrow_transaction',
        resource_id: escrowId,
        new_values: { released_by: releasedBy, reason }
      });

      // Notify both parties
      await NotificationAPI.createNotification({
        user_id: escrow.seller_id,
        title: 'Escrow Funds Released',
        message: `Your payment of ${escrow.amount - escrow.escrow_fee} ${escrow.currency} has been released.`,
        type: 'success'
      });

      await NotificationAPI.createNotification({
        user_id: escrow.buyer_id,
        title: 'Transaction Completed',
        message: `Your escrow transaction has been completed and funds released to the seller.`,
        type: 'success'
      });

    } catch (error) {
      console.error('Escrow release failed:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    transactionId: string,
    refundAmount: number,
    reason: string,
    processedBy: string
  ): Promise<{ success: boolean; refund_id: string }> {
    try {
      // Get original transaction
      const originalTx = await DatabaseService.getUserTransactions(processedBy, {
        limit: 1000 // Get all to find the specific transaction
      });
      
      const transaction = originalTx.find(tx => tx.id === transactionId);
      if (!transaction) {
        throw new Error('Original transaction not found');
      }

      if (transaction.status !== 'completed') {
        throw new Error('Can only refund completed transactions');
      }

      // Create refund transaction
      const refundTx = await DatabaseService.createTransaction({
        user_id: transaction.user_id,
        property_id: transaction.property_id,
        transaction_type: 'deposit', // Refund as deposit back to user
        amount: refundAmount,
        description: `Refund for transaction ${transactionId}: ${reason}`,
        metadata: {
          original_transaction_id: transactionId,
          refund_reason: reason,
          processed_by: processedBy,
          refund_type: 'full'
        }
      });

      // Process refund through payment processor (mock)
      await this.processStripeRefund(transaction.metadata?.payment_intent_id, refundAmount);

      // Update refund transaction status
      await DatabaseService.updateTransactionStatus(refundTx.id, 'completed', {
        refund_processed_at: new Date().toISOString()
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'refund_processed',
        resource_type: 'transaction',
        resource_id: refundTx.id,
        new_values: { original_transaction_id: transactionId, refund_amount: refundAmount, reason }
      });

      // Notify user
      await NotificationAPI.createNotification({
        user_id: transaction.user_id,
        title: 'Refund Processed',
        message: `Your refund of $${refundAmount} has been processed and will appear in your account within 3-5 business days.`,
        type: 'success'
      });

      return {
        success: true,
        refund_id: refundTx.id
      };

    } catch (error) {
      console.error('Refund processing failed:', error);
      throw error;
    }
  }

  /**
   * Get current exchange rates (mock implementation)
   */
  static async getExchangeRates(): Promise<Record<string, number>> {
    // Mock exchange rates - in production, integrate with:
    // - CoinGecko API
    // - Coinbase Pro API
    // - Binance API
    // - CryptoCompare API

    return {
      'USD_ETH': 0.0004, // 1 USD = 0.0004 ETH
      'ETH_USD': 2500,   // 1 ETH = 2500 USD
    };
  }

  /**
   * Add payment method for user
   */
  static async addPaymentMethod(
    userId: string,
    paymentData: {
      type: PaymentMethod['type'];
      provider: string;
      token: string; // Stripe token or similar
      metadata?: any;
    }
  ): Promise<PaymentMethod> {
    try {
      // Process with Stripe (mock)
      const stripeCustomer = await this.createStripeCustomer(userId);
      const paymentMethod = await this.attachStripePaymentMethod(stripeCustomer.id, paymentData.token);

      // Store in database
      const dbPaymentMethod = await DatabaseService.addPaymentMethod({
        user_id: userId,
        method_type: paymentData.type,
        provider: paymentData.provider,
        account_identifier: paymentMethod.last_four,
        is_primary: false,
        metadata: {
          stripe_payment_method_id: paymentMethod.id,
          ...paymentData.metadata
        }
      });

      return {
        id: dbPaymentMethod.id,
        type: paymentData.type,
        provider: paymentData.provider,
        last_four: paymentMethod.last_four,
        is_primary: dbPaymentMethod.is_primary,
        is_verified: true,
        metadata: dbPaymentMethod.metadata
      };

    } catch (error) {
      console.error('Add payment method failed:', error);
      throw error;
    }
  }

  /**
   * Get user payment methods
   */
  static async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const methods = await DatabaseService.getUserPaymentMethods(userId);
      
      return methods.map(method => ({
        id: method.id,
        type: method.method_type as PaymentMethod['type'],
        provider: method.provider,
        last_four: method.account_identifier,
        is_primary: method.is_primary,
        is_verified: method.is_verified,
        metadata: method.metadata
      }));

    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Process property investment with escrow
   */
  static async processPropertyInvestment(
    userId: string,
    propertyId: string,
    tokenAmount: number,
    totalCost: number,
    paymentMethodId: string
  ): Promise<{ success: boolean; escrow_id: string; transaction_id: string }> {
    try {
      // Create escrow transaction
      const escrow = await this.createEscrowTransaction(
        userId,
        'platform', // Platform acts as seller for primary sales
        totalCost,
        'USD',
        propertyId,
        tokenAmount
      );

      // Process payment to fund escrow
      const payment = await this.processFiatPayment(userId, {
        amount: totalCost,
        currency: 'USD',
        payment_method_id: paymentMethodId,
        description: `Investment in property ${propertyId}`,
        metadata: { escrow_id: escrow.id }
      });

      // Update escrow status to funded
      if (supabase) {
        await supabase
          .from('escrow_transactions')
          .update({ status: 'funded' })
          .eq('id', escrow.id);
      }

      // Auto-release escrow for primary sales (immediate token delivery)
      setTimeout(async () => {
        try {
          await this.releaseEscrowFunds(escrow.id, 'system', 'Primary sale - automatic release');
          
          // Mint/transfer property tokens to user
          await this.deliverPropertyTokens(userId, propertyId, tokenAmount);
          
        } catch (error) {
          console.error('Auto-release failed:', error);
        }
      }, 5000); // 5 second delay for demo

      return {
        success: true,
        escrow_id: escrow.id,
        transaction_id: payment.transaction_id
      };

    } catch (error) {
      console.error('Property investment processing failed:', error);
      throw error;
    }
  }

  /**
   * Calculate investment fees
   */
  static async calculateInvestmentFees(amount: number): Promise<{
    platform_fee: number;
    processing_fee: number;
    total_fees: number;
    net_amount: number;
  }> {
    const platformFeeRate = 0.025; // 2.5%
    const processingFeeRate = 0.029; // 2.9% + $0.30 (typical Stripe rate)
    const processingFixedFee = 0.30;

    const platformFee = amount * platformFeeRate;
    const processingFee = (amount * processingFeeRate) + processingFixedFee;
    const totalFees = platformFee + processingFee;
    const netAmount = amount - totalFees;

    return {
      platform_fee: platformFee,
      processing_fee: processingFee,
      total_fees: totalFees,
      net_amount: netAmount
    };
  }

  /**
   * Process withdrawal to bank account
   */
  static async processWithdrawal(
    userId: string,
    amount: number,
    paymentMethodId: string,
    currency: 'USD' | 'ETH' = 'USD'
  ): Promise<{ success: boolean; withdrawal_id: string; estimated_arrival: string }> {
    try {
      // Create withdrawal request
      const withdrawal = await DatabaseService.createWithdrawalRequest({
        user_id: userId,
        amount,
        currency,
        payment_method_id: paymentMethodId
      });

      // Calculate estimated arrival
      const estimatedArrival = new Date();
      estimatedArrival.setDate(estimatedArrival.getDate() + 3); // 3 business days

      // Process withdrawal (mock)
      await this.processStripeTransfer(paymentMethodId, amount);

      // Create transaction record
      await DatabaseService.createTransaction({
        user_id: userId,
        transaction_type: 'withdrawal',
        amount: -amount, // Negative for withdrawal
        description: `Withdrawal to ${currency} account`,
        metadata: {
          withdrawal_request_id: withdrawal.id,
          payment_method_id: paymentMethodId,
          estimated_arrival: estimatedArrival.toISOString()
        }
      });

      // Update user balance
      await this.updateUserBalance(userId, -amount, currency);

      return {
        success: true,
        withdrawal_id: withdrawal.id,
        estimated_arrival: estimatedArrival.toISOString()
      };

    } catch (error) {
      console.error('Withdrawal processing failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async createStripeCustomer(userId: string) {
    // Mock Stripe customer creation
    return {
      id: `cus_mock_${userId.substr(0, 8)}`,
      email: 'user@example.com'
    };
  }

  private static async attachStripePaymentMethod(customerId: string, token: string) {
    // Mock Stripe payment method attachment
    return {
      id: `pm_mock_${Date.now()}`,
      last_four: '4242',
      brand: 'visa'
    };
  }

  private static async processStripeRefund(paymentIntentId: string, amount: number) {
    // Mock Stripe refund processing
    console.log(`Processing Stripe refund: ${paymentIntentId} for $${amount}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id: `re_mock_${Date.now()}`, status: 'succeeded' };
  }

  private static async processStripeTransfer(paymentMethodId: string, amount: number) {
    // Mock Stripe transfer processing
    console.log(`Processing Stripe transfer: ${paymentMethodId} for $${amount}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { id: `tr_mock_${Date.now()}`, status: 'paid' };
  }

  private static async updateUserBalance(userId: string, amount: number, currency: string) {
    // Update user balance in database
    if (!supabase) {
      console.log(`Mock balance update: ${userId} ${amount} ${currency}`);
      return;
    }
    
    if (currency === 'BLOCK') {
      const { data: user } = await supabase
        .from('users')
        .select('block_balance')
        .eq('id', userId)
        .single();
      
      if (user) {
        const newBalance = (user.block_balance || 0) + amount;
        await supabase
          .from('users')
          .update({ block_balance: newBalance })
          .eq('id', userId);
      }
    }
    // For USD/ETH, you might track in a separate balances table
  }

  private static async transferFunds(userId: string, amount: number, currency: string) {
    // Mock fund transfer
    console.log(`Transferring ${amount} ${currency} to user ${userId}`);
    await this.updateUserBalance(userId, amount, currency);
  }

  private static async deliverPropertyTokens(userId: string, propertyId: string, tokenAmount: number) {
    // Create or update user shares
    await DatabaseService.createShare({
      user_id: userId,
      property_id: propertyId,
      tokens_owned: tokenAmount,
      purchase_price: 0, // Will be updated with actual price
      current_value: 0
    });

    // Update property available tokens
    const property = await DatabaseService.getProperty(propertyId);
    await DatabaseService.updateProperty(propertyId, {
      available_tokens: property.available_tokens - tokenAmount
    });
  }

  /**
   * Get payment analytics
   */
  static async getPaymentAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    try {
      const startDate = new Date();
      switch (timeframe) {
        case '7d': startDate.setDate(startDate.getDate() - 7); break;
        case '30d': startDate.setDate(startDate.getDate() - 30); break;
        case '90d': startDate.setDate(startDate.getDate() - 90); break;
      }

      if (!supabase) {
        return {
          total_volume: 125000,
          total_transactions: 45,
          average_transaction: 2777,
          success_rate: 98.5,
          refund_rate: 1.2,
          timeframe
        };
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .in('transaction_type', ['purchase', 'deposit', 'withdrawal']);

      const totalVolume = transactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
      const successfulTx = transactions?.filter(tx => tx.status === 'completed').length || 0;
      const totalTx = transactions?.length || 0;

      return {
        total_volume: totalVolume,
        total_transactions: totalTx,
        average_transaction: totalTx > 0 ? totalVolume / totalTx : 0,
        success_rate: totalTx > 0 ? (successfulTx / totalTx) * 100 : 0,
        refund_rate: 0, // Calculate from refund transactions
        timeframe
      };

    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      return null;
    }
  }
}
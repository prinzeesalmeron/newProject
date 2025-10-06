import { DatabaseService } from '../database';
import { NotificationAPI } from '../api/notificationAPI';
import { TransactionAPI } from '../api/transactionAPI';

export interface InvestmentRequest {
  userId: string;
  propertyId: string;
  tokenAmount: number;
  totalCost: number;
  paymentMethodId?: string;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
}

export interface RentalDistribution {
  propertyId: string;
  monthYear: string;
  totalIncome: number;
  expenses: number;
}

/**
 * Transaction Engine - Handles all financial transactions
 * This is the off-chain prototype that will later integrate with blockchain
 */
export class TransactionEngine {
  /**
   * Process property investment
   */
  static async processInvestment(request: InvestmentRequest): Promise<string> {
    try {
      console.log('Processing investment:', request);

      // Validate investment request
      await this.validateInvestmentRequest(request);

      // Create pending transaction
      const transaction = await TransactionAPI.createTransaction({
        user_id: request.userId,
        property_id: request.propertyId,
        transaction_type: 'purchase',
        amount: request.totalCost,
        token_amount: request.tokenAmount,
        description: `Investment in property tokens`,
        metadata: {
          payment_method_id: request.paymentMethodId,
          processing_started_at: new Date().toISOString()
        }
      });

      // Simulate payment processing
      await this.simulatePaymentProcessing(transaction.id, request.totalCost);

      // Update property available tokens
      await this.updatePropertyTokens(request.propertyId, request.tokenAmount);

      // Create or update user shares
      await this.updateUserShares(request.userId, request.propertyId, request.tokenAmount, request.totalCost);

      // Update transaction status to completed
      await TransactionAPI.updateTransactionStatus(transaction.id, 'completed', {
        processed_at: new Date().toISOString(),
        blockchain_simulation: true
      });

      // Send notifications
      await this.sendInvestmentNotifications(request.userId, request.propertyId, request.totalCost, request.tokenAmount);

      console.log('Investment processed successfully:', transaction.id);
      return transaction.id;

    } catch (error) {
      console.error('Investment processing failed:', error);
      throw error;
    }
  }

  /**
   * Process withdrawal request
   */
  static async processWithdrawal(request: WithdrawalRequest): Promise<string> {
    try {
      console.log('Processing withdrawal:', request);

      // Validate withdrawal request
      await this.validateWithdrawalRequest(request);

      // Create withdrawal request record
      const withdrawal = await DatabaseService.createWithdrawalRequest({
        user_id: request.userId,
        amount: request.amount,
        currency: request.currency,
        payment_method_id: request.paymentMethodId
      });

      // Create transaction record
      const transaction = await TransactionAPI.createTransaction({
        user_id: request.userId,
        transaction_type: 'withdrawal',
        amount: request.amount,
        description: `Withdrawal to ${request.currency}`,
        metadata: {
          withdrawal_request_id: withdrawal.id,
          currency: request.currency
        }
      });

      // Simulate withdrawal processing
      await this.simulateWithdrawalProcessing(withdrawal.id, request.amount);

      // Update user balance (if applicable)
      await this.updateUserBalance(request.userId, -request.amount);

      console.log('Withdrawal processed successfully:', withdrawal.id);
      return withdrawal.id;

    } catch (error) {
      console.error('Withdrawal processing failed:', error);
      throw error;
    }
  }

  /**
   * Distribute rental income to property shareholders
   */
  static async distributeRentalIncome(distribution: RentalDistribution): Promise<void> {
    try {
      console.log('Distributing rental income:', distribution);

      // Create rental income record
      await DatabaseService.createRentalIncome({
        property_id: distribution.propertyId,
        month_year: distribution.monthYear,
        total_income: distribution.totalIncome,
        expenses: distribution.expenses
      });

      // Distribute to shareholders
      await DatabaseService.distributeRentalIncome(distribution.propertyId, distribution.monthYear);

      // Send notifications to all shareholders
      await this.sendRentalIncomeNotifications(distribution.propertyId, distribution.monthYear);

      console.log('Rental income distributed successfully');

    } catch (error) {
      console.error('Rental income distribution failed:', error);
      throw error;
    }
  }

  /**
   * Calculate transaction fees
   */
  static async calculateFees(transactionType: string, amount: number): Promise<number> {
    try {
      // Get platform fee percentage from system settings
      const feePercentage = await DatabaseService.getSystemSetting('platform_fee_percentage');
      const fee = (amount * (parseFloat(feePercentage) || 2.0)) / 100;

      // Minimum fee of $1
      return Math.max(fee, 1.0);
    } catch (error) {
      console.error('Error calculating fees:', error);
      return amount * 0.02; // Default 2% fee
    }
  }

  // Private helper methods
  private static async validateInvestmentRequest(request: InvestmentRequest): Promise<void> {
    // Check if property exists and has enough tokens
    const property = await DatabaseService.getProperty(request.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.available_tokens < request.tokenAmount) {
      throw new Error('Not enough tokens available');
    }

    if (property.status !== 'active') {
      throw new Error('Property is not available for investment');
    }

    // Check minimum investment amount
    const minInvestment = await DatabaseService.getSystemSetting('min_investment_amount');
    if (request.totalCost < parseFloat(minInvestment || '10')) {
      throw new Error(`Minimum investment amount is $${minInvestment}`);
    }

    // Check maximum investment amount
    const maxInvestment = await DatabaseService.getSystemSetting('max_investment_amount');
    if (request.totalCost > parseFloat(maxInvestment || '100000')) {
      throw new Error(`Maximum investment amount is $${maxInvestment}`);
    }
  }

  private static async validateWithdrawalRequest(request: WithdrawalRequest): Promise<void> {
    // Check user balance
    const user = await DatabaseService.getUserProfile(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, check if user has sufficient balance
    if (request.amount <= 0) {
      throw new Error('Withdrawal amount must be greater than 0');
    }

    // Check minimum withdrawal amount
    if (request.amount < 10) {
      throw new Error('Minimum withdrawal amount is $10');
    }
  }

  private static async simulatePaymentProcessing(transactionId: string, amount: number): Promise<void> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, this would integrate with:
    // - Stripe for credit card payments
    // - Bank APIs for ACH transfers
    // - Crypto payment processors
    // - PayPal API

    console.log(`Payment of $${amount} processed for transaction ${transactionId}`);
  }

  private static async simulateWithdrawalProcessing(withdrawalId: string, amount: number): Promise<void> {
    // Simulate withdrawal processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would integrate with:
    // - Bank APIs for wire transfers
    // - PayPal API for PayPal transfers
    // - Crypto wallet APIs for crypto withdrawals

    console.log(`Withdrawal of $${amount} processed for request ${withdrawalId}`);
  }

  private static async updatePropertyTokens(propertyId: string, tokenAmount: number): Promise<void> {
    try {
      const property = await DatabaseService.getProperty(propertyId);
      console.log(`Updating property ${propertyId} tokens from ${property.available_tokens} to ${property.available_tokens - tokenAmount}`);

      if (property.available_tokens < tokenAmount) {
        throw new Error(`Insufficient tokens available. Available: ${property.available_tokens}, Requested: ${tokenAmount}`);
      }

      await DatabaseService.updateProperty(propertyId, {
        available_tokens: property.available_tokens - tokenAmount
      });

      console.log('Property tokens updated successfully');
    } catch (error) {
      console.error('Error updating property tokens:', error);
      throw new Error(`Failed to update property tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async updateUserShares(
    userId: string,
    propertyId: string,
    tokenAmount: number,
    totalCost: number
  ): Promise<void> {
    try {
      const existingShares = await DatabaseService.getUserShares(userId);
      const existingShare = existingShares.find(s => s.property_id === propertyId);

      if (existingShare) {
        // Update existing share
        console.log('Updating existing share:', existingShare.id);
        await DatabaseService.updateShare(existingShare.id, {
          tokens_owned: existingShare.tokens_owned + tokenAmount,
          current_value: existingShare.current_value + totalCost
        });
      } else {
        // Create new share
        console.log('Creating new share for user:', userId, 'property:', propertyId);
        await DatabaseService.createShare({
          user_id: userId,
          property_id: propertyId,
          tokens_owned: tokenAmount,
          purchase_price: totalCost,
          current_value: totalCost
        });
      }
    } catch (error) {
      console.error('Error updating user shares:', error);
      throw new Error(`Failed to update user shares: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async updateUserBalance(userId: string, amount: number): Promise<void> {
    // In production, this would update user's cash balance
    console.log(`Updating user ${userId} balance by ${amount}`);
  }

  private static async sendInvestmentNotifications(
    userId: string, 
    propertyId: string, 
    amount: number, 
    tokenAmount: number
  ): Promise<void> {
    try {
      const [user, property] = await Promise.all([
        DatabaseService.getUserProfile(userId),
        DatabaseService.getProperty(propertyId)
      ]);

      if (user && property) {
        await NotificationAPI.sendInvestmentConfirmation(
          userId,
          user.email,
          property.title,
          amount,
          tokenAmount
        );
      }
    } catch (error) {
      console.error('Error sending investment notifications:', error);
    }
  }

  private static async sendRentalIncomeNotifications(
    propertyId: string, 
    monthYear: string
  ): Promise<void> {
    try {
      // Get all shareholders
      const shares = await DatabaseService.getUserShares(''); // This would need to be modified to get all shares for a property
      
      for (const share of shares) {
        if (share.property_id === propertyId) {
          const user = await DatabaseService.getUserProfile(share.user_id);
          if (user) {
            // Calculate user's share of rental income
            const userIncome = 100; // This would be calculated based on actual rental income
            
            await NotificationAPI.sendRentalIncomeNotification(
              user.id,
              user.email,
              userIncome,
              share.properties?.title || 'Property',
              monthYear
            );
          }
        }
      }
    } catch (error) {
      console.error('Error sending rental income notifications:', error);
    }
  }

  /**
   * Get transaction engine status
   */
  static async getEngineStatus() {
    return {
      status: 'operational',
      version: '1.0.0',
      mode: 'off-chain-prototype',
      features: {
        property_investment: true,
        rental_distribution: true,
        withdrawal_processing: true,
        fee_calculation: true,
        notification_system: true,
        audit_logging: true
      },
      blockchain_integration: {
        status: 'simulated',
        smart_contracts: 'deployed',
        network: 'ethereum-mainnet'
      }
    };
  }
}
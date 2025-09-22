import { loadStripe, Stripe } from '@stripe/stripe-js';

export class StripeService {
  private static stripe: Stripe | null = null;
  private static readonly publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  /**
   * Initialize Stripe
   */
  static async initialize(): Promise<Stripe | null> {
    if (!this.publicKey) {
      console.warn('Stripe public key not configured');
      return null;
    }

    if (!this.stripe) {
      this.stripe = await loadStripe(this.publicKey);
    }

    return this.stripe;
  }

  /**
   * Create payment intent for property investment
   */
  static async createPaymentIntent(
    amount: number,
    currency: string = 'USD',
    metadata: any = {}
  ): Promise<{ client_secret: string; payment_intent_id: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Payment intent creation failed');
      }

      return {
        client_secret: data.payment_intent.client_secret,
        payment_intent_id: data.payment_intent.id
      };

    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  }

  /**
   * Confirm payment with Stripe Elements
   */
  static async confirmPayment(
    clientSecret: string,
    paymentMethod: any,
    returnUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const stripe = await this.initialize();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          payment_method: paymentMethod,
          return_url: returnUrl || `${window.location.origin}/payments/success`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create setup intent for saving payment methods
   */
  static async createSetupIntent(customerId?: string): Promise<{ client_secret: string }> {
    const stripe = await this.initialize();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ customer_id: customerId })
      });

      const data = await response.json();
      return { client_secret: data.client_secret };

    } catch (error) {
      console.error('Setup intent creation failed:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    paymentTransactionId: string,
    refundAmount: number,
    reason: string
  ): Promise<{ success: boolean; refund_id: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          payment_transaction_id: paymentTransactionId,
          refund_amount,
          reason
        })
      });

      if (!response.ok) {
        throw new Error('Refund processing failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Refund processing failed');
      }

      return {
        success: true,
        refund_id: data.refund_id
      };

    } catch (error) {
      console.error('Refund processing failed:', error);
      throw error;
    }
  }

  /**
   * Get payment method details
   */
  static async getPaymentMethod(paymentMethodId: string): Promise<any> {
    const stripe = await this.initialize();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      // This would typically be done server-side
      // For demo purposes, we'll return mock data
      return {
        id: paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        }
      };

    } catch (error) {
      console.error('Payment method fetch failed:', error);
      throw error;
    }
  }

  /**
   * Calculate processing fees
   */
  static calculateFees(amount: number, paymentMethod: string = 'card'): {
    platformFee: number;
    processingFee: number;
    totalFees: number;
    netAmount: number;
  } {
    const platformFeeRate = 0.025; // 2.5%
    const processingFeeRate = paymentMethod === 'card' ? 0.029 : 0.008; // 2.9% for cards, 0.8% for ACH
    const processingFixedFee = paymentMethod === 'card' ? 0.30 : 0.80;

    const platformFee = amount * platformFeeRate;
    const processingFee = (amount * processingFeeRate) + processingFixedFee;
    const totalFees = platformFee + processingFee;
    const netAmount = amount - totalFees;

    return {
      platformFee: Math.round(platformFee * 100) / 100,
      processingFee: Math.round(processingFee * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100
    };
  }
}
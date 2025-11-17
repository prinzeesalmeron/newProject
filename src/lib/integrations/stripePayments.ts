import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { supabase } from '../supabase';

/**
 * Comprehensive Stripe Payment Integration
 * Supports: Payment Intents, Setup Intents, Subscriptions, ACH, Connect
 */

export interface PaymentMethodDetails {
  id: string;
  type: 'card' | 'bank_account' | 'us_bank_account';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
  };
  bank_account?: {
    bank_name: string;
    last4: string;
    account_holder_type: string;
    routing_number: string;
  };
  billing_details: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  created: number;
}

export interface PaymentIntentResult {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
  payment_method?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export class StripePaymentService {
  private static stripe: Stripe | null = null;
  private static readonly publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  /**
   * Initialize Stripe with advanced configuration
   */
  static async initialize(): Promise<Stripe | null> {
    if (!this.publicKey) {
      console.warn('Stripe public key not configured');
      return null;
    }

    if (!this.stripe) {
      this.stripe = await loadStripe(this.publicKey, {
        locale: 'en',
        apiVersion: '2023-10-16'
      });
    }

    return this.stripe;
  }

  /**
   * Create payment intent for property investment
   */
  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, any> = {}
  ): Promise<PaymentIntentResult> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            metadata,
            payment_method_types: ['card', 'us_bank_account'],
            capture_method: 'automatic'
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment intent creation failed');
      }

      const data = await response.json();

      return {
        id: data.payment_intent.id,
        amount: data.payment_intent.amount,
        currency: data.payment_intent.currency,
        status: data.payment_intent.status,
        client_secret: data.payment_intent.client_secret,
        metadata: data.payment_intent.metadata
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  }

  /**
   * Confirm payment with card
   */
  static async confirmCardPayment(
    clientSecret: string,
    paymentMethodId?: string,
    billingDetails?: any
  ): Promise<{ success: boolean; paymentIntent?: any; error?: string }> {
    const stripe = await this.initialize();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId || {
          card: {} as any, // Card element will be passed from form
          billing_details: billingDetails
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (paymentIntent) {
        await this.logPaymentSuccess(paymentIntent);
      }

      return { success: true, paymentIntent };
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm ACH/Bank payment
   */
  static async confirmBankPayment(
    clientSecret: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; paymentIntent?: any; error?: string }> {
    const stripe = await this.initialize();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error, paymentIntent } = await stripe.confirmUsBankAccountPayment(clientSecret, {
        payment_method: paymentMethodId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (paymentIntent) {
        await this.logPaymentSuccess(paymentIntent);
      }

      return { success: true, paymentIntent };
    } catch (error: any) {
      console.error('Bank payment confirmation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save payment method for future use
   */
  static async savePaymentMethod(
    userId: string,
    paymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<void> {
    try {
      await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          stripe_payment_method_id: paymentMethodId,
          is_default: setAsDefault,
          created_at: new Date().toISOString()
        });

      if (setAsDefault) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', userId)
          .neq('stripe_payment_method_id', paymentMethodId);
      }
    } catch (error) {
      console.error('Failed to save payment method:', error);
      throw error;
    }
  }

  /**
   * Get saved payment methods
   */
  static async getPaymentMethods(userId: string): Promise<PaymentMethodDetails[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(pm => ({
        id: pm.stripe_payment_method_id,
        type: pm.type || 'card',
        card: pm.card_details,
        bank_account: pm.bank_details,
        billing_details: pm.billing_details || {},
        created: new Date(pm.created_at).getTime() / 1000
      }));
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  }

  /**
   * Delete saved payment method
   */
  static async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-payment-method`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            user_id: userId,
            payment_method_id: paymentMethodId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      await supabase
        .from('payment_methods')
        .delete()
        .eq('user_id', userId)
        .eq('stripe_payment_method_id', paymentMethodId);
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason: string = 'requested_by_customer'
  ): Promise<{ success: boolean; refund_id?: string; error?: string }> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined,
            reason
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      const data = await response.json();

      await this.logRefund(paymentIntentId, data.refund_id, amount);

      return {
        success: true,
        refund_id: data.refund_id
      };
    } catch (error: any) {
      console.error('Refund processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Stripe Connect account for property owners
   */
  static async createConnectAccount(
    userId: string,
    email: string,
    businessType: 'individual' | 'company' = 'individual'
  ): Promise<{ account_id: string; onboarding_url: string }> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            user_id: userId,
            email,
            business_type: businessType,
            return_url: `${window.location.origin}/dashboard/connect/return`,
            refresh_url: `${window.location.origin}/dashboard/connect/refresh`
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create Connect account');
      }

      const data = await response.json();

      return {
        account_id: data.account_id,
        onboarding_url: data.onboarding_url
      };
    } catch (error) {
      console.error('Connect account creation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate fees including platform and processing fees
   */
  static calculateFees(
    amount: number,
    paymentMethod: 'card' | 'ach' = 'card'
  ): {
    subtotal: number;
    platformFee: number;
    processingFee: number;
    totalFees: number;
    total: number;
  } {
    const platformFeeRate = 0.025; // 2.5%
    const processingFeeRate = paymentMethod === 'card' ? 0.029 : 0.008; // 2.9% card, 0.8% ACH
    const processingFixedFee = paymentMethod === 'card' ? 0.30 : 0.80;

    const platformFee = amount * platformFeeRate;
    const processingFee = (amount * processingFeeRate) + processingFixedFee;
    const totalFees = platformFee + processingFee;
    const total = amount + totalFees;

    return {
      subtotal: Math.round(amount * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      processingFee: Math.round(processingFee * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntentResult | null> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error || !data) return null;

      return {
        id: data.stripe_payment_intent_id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        client_secret: '',
        payment_method: data.payment_method_id,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Failed to get payment status:', error);
      return null;
    }
  }

  // Private helper methods

  private static async logPaymentSuccess(paymentIntent: any): Promise<void> {
    try {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'succeeded',
          payment_method_id: paymentIntent.payment_method,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      // Log security event
      await supabase
        .from('security_events')
        .insert({
          event_type: 'payment_successful',
          severity: 'info',
          metadata: {
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100
          }
        });
    } catch (error) {
      console.error('Failed to log payment success:', error);
    }
  }

  private static async logRefund(
    paymentIntentId: string,
    refundId: string,
    amount?: number
  ): Promise<void> {
    try {
      await supabase
        .from('payment_transactions')
        .update({
          refund_id: refundId,
          refund_amount: amount,
          refunded_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      await supabase
        .from('security_events')
        .insert({
          event_type: 'payment_refunded',
          severity: 'warning',
          metadata: {
            payment_intent_id: paymentIntentId,
            refund_id: refundId,
            amount
          }
        });
    } catch (error) {
      console.error('Failed to log refund:', error);
    }
  }
}

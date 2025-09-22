import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { StripeService } from '../lib/services/stripeService';
import { toast } from './ui/Toast';
import { motion } from 'framer-motion';

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  propertyId?: string;
  propertyTitle?: string;
  tokenAmount?: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency = 'USD',
  propertyId,
  propertyTitle,
  tokenAmount,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [fees, setFees] = useState<any>(null);

  useEffect(() => {
    initializePayment();
  }, [amount]);

  const initializePayment = async () => {
    try {
      // Calculate fees
      const feeData = StripeService.calculateFees(amount, 'card');
      setFees(feeData);

      // Create payment intent
      const { client_secret } = await StripeService.createPaymentIntent(
        amount + feeData.totalFees,
        currency,
        {
          property_id: propertyId,
          property_title: propertyTitle,
          token_amount: tokenAmount,
          transaction_type: 'investment'
        }
      );

      setClientSecret(client_secret);

    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      onError(error.message);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer Name', // This would come from user profile
          },
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        toast.success('Payment Successful', 'Your investment has been processed!');
      } else {
        throw new Error('Payment not completed');
      }

    } catch (error: any) {
      console.error('Payment failed:', error);
      onError(error.message);
      toast.error('Payment Failed', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Secure Payment</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Powered by Stripe</p>
        </div>
      </div>

      {/* Investment Summary */}
      {propertyTitle && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Investment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Property:</span>
              <span className="font-medium text-gray-900 dark:text-white">{propertyTitle}</span>
            </div>
            {tokenAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                <span className="font-medium text-gray-900 dark:text-white">{tokenAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Investment Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">${amount.toLocaleString()}</span>
            </div>
            {fees && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Platform Fee:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${fees.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${fees.processingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">${(amount + fees.totalFees).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Element */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-1">
                Secure Payment Processing
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Your payment information is encrypted and processed securely by Stripe. 
                We never store your card details on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Pay ${fees ? (amount + fees.totalFees).toLocaleString() : amount.toLocaleString()}</span>
            </>
          )}
        </button>
      </form>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Powered by</span>
          <div className="flex items-center space-x-2">
            <img src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-blue.png" alt="Stripe" className="h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
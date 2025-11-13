import React, { useState, useEffect } from 'react';
import { CreditCard, Building2, Plus, Trash2, Check, AlertCircle, Lock, Shield } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  bank_name?: string;
  account_type?: string;
  is_default: boolean;
  created_at: string;
}

const CARD_ELEMENT_OPTIONS = {
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
};

const AddPaymentMethodForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'card' | 'bank'>('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (paymentType === 'card') {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (!paymentMethod) {
          throw new Error('Failed to create payment method');
        }

        const { error: dbError } = await supabase
          .from('payment_methods')
          .insert({
            user_id: user.id,
            stripe_payment_method_id: paymentMethod.id,
            type: 'card',
            last4: paymentMethod.card?.last4 || '',
            brand: paymentMethod.card?.brand || '',
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
            is_default: false,
          });

        if (dbError) throw dbError;

        onSuccess();
      }
    } catch (err: any) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Payment Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentType('card')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentType === 'card'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
              paymentType === 'card' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Credit/Debit Card</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('bank')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentType === 'bank'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <Building2 className={`h-6 w-6 mx-auto mb-2 ${
              paymentType === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Bank Account</div>
          </button>
        </div>
      </div>

      {paymentType === 'card' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Card Details
          </label>
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
      )}

      {paymentType === 'bank' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                Bank Account Coming Soon
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ACH bank transfers will be available in the next update. For now, please use a credit or debit card.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
        <Lock className="h-4 w-4" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || paymentType === 'bank'}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
        >
          {loading ? 'Adding...' : 'Add Payment Method'}
        </button>
      </div>
    </form>
  );
};

export const FiatPaymentGateway: React.FC = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      await loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!user) return;

    try {
      setDeletingId(methodId);
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getCardIcon = (brand?: string) => {
    return <CreditCard className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fiat Payment Gateway</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your credit cards and bank accounts for property investments
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Payment Method</span>
          </button>
        )}
      </div>

      {/* Security Badge */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">
              Secure Payment Processing
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              All payments are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment Method Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add New Payment Method
          </h3>
          <Elements stripe={stripePromise}>
            <AddPaymentMethodForm
              onSuccess={() => {
                setShowAddForm(false);
                loadPaymentMethods();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </Elements>
        </motion.div>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Payment Methods
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add a payment method to start investing in properties
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Your First Payment Method</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all ${
                method.is_default
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {method.type === 'card' ? (
                      getCardIcon(method.brand)
                    ) : (
                      <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {method.type === 'card' ? (
                        <>
                          {method.brand?.toUpperCase()} •••• {method.last4}
                        </>
                      ) : (
                        <>
                          {method.bank_name} •••• {method.last4}
                        </>
                      )}
                    </div>
                    {method.type === 'card' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Expires {method.exp_month}/{method.exp_year}
                      </div>
                    )}
                    {method.type === 'bank_account' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {method.account_type}
                      </div>
                    )}
                  </div>
                </div>
                {method.is_default && (
                  <span className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    <Check className="h-3 w-3" />
                    <span>Default</span>
                  </span>
                )}
              </div>

              <div className="flex space-x-2">
                {!method.is_default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  disabled={deletingId === method.id}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-red-300 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deletingId === method.id ? 'Deleting...' : 'Remove'}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
          Accepted Payment Methods
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Credit Cards (Visa, Mastercard, American Express, Discover)</li>
          <li>• Debit Cards</li>
          <li>• ACH Bank Transfers (Coming Soon)</li>
        </ul>
      </div>
    </div>
  );
};

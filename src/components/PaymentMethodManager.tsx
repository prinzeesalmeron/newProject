import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Star, Shield, AlertCircle } from 'lucide-react';
import { PaymentService } from '../lib/services/paymentService';
import { useAuth } from '../lib/auth';
import { toast } from './ui/Toast';
import { motion } from 'framer-motion';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'crypto_wallet' | 'paypal';
  provider: string;
  last_four: string;
  is_primary: boolean;
  is_verified: boolean;
  metadata: any;
}

export const PaymentMethodManager = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingMethod, setAddingMethod] = useState(false);

  // Add payment method form
  const [newMethodForm, setNewMethodForm] = useState({
    type: 'credit_card' as PaymentMethod['type'],
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: '',
    email: '',
    routingNumber: '',
    accountNumber: ''
  });

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      if (!user) return;
      
      const methods = await PaymentService.getUserPaymentMethods(user.id);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setAddingMethod(true);

      // Mock Stripe token creation
      const mockToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newMethod = await PaymentService.addPaymentMethod(user.id, {
        type: newMethodForm.type,
        provider: newMethodForm.type === 'credit_card' ? 'stripe' : 'plaid',
        token: mockToken,
        metadata: {
          card_brand: 'visa',
          exp_month: newMethodForm.expiryMonth,
          exp_year: newMethodForm.expiryYear
        }
      });

      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddForm(false);
      setNewMethodForm({
        type: 'credit_card',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        name: '',
        email: '',
        routingNumber: '',
        accountNumber: ''
      });

      toast.success('Payment Method Added', 'Your payment method has been added successfully.');

    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to Add Payment Method', error.message);
    } finally {
      setAddingMethod(false);
    }
  };

  const handleSetPrimary = async (methodId: string) => {
    try {
      // Update primary status (mock implementation)
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        is_primary: method.id === methodId
      })));

      toast.success('Primary Method Updated', 'Your primary payment method has been updated.');
    } catch (error) {
      console.error('Error setting primary method:', error);
      toast.error('Update Failed', 'Failed to update primary payment method.');
    }
  };

  const handleRemoveMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      // Remove payment method (mock implementation)
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      toast.success('Payment Method Removed', 'Payment method has been removed successfully.');
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Removal Failed', 'Failed to remove payment method.');
    }
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit_card': return <CreditCard className="h-5 w-5" />;
      case 'bank_account': return <DollarSign className="h-5 w-5" />;
      case 'crypto_wallet': return <Zap className="h-5 w-5" />;
      case 'paypal': return <Shield className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodColor = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit_card': return 'text-blue-600 dark:text-blue-400';
      case 'bank_account': return 'text-green-600 dark:text-green-400';
      case 'crypto_wallet': return 'text-purple-600 dark:text-purple-400';
      case 'paypal': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
        <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Sign In Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to manage your payment methods and start investing
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Method</span>
        </button>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Payment Methods</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add a payment method to start investing in properties
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Add Your First Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${getMethodColor(method.type)}`}>
                  {getMethodIcon(method.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {method.provider} •••• {method.last_four}
                    </span>
                    {method.is_primary && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {method.type.replace('_', ' ')}
                    {method.is_verified ? (
                      <span className="ml-2 text-green-600 dark:text-green-400">• Verified</span>
                    ) : (
                      <span className="ml-2 text-yellow-600 dark:text-yellow-400">• Pending</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!method.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(method.id)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleRemoveMethod(method.id)}
                  className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Payment Method Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Payment Method</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method Type
                </label>
                <select
                  value={newMethodForm.type}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, type: e.target.value as PaymentMethod['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_account">Bank Account</option>
                  <option value="paypal">PayPal</option>
                  <option value="crypto_wallet">Crypto Wallet</option>
                </select>
              </div>

              {newMethodForm.type === 'credit_card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={newMethodForm.cardNumber}
                      onChange={(e) => setNewMethodForm({ ...newMethodForm, cardNumber: e.target.value })}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Month
                      </label>
                      <select
                        value={newMethodForm.expiryMonth}
                        onChange={(e) => setNewMethodForm({ ...newMethodForm, expiryMonth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Year
                      </label>
                      <select
                        value={newMethodForm.expiryYear}
                        onChange={(e) => setNewMethodForm({ ...newMethodForm, expiryYear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">YY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year.toString().slice(-2)}>
                              {year.toString().slice(-2)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={newMethodForm.cvc}
                        onChange={(e) => setNewMethodForm({ ...newMethodForm, cvc: e.target.value })}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={newMethodForm.name}
                      onChange={(e) => setNewMethodForm({ ...newMethodForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {newMethodForm.type === 'bank_account' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      value={newMethodForm.routingNumber}
                      onChange={(e) => setNewMethodForm({ ...newMethodForm, routingNumber: e.target.value })}
                      placeholder="123456789"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={newMethodForm.accountNumber}
                      onChange={(e) => setNewMethodForm({ ...newMethodForm, accountNumber: e.target.value })}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {newMethodForm.type === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    value={newMethodForm.email}
                    onChange={(e) => setNewMethodForm({ ...newMethodForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Secure Processing:</strong> All payment information is encrypted and processed securely through our PCI-compliant payment partners.
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMethod}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
                >
                  {addingMethod ? 'Adding...' : 'Add Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
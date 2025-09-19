import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { PaymentService } from '../lib/services/paymentService';
import { useAuth } from '../lib/auth';
import { toast } from './ui/Toast';
import { motion } from 'framer-motion';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  tokenAmount: number;
  pricePerToken: number;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  tokenAmount,
  pricePerToken,
  onSuccess
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'payment-method' | 'processing' | 'confirmation'>('payment-method');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<any>(null);

  const totalCost = tokenAmount * pricePerToken;

  useEffect(() => {
    if (isOpen && user) {
      loadPaymentMethods();
      calculateFees();
    }
  }, [isOpen, user]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await PaymentService.getUserPaymentMethods(user!.id);
      setPaymentMethods(methods);
      
      // Select primary method by default
      const primaryMethod = methods.find(m => m.is_primary);
      if (primaryMethod) {
        setSelectedPaymentMethod(primaryMethod.id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const calculateFees = async () => {
    try {
      const feeData = await PaymentService.calculateInvestmentFees(totalCost);
      setFees(feeData);
    } catch (error) {
      console.error('Error calculating fees:', error);
    }
  };

  const handlePayment = async () => {
    if (!user || !selectedPaymentMethod) return;

    try {
      setLoading(true);
      setStep('processing');

      // Process investment with escrow
      const result = await PaymentService.processPropertyInvestment(
        user.id,
        propertyId,
        tokenAmount,
        totalCost + (fees?.total_fees || 0),
        selectedPaymentMethod
      );

      if (result.success) {
        setStep('confirmation');
        toast.success(
          'Investment Successful!',
          `Your investment of $${totalCost} in ${propertyTitle} has been processed.`
        );
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      }

    } catch (error: any) {
      console.error('Payment failed:', error);
      toast.error('Payment Failed', error.message || 'Please try again.');
      setStep('payment-method');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // In production, this would open Stripe Elements or similar
    alert('Add payment method functionality would integrate with Stripe Elements here');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Complete Investment
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Investment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Property:</span>
              <span className="font-medium text-gray-900 dark:text-white">{propertyTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Price per Token:</span>
              <span className="font-medium text-gray-900 dark:text-white">${pricePerToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-white">${totalCost.toLocaleString()}</span>
            </div>
            {fees && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Platform Fee:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${fees.platform_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${fees.processing_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">${(totalCost + fees.total_fees).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Method Selection */}
        {step === 'payment-method' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Select Payment Method</h3>
            
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No payment methods added</p>
                <button
                  onClick={handleAddPaymentMethod}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Payment Method
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {method.provider} •••• {method.last_four}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {method.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    {method.is_primary && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                        Primary
                      </span>
                    )}
                  </label>
                ))}
                
                <button
                  onClick={handleAddPaymentMethod}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  + Add New Payment Method
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-1">
                    Secure Escrow Protection
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your payment is held in secure escrow until property tokens are delivered. 
                    Funds are automatically released upon successful token transfer.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod || loading}
                className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
              >
                Invest ${(totalCost + (fees?.total_fees || 0)).toLocaleString()}
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Processing Your Investment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please wait while we process your payment and prepare your property tokens.
            </p>
            
            <div className="space-y-3 text-left max-w-sm mx-auto">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Payment authorized</span>
              </div>
              <div className="flex items-center space-x-3">
                <Loader className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Creating escrow transaction</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Preparing property tokens</span>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirmation' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Investment Successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your investment has been processed and {tokenAmount} property tokens have been added to your portfolio.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-gray-900 dark:text-white">TXN-{Date.now()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tokens Received:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{tokenAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(totalCost + (fees?.total_fees || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              View Portfolio
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
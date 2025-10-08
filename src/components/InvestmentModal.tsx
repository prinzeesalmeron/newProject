import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Wallet, DollarSign, Info, AlertCircle } from 'lucide-react';
import { Property } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Button, LoadingSpinner } from './ui';
import { toast } from './ui/Toast';
import { TransactionAPI } from '../lib/api/transactionAPI';
import { PropertyAPI } from '../lib/api/propertyAPI';
import { supabase } from '../lib/supabase';

interface InvestmentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [tokenAmount, setTokenAmount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user || !supabase) {
        setLoadingBalance(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('block_balance')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        setWalletBalance(data?.block_balance || 0);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setWalletBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };

    if (isOpen) {
      fetchWalletBalance();
    }
  }, [isOpen, user]);


  if (!isOpen) return null;

  const totalCost = tokenAmount * property.price_per_token;
  const estimatedReturn = (totalCost * property.projected_return) / 100;
  const maxTokens = Math.min(property.available_tokens, 100);

  const handleIncrease = () => {
    if (tokenAmount < maxTokens) {
      setTokenAmount(tokenAmount + 1);
    }
  };

  const handleDecrease = () => {
    if (tokenAmount > 1) {
      setTokenAmount(tokenAmount - 1);
    }
  };

  const handleInvest = async () => {
    if (!user) {
      toast.error('Authentication Required', 'Please sign in to invest');
      return;
    }

    if (tokenAmount <= 0 || tokenAmount > property.available_tokens) {
      toast.error('Invalid Amount', 'Please select a valid number of tokens');
      return;
    }

    if (totalCost > walletBalance) {
      toast.error('Insufficient Balance', `You need $${totalCost.toLocaleString()} but only have $${walletBalance.toLocaleString()} in your wallet`);
      return;
    }

    setIsProcessing(true);

    try {
      await TransactionAPI.processPropertyInvestment(
        user.id,
        property.id,
        tokenAmount,
        totalCost
      );

      toast.success(
        'Investment Successful!',
        `You've successfully invested $${totalCost.toLocaleString()} in ${property.title}`
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Investment failed:', error);
      toast.error(
        'Investment Failed',
        error.message || 'An error occurred while processing your investment'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Invest in Property
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {property.title}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <img
              src={property.image_url}
              alt={property.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {property.location}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Expected Return</div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {property.projected_return}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Available Tokens</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {property.available_tokens.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                    Wallet Balance
                  </p>
                  {loadingBalance ? (
                    <p className="text-xs text-blue-800 dark:text-blue-200">Loading...</p>
                  ) : (
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      ${walletBalance.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {!loadingBalance && totalCost > walletBalance && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Insufficient funds</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Tokens
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleDecrease}
                  disabled={tokenAmount <= 1 || isProcessing}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setTokenAmount(Math.max(1, Math.min(value, maxTokens)));
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max={maxTokens}
                />
                <button
                  onClick={handleIncrease}
                  disabled={tokenAmount >= maxTokens || isProcessing}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Min: 1 token</span>
                <span>Max: {maxTokens} tokens</span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Price per Token</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${property.price_per_token.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Number of Tokens</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {tokenAmount}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Investment
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Est. Annual Return
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ${estimatedReturn.toLocaleString()} ({property.projected_return}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              disabled={isProcessing}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvest}
              disabled={isProcessing || loadingBalance || totalCost > walletBalance}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Invest Now
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By investing, you agree to our terms and conditions. All investments carry risk.
          </div>
        </div>
      </div>
    </div>
  );
};

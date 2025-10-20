import React, { useState, useEffect } from 'react';
import { X, Upload, Wallet, Check, AlertCircle } from 'lucide-react';
import { Property } from '../lib/supabase';
import { useWalletConnector } from '../lib/blockchain/walletConnector';
import { propertyTokenizationService, PropertyTokenizationData } from '../lib/blockchain/propertyTokenization';
import { getExplorerTxUrl } from '../lib/contractConfig';

interface AddPropertyModalWithBlockchainProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>, blockchainData?: {
    propertyId: number;
    transactionHash: string;
    blockNumber: number;
  }) => void;
}

type TokenizationStep = 'form' | 'wallet-check' | 'estimating' | 'confirm' | 'tokenizing' | 'saving' | 'success';

export const AddPropertyModalWithBlockchain: React.FC<AddPropertyModalWithBlockchainProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { isConnected, address, connect } = useWalletConnector();
  const [step, setStep] = useState<TokenizationStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [gasEstimate, setGasEstimate] = useState<{ gasEstimate: string; gasCostETH: string } | null>(null);
  const [txHash, setTxHash] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    location: '',
    property_type: 'Single Family' as Property['property_type'],
    price_per_token: 0,
    total_tokens: 0,
    available_tokens: 0,
    rental_yield: 0,
    projected_return: 0,
    rating: 0,
    features: '',
    is_yield_property: true,
    yield_percentage: '',
    status: 'active' as Property['status']
  });

  // Check wallet connection on mount
  useEffect(() => {
    if (isOpen && !isConnected) {
      setStep('wallet-check');
    } else if (isOpen && isConnected) {
      setStep('form');
    }
  }, [isOpen, isConnected]);

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      await connect('metamask');
      setStep('form');
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateGas = async () => {
    setLoading(true);
    setError('');
    setStep('estimating');

    try {
      const tokenizationData: PropertyTokenizationData = {
        title: formData.title,
        location: formData.location,
        totalTokens: formData.total_tokens,
        pricePerToken: formData.price_per_token,
        description: formData.description,
        imageUrl: formData.image_url,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };

      const estimate = await propertyTokenizationService.estimateTokenizationCost(tokenizationData);
      setGasEstimate(estimate);
      setStep('confirm');
    } catch (err: any) {
      console.error('Gas estimation failed:', err);
      setError(err.message || 'Failed to estimate gas cost');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenizeProperty = async () => {
    setLoading(true);
    setError('');
    setStep('tokenizing');

    try {
      // Step 1: Tokenize on blockchain
      const tokenizationData: PropertyTokenizationData = {
        title: formData.title,
        location: formData.location,
        totalTokens: formData.total_tokens,
        pricePerToken: formData.price_per_token,
        description: formData.description,
        imageUrl: formData.image_url,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };

      console.log('Tokenizing property on blockchain...');
      const result = await propertyTokenizationService.tokenizeProperty(tokenizationData);

      if (!result.success) {
        throw new Error(result.error || 'Tokenization failed');
      }

      console.log('Property tokenized successfully:', result);
      setTxHash(result.transactionHash || '');
      setStep('saving');

      // Step 2: Save to database
      const property: Omit<Property, 'id' | 'created_at' | 'updated_at'> = {
        ...formData,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
        yield_percentage: formData.yield_percentage || `${formData.rental_yield}%`,
        available_tokens: formData.total_tokens // All tokens available initially
      };

      const blockchainData = {
        propertyId: result.propertyId!,
        transactionHash: result.transactionHash!,
        blockNumber: result.blockNumber!
      };

      await onAdd(property, blockchainData);

      setStep('success');

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (err: any) {
      console.error('Tokenization failed:', err);
      setError(err.message || 'Failed to tokenize property');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setError('');
    setGasEstimate(null);
    setTxHash('');
    setFormData({
      title: '',
      description: '',
      image_url: '',
      location: '',
      property_type: 'Single Family',
      price_per_token: 0,
      total_tokens: 0,
      available_tokens: 0,
      rental_yield: 0,
      projected_return: 0,
      rating: 0,
      features: '',
      is_yield_property: true,
      yield_percentage: '',
      status: 'active'
    });
    onClose();
  };

  if (!isOpen) return null;

  // Wallet Connection Step
  if (step === 'wallet-check') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You need to connect your wallet to tokenize properties on the blockchain.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Wallet className="h-5 w-5" />
                <span>{loading ? 'Connecting...' : 'Connect MetaMask'}</span>
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Gas Estimation Confirmation Step
  if (step === 'confirm' && gasEstimate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Confirm Tokenization
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review the details and gas cost before tokenizing this property.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Property:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Location:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formData.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Tokens:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formData.total_tokens}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Price per Token:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">${formData.price_per_token}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Gas:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{gasEstimate.gasEstimate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gas Cost:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">~{parseFloat(gasEstimate.gasCostETH).toFixed(6)} ETH</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleTokenizeProperty}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Confirm & Tokenize'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing Steps (estimating, tokenizing, saving)
  if (step === 'estimating' || step === 'tokenizing' || step === 'saving') {
    const messages = {
      estimating: 'Estimating gas cost...',
      tokenizing: 'Tokenizing property on blockchain...',
      saving: 'Saving property data...'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {messages[step]}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait and do not close this window.
            </p>
            {step === 'tokenizing' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                You may need to confirm the transaction in your wallet.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Property Tokenized Successfully!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {formData.title} has been tokenized on the blockchain.
            </p>
            {txHash && (
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View on Explorer →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Form (same as original AddPropertyModal)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tokenize New Property</h2>
              {isConnected && address && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Wallet: {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleEstimateGas(); }} className="p-6 space-y-4">
          {/* All form fields from original AddPropertyModal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Modern Downtown Apartment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the property..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property Type *
              </label>
              <select
                required
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value as Property['property_type'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Single Family">Single Family</option>
                <option value="Multi Family">Multi Family</option>
                <option value="Commercial">Commercial</option>
                <option value="Vacation Rentals">Vacation Rentals</option>
                <option value="Cash Flowing">Cash Flowing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rating (0-5) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price per Token ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price_per_token}
                onChange={(e) => setFormData({ ...formData, price_per_token: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Tokens *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.total_tokens}
                onChange={(e) => setFormData({ ...formData, total_tokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rental Yield (%) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.rental_yield}
                onChange={(e) => setFormData({ ...formData, rental_yield: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Projected Return (%) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.projected_return}
                onChange={(e) => setFormData({ ...formData, projected_return: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Features (comma-separated)
            </label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Pool, Gym, Parking, Security"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-medium mb-1">Blockchain Tokenization</p>
                <p className="text-blue-700 dark:text-blue-400">
                  This property will be tokenized as an NFT on the blockchain. You'll need to confirm the transaction in your wallet and pay gas fees.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Next: Estimate Gas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

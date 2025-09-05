import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, DollarSign, ArrowUpDown, Clock, Users, Shield } from 'lucide-react';
import { useWalletConnector } from '../../lib/blockchain/walletConnector';
import { contractManager } from '../../lib/blockchain/contractManager';
import { motion } from 'framer-motion';

interface MarketplaceListing {
  id: number;
  propertyId: number;
  seller: string;
  tokensForSale: number;
  pricePerToken: string;
  isActive: boolean;
  createdAt: number;
}

interface LiquidityPool {
  propertyId: number;
  blockAmount: string;
  tokenAmount: number;
  price: string;
}

export const TokenizedMarketplace = () => {
  const { isConnected, address } = useWalletConnector();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'liquidity' | 'my-tokens'>('listings');

  // Form states
  const [listingForm, setListingForm] = useState({
    propertyId: '',
    tokensForSale: '',
    pricePerToken: ''
  });

  const [buyForm, setBuyForm] = useState({
    listingId: '',
    amount: ''
  });

  const [liquidityForm, setLiquidityForm] = useState({
    propertyId: '',
    blockAmount: '',
    tokenAmount: ''
  });

  useEffect(() => {
    if (isConnected) {
      initializeContracts();
    }
  }, [isConnected]);

  const initializeContracts = async () => {
    try {
      await contractManager.initialize();
      loadMarketplaceData();
      setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
    }
  };

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would query events or maintain an index
      // For demo, we'll show mock data structure
      setListings([]);
      setLiquidityPools([]);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    contractManager.onTokensPurchased((propertyId, buyer, amount, totalCost) => {
      if (buyer.toLowerCase() === address?.toLowerCase()) {
        alert(`Successfully purchased ${amount} tokens for ${totalCost} BLOCK!`);
        loadMarketplaceData();
      }
    });

    contractManager.onRentalPayoutCreated((payoutId, propertyId, totalAmount) => {
      alert(`New rental payout available for property ${propertyId}: ${totalAmount} BLOCK`);
    });
  };

  const handleListTokens = async () => {
    if (!listingForm.propertyId || !listingForm.tokensForSale || !listingForm.pricePerToken) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const txHash = await contractManager.listPropertyTokens(
        parseInt(listingForm.propertyId),
        parseInt(listingForm.tokensForSale),
        listingForm.pricePerToken
      );

      alert(`Tokens listed successfully! Transaction: ${txHash}`);
      setListingForm({ propertyId: '', tokensForSale: '', pricePerToken: '' });
      loadMarketplaceData();
    } catch (error: any) {
      console.error('Listing failed:', error);
      alert(`Listing failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTokens = async () => {
    if (!buyForm.listingId || !buyForm.amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const txHash = await contractManager.buyTokensFromListing(
        parseInt(buyForm.listingId),
        parseInt(buyForm.amount)
      );

      alert(`Tokens purchased successfully! Transaction: ${txHash}`);
      setBuyForm({ listingId: '', amount: '' });
      loadMarketplaceData();
    } catch (error: any) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBuy = async (propertyId: number, tokenAmount: number) => {
    try {
      setLoading(true);
      const txHash = await contractManager.instantBuyTokens(propertyId, tokenAmount);
      alert(`Instant buy successful! Transaction: ${txHash}`);
      loadMarketplaceData();
    } catch (error: any) {
      console.error('Instant buy failed:', error);
      alert(`Instant buy failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!liquidityForm.propertyId || !liquidityForm.blockAmount || !liquidityForm.tokenAmount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      // Approve tokens first
      const blockAmount = ethers.utils.parseUnits(liquidityForm.blockAmount, 18);
      await contractManager.approveBlockTokens(CONTRACT_ADDRESSES.MARKETPLACE, blockAmount);
      await contractManager.approvePropertyTokens(CONTRACT_ADDRESSES.MARKETPLACE);

      // Add liquidity
      const tx = await contractManager.contracts.marketplace.addLiquidity(
        parseInt(liquidityForm.propertyId),
        blockAmount,
        parseInt(liquidityForm.tokenAmount)
      );
      await tx.wait();

      alert(`Liquidity added successfully! Transaction: ${tx.hash}`);
      setLiquidityForm({ propertyId: '', blockAmount: '', tokenAmount: '' });
      loadMarketplaceData();
    } catch (error: any) {
      console.error('Add liquidity failed:', error);
      alert(`Add liquidity failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Wallet to Access Tokenized Marketplace
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to trade property tokens and access liquidity pools
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Tokenized Marketplace
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Trade property tokens with instant liquidity and automated rental payouts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { id: 'listings', label: 'Active Listings', icon: TrendingUp },
            { id: 'liquidity', label: 'Liquidity Pools', icon: Zap },
            { id: 'my-tokens', label: 'My Tokens', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Listings Tab */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List Tokens */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">List Your Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property ID
                </label>
                <input
                  type="number"
                  value={listingForm.propertyId}
                  onChange={(e) => setListingForm({ ...listingForm, propertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter property ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tokens for Sale
                </label>
                <input
                  type="number"
                  value={listingForm.tokensForSale}
                  onChange={(e) => setListingForm({ ...listingForm, tokensForSale: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Number of tokens"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price per Token (BLOCK)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={listingForm.pricePerToken}
                  onChange={(e) => setListingForm({ ...listingForm, pricePerToken: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Price in BLOCK tokens"
                />
              </div>
              <button
                onClick={handleListTokens}
                disabled={loading}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Listing...' : 'List Tokens'}
              </button>
            </div>
          </motion.div>

          {/* Buy Tokens */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Buy from Listing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Listing ID
                </label>
                <input
                  type="number"
                  value={buyForm.listingId}
                  onChange={(e) => setBuyForm({ ...buyForm, listingId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter listing ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Buy
                </label>
                <input
                  type="number"
                  value={buyForm.amount}
                  onChange={(e) => setBuyForm({ ...buyForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Number of tokens"
                />
              </div>
              <button
                onClick={handleBuyTokens}
                disabled={loading}
                className="w-full bg-green-600 dark:bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Buying...' : 'Buy Tokens'}
              </button>
            </div>

            {/* Active Listings */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Active Listings</h4>
              {listings.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm">No active listings</p>
                  <p className="text-xs mt-1">List your tokens to start trading</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {listings.map((listing) => (
                    <div key={listing.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Property #{listing.propertyId}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {listing.tokensForSale} tokens @ {listing.pricePerToken} BLOCK
                          </div>
                        </div>
                        <button
                          onClick={() => handleInstantBuy(listing.propertyId, 1)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Liquidity Pools Tab */}
      {activeTab === 'liquidity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Liquidity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Liquidity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property ID
                </label>
                <input
                  type="number"
                  value={liquidityForm.propertyId}
                  onChange={(e) => setLiquidityForm({ ...liquidityForm, propertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter property ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BLOCK Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={liquidityForm.blockAmount}
                  onChange={(e) => setLiquidityForm({ ...liquidityForm, blockAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="BLOCK tokens to add"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property Tokens
                </label>
                <input
                  type="number"
                  value={liquidityForm.tokenAmount}
                  onChange={(e) => setLiquidityForm({ ...liquidityForm, tokenAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Property tokens to add"
                />
              </div>
              <button
                onClick={handleAddLiquidity}
                disabled={loading}
                className="w-full bg-purple-600 dark:bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Liquidity'}
              </button>
            </div>
          </motion.div>

          {/* Liquidity Pools */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Pools</h3>
            {liquidityPools.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">💧</div>
                <p className="text-sm">No liquidity pools yet</p>
                <p className="text-xs mt-1">Add liquidity to enable instant trading</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liquidityPools.map((pool) => (
                  <div key={pool.propertyId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Property #{pool.propertyId}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {pool.price} BLOCK/token
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <div>BLOCK: {pool.blockAmount}</div>
                      <div>Tokens: {pool.tokenAmount}</div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleInstantBuy(pool.propertyId, 1)}
                        className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        Instant Buy
                      </button>
                      <button
                        onClick={() => contractManager.instantSellTokens(pool.propertyId, 1)}
                        className="flex-1 bg-red-600 text-white py-1 px-3 rounded text-xs hover:bg-red-700 transition-colors"
                      >
                        Instant Sell
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* My Tokens Tab */}
      {activeTab === 'my-tokens' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Property Tokens</h3>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🏠</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No property tokens yet</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Purchase property tokens from the marketplace or primary sales to see them here
            </p>
          </div>
        </motion.div>
      )}

      {/* Smart Contract Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8" />
          <div>
            <h3 className="text-xl font-semibold">Blockchain-Powered Trading</h3>
            <p className="text-blue-100">Secure, transparent, and automated</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">100%</div>
            <div className="text-sm text-blue-100">On-Chain</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">0%</div>
            <div className="text-sm text-blue-100">Platform Fees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">24/7</div>
            <div className="text-sm text-blue-100">Automated Payouts</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
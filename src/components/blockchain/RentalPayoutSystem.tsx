import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useWalletConnector } from '../../lib/blockchain/walletConnector';
import { contractManager } from '../../lib/blockchain/contractManager';
import { motion } from 'framer-motion';

interface RentalPayout {
  id: number;
  propertyId: number;
  totalAmount: string;
  payoutDate: number;
  claimed: boolean;
  userShare: string;
}

interface PropertyRental {
  propertyId: number;
  propertyTitle: string;
  monthlyRent: string;
  occupancyRate: number;
  totalTokens: number;
  userTokens: number;
  userShare: number;
}

export const RentalPayoutSystem = () => {
  const { isConnected, address } = useWalletConnector();
  const [payouts, setPayouts] = useState<RentalPayout[]>([]);
  const [properties, setProperties] = useState<PropertyRental[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingPayout, setClaimingPayout] = useState<number | null>(null);

  // Mock data for demonstration
  const mockProperties: PropertyRental[] = [
    {
      propertyId: 1,
      propertyTitle: 'Downtown Luxury Apartment',
      monthlyRent: '4500',
      occupancyRate: 95,
      totalTokens: 1000,
      userTokens: 50,
      userShare: 5.0
    },
    {
      propertyId: 2,
      propertyTitle: 'Suburban Family Home',
      monthlyRent: '2800',
      occupancyRate: 100,
      totalTokens: 800,
      userTokens: 25,
      userShare: 3.125
    }
  ];

  const mockPayouts: RentalPayout[] = [
    {
      id: 1,
      propertyId: 1,
      totalAmount: '4275', // 4500 * 0.95 occupancy
      payoutDate: Date.now() - 86400000, // 1 day ago
      claimed: false,
      userShare: '213.75' // 4275 * 0.05
    },
    {
      id: 2,
      propertyId: 2,
      totalAmount: '2800',
      payoutDate: Date.now() - 172800000, // 2 days ago
      claimed: true,
      userShare: '87.50' // 2800 * 0.03125
    }
  ];

  useEffect(() => {
    if (isConnected) {
      loadRentalData();
    }
  }, [isConnected]);

  const loadRentalData = async () => {
    setLoading(true);
    try {
      // In production, this would query the blockchain for actual data
      setProperties(mockProperties);
      setPayouts(mockPayouts);
    } catch (error) {
      console.error('Error loading rental data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPayout = async (payoutId: number) => {
    if (!isConnected) return;

    try {
      setClaimingPayout(payoutId);
      
      // In production, this would call the smart contract
      const txHash = await contractManager.claimRentalPayout(payoutId);
      
      // Update local state
      setPayouts(prev => prev.map(payout => 
        payout.id === payoutId 
          ? { ...payout, claimed: true }
          : payout
      ));

      alert(`Rental payout claimed successfully! Transaction: ${txHash}`);
    } catch (error: any) {
      console.error('Claim failed:', error);
      alert(`Claim failed: ${error.message}`);
    } finally {
      setClaimingPayout(null);
    }
  };

  const totalUnclaimedAmount = payouts
    .filter(p => !p.claimed)
    .reduce((sum, p) => sum + parseFloat(p.userShare), 0);

  const totalClaimedAmount = payouts
    .filter(p => p.claimed)
    .reduce((sum, p) => sum + parseFloat(p.userShare), 0);

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
        <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Wallet for Rental Payouts
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to view and claim automated rental income from your property tokens
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Unclaimed Payouts</span>
            <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalUnclaimedAmount.toFixed(2)} BLOCK
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ${(totalUnclaimedAmount * 1.2).toFixed(2)} USD
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Claimed</span>
            <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalClaimedAmount.toFixed(2)} BLOCK
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ${(totalClaimedAmount * 1.2).toFixed(2)} USD
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Properties Owned</span>
            <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{properties.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {properties.reduce((sum, p) => sum + p.userTokens, 0)} total tokens
          </div>
        </motion.div>
      </div>

      {/* Available Payouts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Payouts</h3>
        
        {payouts.filter(p => !p.claimed).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">💰</div>
            <p className="text-sm">No unclaimed payouts</p>
            <p className="text-xs mt-1">Rental income will appear here monthly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.filter(p => !p.claimed).map((payout) => {
              const property = properties.find(p => p.propertyId === payout.propertyId);
              return (
                <div key={payout.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {property?.propertyTitle || `Property #${payout.propertyId}`}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Rental income for {new Date(payout.payoutDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {payout.userShare} BLOCK
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ${(parseFloat(payout.userShare) * 1.2).toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Your share: {property?.userShare.toFixed(2)}% ({property?.userTokens}/{property?.totalTokens} tokens)
                    </div>
                    <button
                      onClick={() => handleClaimPayout(payout.id)}
                      disabled={claimingPayout === payout.id}
                      className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                    >
                      {claimingPayout === payout.id ? 'Claiming...' : 'Claim Payout'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Property Portfolio */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Property Portfolio</h3>
        
        {properties.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🏠</div>
            <p className="text-sm">No properties owned</p>
            <p className="text-xs mt-1">Purchase property tokens to start earning rental income</p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.propertyId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{property.propertyTitle}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Property #{property.propertyId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {property.userTokens} / {property.totalTokens} tokens
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {property.userShare.toFixed(2)}% ownership
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Monthly Rent</div>
                    <div className="font-semibold text-gray-900 dark:text-white">${property.monthlyRent}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Occupancy</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{property.occupancyRate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Your Monthly Income</div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      ${((parseFloat(property.monthlyRent) * property.occupancyRate / 100) * property.userShare / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Next payout: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        property.occupancyRate === 100 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {property.occupancyRate === 100 ? 'Fully Occupied' : 'Partially Vacant'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payout History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payout History</h3>
        
        {payouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">No payout history</p>
            <p className="text-xs mt-1">Rental payouts will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => {
              const property = properties.find(p => p.propertyId === payout.propertyId);
              return (
                <div key={payout.id} className={`border rounded-lg p-4 ${
                  payout.claimed 
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700' 
                    : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {property?.propertyTitle || `Property #${payout.propertyId}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payout.payoutDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {payout.userShare} BLOCK
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ${(parseFloat(payout.userShare) * 1.2).toFixed(2)} USD
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {payout.claimed ? (
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Claimed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimPayout(payout.id)}
                          disabled={claimingPayout === payout.id}
                          className="bg-green-600 dark:bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                        >
                          {claimingPayout === payout.id ? 'Claiming...' : 'Claim'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white"
      >
        <h3 className="text-xl font-semibold mb-4">Automated Rental Payouts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">Monthly Distribution</h4>
            <p className="text-sm text-blue-100">
              Rental income is automatically distributed to token holders every month
            </p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">Proportional Shares</h4>
            <p className="text-sm text-blue-100">
              Your payout is proportional to your token ownership percentage
            </p>
          </div>
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">Instant Claims</h4>
            <p className="text-sm text-blue-100">
              Claim your rental income instantly with one blockchain transaction
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
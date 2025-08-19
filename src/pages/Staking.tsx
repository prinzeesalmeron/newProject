import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Lock } from 'lucide-react';
import { StakingPoolCard } from '../components/StakingPoolCard';
import { StakingPool, mockApi } from '../lib/mockData';
import { motion } from 'framer-motion';

export const Staking = () => {
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const stakingStats = {
    totalStaked: '7,500',
    totalRewards: '173.56',
    averageAPY: '7.8%',
    availableBalance: '2,340'
  };

  useEffect(() => {
    fetchStakingPools();
  }, []);

  const fetchStakingPools = async () => {
    try {
      const data = await mockApi.getStakingPools();
      setPools(data);
      if (data && data.length > 0) {
        setSelectedPool(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching staking pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = () => {
    console.log('Staking:', stakeAmount, 'in pool:', selectedPool);
    // Handle staking logic
  };

  const selectedPoolData = pools.find(pool => pool.id === selectedPool);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Staking Rewards</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stake your BLOCK tokens to earn passive rewards and participate in platform governance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Total Staked</div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stakingStats.totalStaked} BLOCK</div>
              <div className="text-sm text-gray-500">$18,750 USD value</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Total Rewards</div>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stakingStats.totalRewards} BLOCK</div>
              <div className="text-sm text-green-500">+12.3% this month</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Average APY</div>
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stakingStats.averageAPY}</div>
              <div className="text-sm text-gray-500">Weighted average</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Available Balance</div>
                <Lock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stakingStats.availableBalance} BLOCK</div>
              <div className="text-sm text-gray-500">Ready to stake</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Staking Interface */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stake Your Tokens */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Stake Your Tokens</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Staking Pool
                  </label>
                  <div className="space-y-3">
                    {pools.map((pool) => (
                      <StakingPoolCard
                        key={pool.id}
                        pool={pool}
                        isSelected={selectedPool === pool.id}
                        onSelect={setSelectedPool}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Stake
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      BLOCK
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">Available: 2,340 BLOCK</span>
                    <button
                      onClick={() => setStakeAmount('2340')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Use Max
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStake}
                disabled={!stakeAmount || !selectedPool}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>Stake Tokens</span>
              </button>
            </motion.div>

            {/* Rewards Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Rewards Calculator</h3>
              </div>

              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-600 mb-4">
                  Enter an amount and select a pool to calculate rewards
                </p>
                {selectedPoolData && stakeAmount && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900">
                      Estimated Annual Rewards
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mt-2">
                      {(parseFloat(stakeAmount) * selectedPoolData.apy / 100).toFixed(2)} BLOCK
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      APY: {selectedPoolData.apy}%
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Lock, Code, Zap } from 'lucide-react';
import { StakingPoolCard } from '../components/StakingPoolCard';
import { SmartContractInterface } from '../components/SmartContractInterface';
import { StakingPool, mockApi } from '../lib/mockData';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';

export const Staking = () => {
  const { user } = useAuth();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const stakingStats = {
    totalStaked: '0',
    totalRewards: '0',
    averageAPY: '0%',
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Staking Rewards</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
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
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Staked</div>
                <TrendingUp className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stakingStats.totalStaked} BLOCK</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">No tokens staked</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Rewards</div>
                <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stakingStats.totalRewards} BLOCK</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">No rewards yet</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Average APY</div>
                <TrendingUp className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stakingStats.averageAPY}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">No active stakes</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Balance</div>
                <Lock className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stakingStats.availableBalance} BLOCK</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ready to stake</div>
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
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Stake Your Tokens</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    {pools.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No staking pools available yet.</p>
                        <p className="text-sm mt-2">Staking pools will be added by the platform administrators.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount to Stake
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      BLOCK
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Available: {stakingStats.availableBalance} BLOCK</span>
                    <button
                      onClick={() => setStakeAmount(stakingStats.availableBalance)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Use Max
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStake}
                disabled={!stakeAmount || !selectedPool || !user || pools.length === 0}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {!user 
                    ? 'Sign In to Stake' 
                    : pools.length === 0 
                    ? 'No Pools Available' 
                    : 'Stake Tokens'
                  }
                </span>
              </button>
            </motion.div>

            {/* Rewards Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Rewards Calculator</h3>
              </div>

              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                {pools.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No staking pools available for rewards calculation
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Enter an amount and select a pool to calculate rewards
                  </p>
                )}
                {selectedPoolData && stakeAmount && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      Estimated Annual Rewards
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {(parseFloat(stakeAmount) * selectedPoolData.apy / 100).toFixed(2)} BLOCK
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      APY: {selectedPoolData.apy}%
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Smart Contract Interface */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Code className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Contract Interface</h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Interact directly with staking smart contracts. Manage your stakes, claim rewards, and transfer tokens.
            </p>
          </div>
          
          <SmartContractInterface />
        </div>
      </section>

      {/* Contract Information */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Staking Contract Features</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Pool Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stake in different pools with varying APY rates and lock periods to maximize your returns.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Automated Rewards</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rewards are calculated and distributed automatically based on your staked amount and time.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Flexible Unstaking</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Unstake your tokens at any time, subject to the specific pool's lock period requirements.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Security & Transparency</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Audited Smart Contracts</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All staking contracts undergo thorough security audits by leading blockchain security firms.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">On-Chain Transparency</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All transactions and rewards are recorded on the blockchain for complete transparency.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Non-Custodial</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You maintain full control of your tokens. We never hold custody of your assets.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
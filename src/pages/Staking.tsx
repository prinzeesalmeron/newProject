import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useWalletConnector } from '../lib/blockchain/walletConnector';
import { stakingService, StakingPool, UserStake } from '../lib/blockchain/stakingService';
import { Card, Button, LoadingSpinner } from '../components/ui';
import { toast } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';


export const Staking = () => {
  const { isConnected, address, balance } = useWalletConnector();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [selectedPool, setSelectedPool] = useState<number>(1);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingPools, setLoadingPools] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  // Load pools from blockchain
  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setLoadingPools(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await stakingService.initialize(provider);
      const poolsData = await stakingService.getAllPools();
      setPools(poolsData);

      // Check if we got mock data
      if (poolsData.length > 0 && poolsData[0].totalStaked === '125.5') {
        setUseMockData(true);
      }
    } catch (error) {
      console.error('Error loading pools:', error);
      toast.error('Failed to Load', 'Could not load staking pools');
    } finally {
      setLoadingPools(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadUserStakes();
    }
  }, [isConnected, address]);

  const loadUserStakes = async () => {
    if (!address) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await stakingService.initialize(provider);
      const stakes = await stakingService.getUserStakes(address);
      setUserStakes(stakes);
    } catch (error) {
      console.error('Error loading stakes:', error);
    }
  };

  const handleStake = async () => {
    if (useMockData) {
      toast.error('Demo Mode', 'Staking is disabled in demo mode. Deploy the contract to use this feature.');
      return;
    }

    if (!isConnected) {
      toast.error('Connect Wallet', 'Please connect your wallet to stake ETH');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid amount to stake');
      return;
    }

    if (parseFloat(stakeAmount) > parseFloat(balance)) {
      toast.error('Insufficient Balance', 'You do not have enough ETH');
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await stakingService.initialize(provider);

      const tx = await stakingService.stake(selectedPool, stakeAmount);
      toast.info('Transaction Pending', 'Waiting for confirmation...');

      await tx.wait();
      toast.success('Staking Successful', `Successfully staked ${stakeAmount} ETH!`);
      setStakeAmount('');

      // Refresh data
      await loadUserStakes();
      await loadPools();
    } catch (error: any) {
      console.error('Stake error:', error);
      toast.error('Staking Failed', error.message || 'Failed to stake ETH. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (stakeIndex: number) => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await stakingService.initialize(provider);

      const tx = await stakingService.unstake(stakeIndex);
      toast.info('Transaction Pending', 'Waiting for confirmation...');

      await tx.wait();
      toast.success('Unstake Successful', 'Successfully unstaked your ETH!');

      // Refresh data
      await loadUserStakes();
      await loadPools();
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error('Unstake Failed', error.message || 'Failed to unstake. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async (stakeIndex: number) => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await stakingService.initialize(provider);

      const tx = await stakingService.claimRewards(stakeIndex);
      toast.info('Transaction Pending', 'Waiting for confirmation...');

      await tx.wait();
      toast.success('Rewards Claimed', 'Successfully claimed your rewards!');

      // Refresh data
      await loadUserStakes();
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error('Claim Failed', error.message || 'Failed to claim rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPoolData = pools.find(p => p.id === selectedPool);
  const totalStaked = userStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
  const totalRewards = userStakes.reduce((sum, stake) => sum + parseFloat(stake.rewards || '0'), 0);

  const formatLockPeriod = (days: number) => {
    if (days === 0) return 'No Lock';
    if (days < 30) return `${days} Days`;
    if (days < 365) return `${Math.floor(days / 30)} Months`;
    return `${Math.floor(days / 365)} Years`;
  };

  if (loadingPools) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ETH Staking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stake your ETH to earn passive rewards. Choose from multiple pools with different lock periods and APY rates.
          </p>
        </motion.div>

        {/* Mock Data Banner */}
        {useMockData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                  Demo Mode
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  The staking contract is not deployed on the connected network. You're viewing demo data.
                  Actual staking requires the contract to be deployed on Lisk Sepolia testnet.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staked</span>
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaked.toFixed(4)} ETH</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ${(totalStaked * 2000).toFixed(2)} USD
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rewards</span>
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalRewards.toFixed(4)} ETH</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Claimable rewards
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Stakes</span>
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStakes.filter(s => s.active).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all pools
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</span>
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(balance).toFixed(4)} ETH</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                In your wallet
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staking Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Stake ETH</h2>

              {!isConnected ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Connect your wallet to start staking
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pool Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select Pool
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {pools.map(pool => (
                        <button
                          key={pool.id}
                          onClick={() => setSelectedPool(pool.id)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPool === pool.id
                              ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            {pool.name}
                          </div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {pool.apy}% APY
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatLockPeriod(pool.lockPeriod)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.0"
                        step="0.01"
                        min="0.01"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ETH</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Available: {parseFloat(balance).toFixed(4)} ETH</span>
                      <button
                        onClick={() => setStakeAmount(balance)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Pool Details */}
                  {selectedPoolData && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Lock Period</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatLockPeriod(selectedPoolData.lockPeriod)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">APY</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {selectedPoolData.apy}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Pool Utilization</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {((parseFloat(selectedPoolData.totalStaked) / parseFloat(selectedPoolData.maxCapacity)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      {stakeAmount && parseFloat(stakeAmount) > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-400">Estimated Yearly Rewards</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {(parseFloat(stakeAmount) * selectedPoolData.apy / 100).toFixed(4)} ETH
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleStake}
                    disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                    className="w-full"
                  >
                    {loading ? 'Staking...' : 'Stake ETH'}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Active Stakes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Stakes</h2>

              {!isConnected ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Connect wallet to view your stakes
                  </p>
                </div>
              ) : userStakes.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    You don't have any active stakes yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userStakes.map((stake, index) => {
                    const pool = pools.find(p => p.id === stake.poolId);
                    if (!pool) return null;

                    const lockEndTime = stake.startTime + pool.lockPeriod * 24 * 60 * 60 * 1000;
                    const isLocked = Date.now() < lockEndTime;
                    const daysRemaining = Math.max(0, Math.ceil((lockEndTime - Date.now()) / (24 * 60 * 60 * 1000)));

                    return (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{pool.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{pool.apy}% APY</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 dark:text-white">{stake.amount} ETH</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ${(parseFloat(stake.amount) * 2000).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-3">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Pending Rewards</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {stake.rewards} ETH
                            </span>
                          </div>
                          {isLocked && (
                            <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Locked for {daysRemaining} more days</span>
                            </div>
                          )}
                          {!isLocked && (
                            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span>Ready to unstake</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleClaimRewards(index)}
                            disabled={loading || parseFloat(stake.rewards) === 0}
                            variant="secondary"
                            className="flex-1"
                          >
                            Claim Rewards
                          </Button>
                          <Button
                            onClick={() => handleUnstake(index)}
                            disabled={loading || isLocked}
                            variant="secondary"
                            className="flex-1"
                          >
                            {isLocked ? 'Locked' : 'Unstake'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Staking Pools Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">All Staking Pools</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Pool</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Lock Period</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">APY</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Total Staked</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map(pool => (
                    <tr key={pool.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{pool.name}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                        {formatLockPeriod(pool.lockPeriod)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-green-600 dark:text-green-400 font-semibold">{pool.apy}%</span>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {pool.totalStaked} ETH
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, (parseFloat(pool.totalStaked) / parseFloat(pool.maxCapacity)) * 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {((parseFloat(pool.totalStaked) / parseFloat(pool.maxCapacity)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
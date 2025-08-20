import React, { useState, useEffect } from 'react';
import { Code, Zap, Shield, TrendingUp, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { contractService } from '../lib/contracts';
import { useWallet } from '../lib/wallet';
import { motion } from 'framer-motion';

interface Transaction {
  hash: string;
  type: 'stake' | 'unstake' | 'buy' | 'transfer' | 'claim';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  amount?: string;
  propertyId?: number;
}

export const SmartContractInterface = () => {
  const { isConnected, address } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [contractsInitialized, setContractsInitialized] = useState(false);
  
  // Contract interaction states
  const [stakeAmount, setStakeAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState(0);
  
  // Contract data
  const [blockBalance, setBlockBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');

  useEffect(() => {
    if (isConnected && address && window.ethereum) {
      initializeContracts();
    }
  }, [isConnected, address]);

  const initializeContracts = async () => {
    try {
      setLoading(true);
      await contractService.initialize(window.ethereum);
      setContractsInitialized(true);
      
      // Load user data
      await loadUserData();
      
      // Set up event listeners
      setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!address) return;
    
    try {
      const [balance, staked, rewards] = await Promise.all([
        contractService.getBlockTokenBalance(address),
        contractService.getStakedAmount(address, selectedPoolId),
        contractService.getPendingRewards(address, selectedPoolId)
      ]);
      
      setBlockBalance(balance);
      setStakedAmount(staked);
      setPendingRewards(rewards);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const setupEventListeners = () => {
    contractService.onStaked((user, poolId, amount) => {
      if (user.toLowerCase() === address?.toLowerCase()) {
        addTransaction({
          hash: 'pending',
          type: 'stake',
          status: 'confirmed',
          timestamp: Date.now(),
          amount
        });
        loadUserData();
      }
    });

    contractService.onTokensPurchased((propertyId, buyer, amount, totalCost) => {
      if (buyer.toLowerCase() === address?.toLowerCase()) {
        addTransaction({
          hash: 'pending',
          type: 'buy',
          status: 'confirmed',
          timestamp: Date.now(),
          amount: totalCost,
          propertyId
        });
      }
    });
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev.slice(0, 9)]); // Keep last 10 transactions
  };

  const handleStake = async () => {
    if (!stakeAmount || !contractsInitialized) return;
    
    try {
      setLoading(true);
      const txHash = await contractService.stakeTokens(selectedPoolId, stakeAmount);
      
      addTransaction({
        hash: txHash,
        type: 'stake',
        status: 'pending',
        timestamp: Date.now(),
        amount: stakeAmount
      });
      
      setStakeAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Staking failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!stakeAmount || !contractsInitialized) return;
    
    try {
      setLoading(true);
      const txHash = await contractService.unstakeTokens(selectedPoolId, stakeAmount);
      
      addTransaction({
        hash: txHash,
        type: 'unstake',
        status: 'pending',
        timestamp: Date.now(),
        amount: stakeAmount
      });
      
      setStakeAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Unstaking failed:', error);
      alert('Unstaking failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!contractsInitialized) return;
    
    try {
      setLoading(true);
      const txHash = await contractService.claimStakingRewards(selectedPoolId);
      
      addTransaction({
        hash: txHash,
        type: 'claim',
        status: 'pending',
        timestamp: Date.now(),
        amount: pendingRewards
      });
      
      await loadUserData();
    } catch (error) {
      console.error('Claiming rewards failed:', error);
      alert('Claiming rewards failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTo || !contractsInitialized) return;
    
    try {
      setLoading(true);
      const txHash = await contractService.transferBlockTokens(transferTo, transferAmount);
      
      addTransaction({
        hash: txHash,
        type: 'transfer',
        status: 'pending',
        timestamp: Date.now(),
        amount: transferAmount
      });
      
      setTransferAmount('');
      setTransferTo('');
      await loadUserData();
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Wallet to Access Smart Contracts
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to interact with BlockEstate smart contracts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${contractsInitialized ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
              <Code className={`h-6 w-6 ${contractsInitialized ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Contract Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {contractsInitialized ? 'Connected and ready' : 'Initializing contracts...'}
              </p>
            </div>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            contractsInitialized 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }`}>
            {contractsInitialized ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{contractsInitialized ? 'Active' : 'Loading'}</span>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white mb-1">BLOCK Token</div>
            <div className="font-mono text-gray-600 dark:text-gray-400">0x4567...0123</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white mb-1">Staking Contract</div>
            <div className="font-mono text-gray-600 dark:text-gray-400">0x2345...8901</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white mb-1">Marketplace</div>
            <div className="font-mono text-gray-600 dark:text-gray-400">0x3456...9012</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white mb-1">Property Tokens</div>
            <div className="font-mono text-gray-600 dark:text-gray-400">0x1234...7890</div>
          </div>
        </div>
      </motion.div>

      {/* User Balances */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">BLOCK Balance</span>
            <Zap className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(blockBalance).toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Available tokens</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Staked Amount</span>
            <Shield className="h-5 w-5 text-green-500 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(stakedAmount).toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Locked in staking</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Rewards</span>
            <TrendingUp className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(pendingRewards).toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Ready to claim</div>
        </div>
      </motion.div>

      {/* Contract Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staking Interface */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Staking Operations</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (BLOCK)
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Enter amount to stake/unstake"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleStake}
                disabled={loading || !contractsInitialized || !stakeAmount}
                className="bg-blue-600 dark:bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Stake'}
              </button>
              <button
                onClick={handleUnstake}
                disabled={loading || !contractsInitialized || !stakeAmount}
                className="bg-red-600 dark:bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Unstake'}
              </button>
            </div>

            <button
              onClick={handleClaimRewards}
              disabled={loading || !contractsInitialized || parseFloat(pendingRewards) === 0}
              className="w-full bg-green-600 dark:bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : `Claim ${parseFloat(pendingRewards).toFixed(2)} BLOCK`}
            </button>
          </div>
        </motion.div>

        {/* Transfer Interface */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transfer BLOCK Tokens</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (BLOCK)
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter amount to transfer"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              onClick={handleTransfer}
              disabled={loading || !contractsInitialized || !transferAmount || !transferTo}
              className="w-full bg-purple-600 dark:bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Transfer Tokens'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.status === 'confirmed' ? 'bg-green-500' : 
                    tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {tx.type} {tx.amount && `- ${parseFloat(tx.amount).toFixed(2)} BLOCK`}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                {tx.hash !== 'pending' && (
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
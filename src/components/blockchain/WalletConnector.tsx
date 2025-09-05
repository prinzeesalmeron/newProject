import React, { useState } from 'react';
import { Wallet, Shield, AlertCircle, CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { useWalletConnector, WalletProvider, SUPPORTED_NETWORKS } from '../../lib/blockchain/walletConnector';
import { motion } from 'framer-motion';

const WALLET_PROVIDERS = {
  metamask: {
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask wallet',
    downloadUrl: 'https://metamask.io/download/'
  },
  coinbase: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Connect using Coinbase Wallet',
    downloadUrl: 'https://wallet.coinbase.com/'
  },
  walletconnect: {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect using WalletConnect protocol',
    downloadUrl: 'https://walletconnect.com/'
  },
  phantom: {
    name: 'Phantom',
    icon: '👻',
    description: 'Connect using Phantom wallet (Solana)',
    downloadUrl: 'https://phantom.app/'
  }
};

export const WalletConnector = () => {
  const {
    isConnected,
    address,
    chainId,
    balance,
    connecting,
    error,
    connect,
    disconnect,
    switchNetwork
  } = useWalletConnector();

  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async (provider: WalletProvider) => {
    try {
      await connect(provider);
      setShowWalletOptions(false);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = chainId === 11155111; // Sepolia testnet
  const currentNetwork = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet Connected</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready for blockchain interactions</p>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
          >
            Disconnect
          </button>
        </div>

        {/* Network Status */}
        <div className={`p-3 rounded-lg mb-4 ${
          isCorrectNetwork 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isCorrectNetwork ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              )}
              <span className={`text-sm font-medium ${
                isCorrectNetwork 
                  ? 'text-green-800 dark:text-green-400' 
                  : 'text-yellow-800 dark:text-yellow-400'
              }`}>
                {currentNetwork?.name || `Chain ID: ${chainId}`}
              </span>
            </div>
            {!isCorrectNetwork && (
              <button
                onClick={() => switchNetwork(11155111)}
                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
              >
                Switch to Sepolia
              </button>
            )}
          </div>
        </div>

        {/* Wallet Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-900 dark:text-white">{formatAddress(address)}</span>
              <button
                onClick={handleCopyAddress}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {parseFloat(balance).toFixed(4)} ETH
            </span>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <a
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Etherscan</span>
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to interact with smart contracts and trade property tokens
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(WALLET_PROVIDERS).map(([key, wallet]) => {
          const isInstalled = key === 'metamask' ? !!window.ethereum?.isMetaMask :
                              key === 'coinbase' ? !!window.ethereum?.isCoinbaseWallet :
                              key === 'phantom' ? !!window.solana?.isPhantom :
                              true; // WalletConnect is always available

          return (
            <button
              key={key}
              onClick={() => handleConnect(key as WalletProvider)}
              disabled={connecting}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                isInstalled
                  ? 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallet.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">{wallet.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{wallet.description}</div>
                </div>
              </div>
              
              <div className="text-right">
                {isInstalled ? (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {connecting ? 'Connecting...' : 'Connect'}
                  </div>
                ) : (
                  <a
                    href={wallet.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Install
                  </a>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          New to crypto wallets?{' '}
          <a
            href="https://ethereum.org/en/wallets/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Learn more
          </a>
        </p>
      </div>
    </motion.div>
  );
};
import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle, CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from './ui/Toast';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (walletInfo: { address: string; chainId: number; provider: string }) => void;
}

type WalletProvider = 'metamask' | 'coinbase' | 'walletconnect' | 'phantom';

interface WalletOption {
  id: WalletProvider;
  name: string;
  icon: string;
  description: string;
  downloadUrl?: string;
}

const walletOptions: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Most popular Ethereum wallet',
    downloadUrl: 'https://metamask.io/download/'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔷',
    description: 'User-friendly wallet by Coinbase',
    downloadUrl: 'https://www.coinbase.com/wallet'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect with QR code',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    description: 'For Solana network',
    downloadUrl: 'https://phantom.app/'
  }
];

const SUPPORTED_CHAINS = {
  1: 'Ethereum Mainnet',
  4202: 'Lisk Sepolia Testnet',
  137: 'Polygon',
  56: 'BNB Chain',
  43114: 'Avalanche'
};

export function WalletConnectionModal({ isOpen, onClose, onConnect }: WalletConnectionModalProps) {
  const [step, setStep] = useState<'select' | 'connecting' | 'connected' | 'error'>('select');
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => {
        setStep('select');
        setSelectedWallet(null);
        setError('');
        setShowQRCode(false);
      }, 300);
    }
  }, [isOpen]);

  const detectProvider = (wallet: WalletProvider) => {
    const { ethereum } = window as any;

    switch (wallet) {
      case 'metamask':
        return ethereum?.isMetaMask ? ethereum : null;
      case 'coinbase':
        return ethereum?.isCoinbaseWallet ? ethereum : null;
      case 'phantom':
        return (window as any).phantom?.solana;
      default:
        return ethereum;
    }
  };

  const connectMetaMask = async () => {
    try {
      const provider = detectProvider('metamask');
      if (!provider) {
        setError('MetaMask not detected. Please install MetaMask extension.');
        setStep('error');
        return;
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });

      setConnectedAddress(accounts[0]);
      setChainId(parseInt(chainId, 16));
      setStep('connected');

      onConnect?.({
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        provider: 'metamask'
      });

      toast.success('MetaMask connected successfully');

      // Listen for account changes
      provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          setConnectedAddress(accounts[0]);
        }
      });

      // Listen for chain changes
      provider.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      });
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      setError(error.message || 'Failed to connect to MetaMask');
      setStep('error');
    }
  };

  const connectCoinbase = async () => {
    try {
      const provider = detectProvider('coinbase');
      if (!provider) {
        setError('Coinbase Wallet not detected. Please install Coinbase Wallet extension.');
        setStep('error');
        return;
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });

      setConnectedAddress(accounts[0]);
      setChainId(parseInt(chainId, 16));
      setStep('connected');

      onConnect?.({
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        provider: 'coinbase'
      });

      toast.success('Coinbase Wallet connected successfully');
    } catch (error: any) {
      console.error('Coinbase Wallet connection error:', error);
      setError(error.message || 'Failed to connect to Coinbase Wallet');
      setStep('error');
    }
  };

  const connectWalletConnect = async () => {
    setShowQRCode(true);
    setStep('connecting');

    // Simulate WalletConnect flow
    setTimeout(() => {
      setError('WalletConnect requires additional setup. Feature coming soon!');
      setStep('error');
      setShowQRCode(false);
    }, 2000);
  };

  const connectPhantom = async () => {
    try {
      const provider = (window as any).phantom?.solana;
      if (!provider) {
        setError('Phantom Wallet not detected. Please install Phantom extension.');
        setStep('error');
        return;
      }

      const response = await provider.connect();
      const address = response.publicKey.toString();

      setConnectedAddress(address);
      setChainId(0); // Solana doesn't use chainId
      setStep('connected');

      onConnect?.({
        address,
        chainId: 0,
        provider: 'phantom'
      });

      toast.success('Phantom connected successfully');
    } catch (error: any) {
      console.error('Phantom connection error:', error);
      setError(error.message || 'Failed to connect to Phantom');
      setStep('error');
    }
  };

  const handleConnect = async (wallet: WalletProvider) => {
    setSelectedWallet(wallet);
    setStep('connecting');
    setError('');

    switch (wallet) {
      case 'metamask':
        await connectMetaMask();
        break;
      case 'coinbase':
        await connectCoinbase();
        break;
      case 'walletconnect':
        await connectWalletConnect();
        break;
      case 'phantom':
        await connectPhantom();
        break;
    }
  };

  const handleDisconnect = () => {
    setConnectedAddress('');
    setChainId(0);
    setStep('select');
    toast.info('Wallet disconnected');
    onClose();
  };

  const switchNetwork = async (targetChainId: number) => {
    try {
      const { ethereum } = window as any;
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      toast.success('Network switched successfully');
    } catch (error: any) {
      if (error.code === 4902) {
        toast.error('Please add this network to your wallet first');
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(connectedAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {step === 'connected' ? 'Wallet Connected' : 'Connect Wallet'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Select Wallet Step */}
                {step === 'select' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose your preferred wallet to connect to BlockEstate
                    </p>
                    {walletOptions.map((wallet) => {
                      const isInstalled = detectProvider(wallet.id);
                      return (
                        <button
                          key={wallet.id}
                          onClick={() => isInstalled ? handleConnect(wallet.id) : window.open(wallet.downloadUrl, '_blank')}
                          className="w-full flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl">{wallet.icon}</span>
                            <div className="text-left">
                              <div className="font-semibold text-gray-900 dark:text-white">{wallet.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{wallet.description}</div>
                            </div>
                          </div>
                          {!isInstalled && wallet.downloadUrl && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                              Install
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Connecting Step */}
                {step === 'connecting' && (
                  <div className="text-center py-8">
                    {showQRCode ? (
                      <div>
                        <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <p className="text-gray-500 dark:text-gray-400">QR Code Placeholder</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Scan with your mobile wallet
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Connecting to {selectedWallet}...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Please approve the connection in your wallet
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Connected Step */}
                {step === 'connected' && (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Successfully Connected!
                      </h3>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Wallet</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {selectedWallet}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Address</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-900 dark:text-white">
                            {formatAddress(connectedAddress)}
                          </span>
                          <button
                            onClick={copyAddress}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {chainId > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Network</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || `Chain ${chainId}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Network Switching */}
                    {chainId !== 4202 && chainId > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                              Please switch to Lisk Sepolia Testnet to use BlockEstate
                            </p>
                            <button
                              onClick={() => switchNetwork(4202)}
                              className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:underline"
                            >
                              Switch Network →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handleDisconnect}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Disconnect
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Step */}
                {step === 'error' && (
                  <div className="text-center py-8">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Connection Failed
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 px-4">
                      {error}
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setStep('select');
                          setError('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Try Again
                      </button>
                      {selectedWallet && walletOptions.find(w => w.id === selectedWallet)?.downloadUrl && (
                        <button
                          onClick={() => window.open(walletOptions.find(w => w.id === selectedWallet)?.downloadUrl, '_blank')}
                          className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>Install Wallet</span>
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {step === 'select' && (
                <div className="px-6 pb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>New to Web3?</strong> We recommend starting with MetaMask.
                      It's easy to set up and widely supported.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

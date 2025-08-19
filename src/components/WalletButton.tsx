import React from 'react';
import { Wallet, LogOut, Copy, Check, ChevronDown } from 'lucide-react';
import { useWallet, walletProviders, WalletProvider } from '../lib/wallet';

export const WalletButton = () => {
  const { isConnected, address, balance, blockBalance, connecting, provider, connectWallet, disconnectWallet } = useWallet();
  const [copied, setCopied] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showWalletOptions, setShowWalletOptions] = React.useState(false);

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

  const handleWalletConnect = async (walletType: WalletProvider) => {
    setShowWalletOptions(false);
    await connectWallet(walletType);
  };

  const getAvailableWallets = () => {
    return Object.entries(walletProviders).filter(([key, wallet]) => {
      // Always show all wallets, but indicate which ones are installed
      return true;
    });
  };

  if (isConnected && address) {
    const currentProvider = provider ? walletProviders[provider] : null;
    
    return (
      <div className="relative flex items-center space-x-3">
        <div className="hidden md:block text-right">
          <div className="text-sm font-medium text-gray-900">
            {blockBalance.toLocaleString()} BLOCK
          </div>
          <div className="text-xs text-gray-500">
            {balance} {provider === 'phantom' ? 'SOL' : 'ETH'}
          </div>
        </div>
        
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 hover:bg-green-100 transition-colors"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900">{formatAddress(address)}</span>
          {currentProvider && (
            <span className="text-xs">{currentProvider.icon}</span>
          )}
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Connected with</span>
                  {currentProvider && (
                    <span className="text-sm text-gray-600 flex items-center space-x-1">
                      <span>{currentProvider.icon}</span>
                      <span>{currentProvider.name}</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono break-all mb-4">
                {address}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {provider === 'phantom' ? 'SOL' : 'ETH'} Balance:
                  </span>
                  <span className="text-sm font-medium">
                    {balance} {provider === 'phantom' ? 'SOL' : 'ETH'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">BLOCK Balance:</span>
                  <span className="text-sm font-medium">{blockBalance.toLocaleString()} BLOCK</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWalletOptions(!showWalletOptions)}
        disabled={connecting}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
      >
        <Wallet className="h-4 w-4" />
        <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {showWalletOptions && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose a wallet</h3>
            <div className="space-y-2">
              {getAvailableWallets().map(([key, wallet]) => {
                const isInstalled = wallet.check();
                return (
                  <button
                    key={key}
                    onClick={() => handleWalletConnect(key as WalletProvider)}
                    disabled={connecting}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isInstalled
                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{wallet.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{wallet.name}</div>
                        <div className="text-xs text-gray-500">
                          {isInstalled ? 'Installed' : 'Not installed'}
                        </div>
                      </div>
                    </div>
                    {!isInstalled && (
                      <span className="text-xs text-gray-400">Install</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                New to wallets?{' '}
                <a
                  href="https://ethereum.org/en/wallets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
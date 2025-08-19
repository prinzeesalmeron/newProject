import React from 'react';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useWallet } from '../lib/wallet';
import { motion } from 'framer-motion';

export const WalletButton = () => {
  const { isConnected, address, balance, blockBalance, connecting, connectWallet, disconnectWallet } = useWallet();
  const [copied, setCopied] = React.useState(false);

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

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        <div className="hidden md:block text-right">
          <div className="text-sm font-medium text-gray-900">
            {blockBalance.toLocaleString()} BLOCK
          </div>
          <div className="text-xs text-gray-500">
            {balance} ETH
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <button
            onClick={handleCopyAddress}
            className="flex items-center space-x-1 text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
          >
            <span>{formatAddress(address)}</span>
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>

        <button
          onClick={disconnectWallet}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Disconnect Wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      <Wallet className="h-4 w-4" />
      <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
};
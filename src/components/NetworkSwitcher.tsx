import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';
import { useWalletConnector, SUPPORTED_NETWORKS } from '../lib/blockchain/walletConnector';
import { getCurrentNetwork, NETWORKS } from '../lib/contractConfig';

export const NetworkSwitcher: React.FC = () => {
  const { chainId, switchNetwork, isConnected } = useWalletConnector();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedNetwork = getCurrentNetwork();
  const expectedChainId = NETWORKS[expectedNetwork].chainId;
  const isCorrectNetwork = chainId === expectedChainId;

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSwitchNetwork = async () => {
    if (!isConnected) return;

    setSwitching(true);
    setError(null);

    try {
      await switchNetwork(expectedChainId);
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      setError(err.message || 'Failed to switch network');
    } finally {
      setSwitching(false);
    }
  };

  if (!isConnected) return null;

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-900 dark:text-green-100">
          {NETWORKS[expectedNetwork].name}
        </span>
      </div>
    );
  }

  const currentNetworkName = chainId
    ? SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS]?.name || `Chain ${chainId}`
    : 'Unknown';

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            Wrong Network
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Connected to {currentNetworkName}
          </p>
        </div>
        <button
          onClick={handleSwitchNetwork}
          disabled={switching}
          className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          {switching ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Switching...</span>
            </>
          ) : (
            <span>Switch to {NETWORKS[expectedNetwork].name}</span>
          )}
        </button>
      </div>
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
};

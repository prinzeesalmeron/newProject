import { create } from 'zustand';
import { persist } from 'zustand/middleware';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  blockBalance: number;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: () => Promise<void>;
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      balance: '0.0000',
      blockBalance: 0,
      connecting: false,
      
      connectWallet: async () => {
        if (!window.ethereum) {
          alert('Please install MetaMask or another Web3 wallet to connect');
          return;
        }

        set({ connecting: true });
        
        try {
          // Request account access
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          
          if (accounts.length === 0) {
            throw new Error('No accounts found');
          }

          const address = accounts[0];
          
          // Get ETH balance
          const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          });
          
          // Convert from Wei to ETH
          const balanceEth = (parseInt(balanceWei, 16) / Math.pow(10, 18)).toFixed(4);
          
          // For BLOCK tokens, we'll simulate since it's a custom token
          // In a real app, you'd query the token contract
          const blockBalance = Math.floor(Math.random() * 10000) + 100;
          
          set({
            isConnected: true,
            address,
            balance: balanceEth,
            blockBalance,
            connecting: false,
          });

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              get().disconnectWallet();
            } else {
              set({ address: accounts[0] });
              get().updateBalance();
            }
          });

          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            get().updateBalance();
          });

        } catch (error) {
          console.error('Failed to connect wallet:', error);
          alert('Failed to connect wallet. Please try again.');
          set({ connecting: false });
        }
      },
      
      updateBalance: async () => {
        const { address } = get();
        if (!address || !window.ethereum) return;

        try {
          const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          });
          
          const balanceEth = (parseInt(balanceWei, 16) / Math.pow(10, 18)).toFixed(4);
          set({ balance: balanceEth });
        } catch (error) {
          console.error('Failed to update balance:', error);
        }
      },
      
      disconnectWallet: () => {
        // Remove event listeners
        if (window.ethereum) {
          window.ethereum.removeAllListeners('accountsChanged');
          window.ethereum.removeAllListeners('chainChanged');
        }
        
        set({
          isConnected: false,
          address: null,
          balance: '0.0000',
          blockBalance: 0,
          connecting: false,
        });
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        // Only persist connection status and address, not balances
        isConnected: state.isConnected,
        address: state.address,
      }),
    }
  )
);

// Auto-reconnect on page load if previously connected
if (typeof window !== 'undefined' && window.ethereum) {
  const store = useWallet.getState();
  if (store.isConnected && store.address) {
    // Check if still connected
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0 && accounts[0] === store.address) {
          store.updateBalance();
        } else {
          store.disconnectWallet();
        }
      })
      .catch(() => {
        store.disconnectWallet();
      });
  }
}
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    phantom?: any;
    coinbaseWalletExtension?: any;
    trustWallet?: any;
  }
}

export type WalletProvider = 'metamask' | 'coinbase' | 'walletconnect' | 'phantom' | 'trust';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  blockBalance: number;
  connecting: boolean;
  provider: WalletProvider | null;
  connectWallet: (provider: WalletProvider) => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: () => Promise<void>;
}

const walletProviders = {
  metamask: {
    name: 'MetaMask',
    icon: '🦊',
    check: () => window.ethereum?.isMetaMask,
    connect: async () => {
      if (!window.ethereum?.isMetaMask) {
        throw new Error('MetaMask not installed');
      }
      return window.ethereum;
    }
  },
  coinbase: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    check: () => window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension,
    connect: async () => {
      const provider = window.ethereum?.isCoinbaseWallet ? window.ethereum : window.coinbaseWalletExtension;
      if (!provider) {
        throw new Error('Coinbase Wallet not installed');
      }
      return provider;
    }
  },
  trust: {
    name: 'Trust Wallet',
    icon: '🛡️',
    check: () => window.ethereum?.isTrust || window.trustWallet,
    connect: async () => {
      const provider = window.ethereum?.isTrust ? window.ethereum : window.trustWallet;
      if (!provider) {
        throw new Error('Trust Wallet not installed');
      }
      return provider;
    }
  },
  phantom: {
    name: 'Phantom',
    icon: '👻',
    check: () => window.solana?.isPhantom || window.phantom,
    connect: async () => {
      const provider = window.solana?.isPhantom ? window.solana : window.phantom?.solana;
      if (!provider) {
        throw new Error('Phantom Wallet not installed');
      }
      // Phantom uses different methods for Solana
      const response = await provider.connect();
      return {
        request: async ({ method, params }: any) => {
          if (method === 'eth_requestAccounts') {
            return [response.publicKey.toString()];
          }
          if (method === 'eth_getBalance') {
            // Simulate balance for Phantom (Solana wallet)
            return '0x' + (Math.random() * 1000000000000000000).toString(16);
          }
          throw new Error(`Method ${method} not supported`);
        },
        on: () => {},
        removeAllListeners: () => {}
      };
    }
  },
  walletconnect: {
    name: 'WalletConnect',
    icon: '🔗',
    check: () => true, // WalletConnect is always available as a protocol
    connect: async () => {
      // Simulate WalletConnect connection
      // In a real app, you'd use @walletconnect/web3-provider
      throw new Error('WalletConnect integration requires additional setup. Please use another wallet for now.');
    }
  }
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      balance: '0.0000',
      blockBalance: 0,
      connecting: false,
      provider: null,
      
      connectWallet: async (providerType: WalletProvider) => {
        // Prevent multiple concurrent connection attempts
        if (get().connecting) {
          return;
        }
        
        const walletProvider = walletProviders[providerType];
        
        if (!walletProvider.check()) {
          alert(`${walletProvider.name} is not installed. Please install it to continue.`);
          return;
        }

        set({ connecting: true });
        
        try {
          const provider = await walletProvider.connect();
          
          // Request account access
          const accounts = await provider.request({
            method: 'eth_requestAccounts',
          });
          
          if (accounts.length === 0) {
            throw new Error('No accounts found');
          }

          const address = accounts[0];
          
          // Get balance
          const balanceWei = await provider.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          });
          
          // Convert from Wei to ETH (or handle Solana differently)
          let balanceEth;
          if (providerType === 'phantom') {
            // For Phantom (Solana), treat as SOL
            balanceEth = (parseInt(balanceWei, 16) / Math.pow(10, 9)).toFixed(4);
          } else {
            // For Ethereum wallets
            balanceEth = (parseInt(balanceWei, 16) / Math.pow(10, 18)).toFixed(4);
          }
          
          // Simulate BLOCK token balance
          const blockBalance = Math.floor(Math.random() * 10000) + 100;
          
          set({
            isConnected: true,
            address,
            balance: balanceEth,
            blockBalance,
            connecting: false,
            provider: providerType,
          });

          // Listen for account changes (if supported)
          if (provider.on) {
            provider.on('accountsChanged', (accounts: string[]) => {
              if (accounts.length === 0) {
                get().disconnectWallet();
              } else {
                set({ address: accounts[0] });
                get().updateBalance();
              }
            });

            provider.on('chainChanged', () => {
              get().updateBalance();
            });
          }

        } catch (error: any) {
          console.error('Failed to connect wallet:', error);
          alert(`Failed to connect to ${walletProvider.name}: ${error.message}`);
          set({ connecting: false });
        }
      },
      
      updateBalance: async () => {
        const { address, provider } = get();
        if (!address || !provider) return;

        try {
          const walletProvider = walletProviders[provider];
          const providerInstance = await walletProvider.connect();
          
          const balanceWei = await providerInstance.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          });
          
          let balanceEth;
          if (provider === 'phantom') {
            balanceEth = (parseInt(balanceWei, 16) / Math.pow(10, 9)).toFixed(4);
          } else {
            balanceEth = (parseInt(balanceWei, 16) / Math.pow(10, 18)).toFixed(4);
          }
          
          set({ balance: balanceEth });
        } catch (error) {
          console.error('Failed to update balance:', error);
        }
      },
      
      disconnectWallet: () => {
        // Remove event listeners
        const { provider } = get();
        if (provider && walletProviders[provider]) {
          try {
            // Try to remove listeners if the provider supports it
            if (window.ethereum?.removeAllListeners) {
              window.ethereum.removeAllListeners('accountsChanged');
              window.ethereum.removeAllListeners('chainChanged');
            }
          } catch (error) {
            console.error('Error removing listeners:', error);
          }
        }
        
        set({
          isConnected: false,
          address: null,
          balance: '0.0000',
          blockBalance: 0,
          connecting: false,
          provider: null,
        });
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        provider: state.provider,
      }),
    }
  )
);

// Auto-reconnect on page load if previously connected
if (typeof window !== 'undefined') {
  const store = useWallet.getState();
  if (store.isConnected && store.address && store.provider) {
    // Check if still connected
    const walletProvider = walletProviders[store.provider];
    if (walletProvider.check()) {
      walletProvider.connect()
        .then(provider => provider.request({ method: 'eth_accounts' }))
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
    } else {
      store.disconnectWallet();
    }
  }
}

export { walletProviders };
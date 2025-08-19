import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  blockBalance: number;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

// Generate a random wallet address
const generateWalletAddress = (): string => {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      balance: 0,
      blockBalance: 0,
      connecting: false,

      connectWallet: async () => {
        set({ connecting: true });
        
        try {
          // Simulate wallet connection process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if MetaMask or other wallet is available (in real app)
          // For now, we'll simulate the connection
          
          const address = generateWalletAddress();
          const balance = Math.random() * 5 + 0.1; // 0.1 - 5.1 ETH
          const blockBalance = Math.floor(Math.random() * 1000 + 100); // 100 - 1100 BLOCK
          
          set({
            isConnected: true,
            address,
            balance: parseFloat(balance.toFixed(4)),
            blockBalance,
            connecting: false
          });
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          set({ connecting: false });
        }
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          address: null,
          balance: 0,
          blockBalance: 0,
          connecting: false
        });
      }
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        balance: state.balance,
        blockBalance: state.blockBalance
      })
    }
  )
);
        
        // Mock wallet connection
        const randomAddress = mockWallets[Math.floor(Math.random() * mockWallets.length)];
        const randomBalance = Math.random() * 10 + 0.5; // 0.5 - 10.5 ETH
        const randomBlockBalance = Math.random() * 5000 + 1000; // 1000 - 6000 BLOCK
        
        set({
          isConnected: true,
          address: randomAddress,
          balance: parseFloat(randomBalance.toFixed(4)),
          blockBalance: Math.floor(randomBlockBalance),
          connecting: false
        });
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          address: null,
          balance: 0,
          blockBalance: 0,
          connecting: false
        });
      }
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        balance: state.balance,
        blockBalance: state.blockBalance
      })
    }
  )
);
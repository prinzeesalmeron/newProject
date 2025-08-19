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

// Mock wallet addresses for demo
const mockWallets = [
  '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
  '0x8ba1f109551bD432803012645Hac136c22C501e',
  '0x1234567890123456789012345678901234567890',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
];

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
        
        // Simulate wallet connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
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
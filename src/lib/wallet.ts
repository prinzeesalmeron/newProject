import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  ethBalance: number;
  blockBalance: number;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Generate a realistic wallet address
const generateWalletAddress = (): string => {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
};

// Generate realistic balances
const generateBalances = () => ({
  ethBalance: Math.random() * 10 + 0.1, // 0.1 to 10.1 ETH
  blockBalance: Math.random() * 10000 + 100, // 100 to 10,100 BLOCK
});

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      ethBalance: 0,
      blockBalance: 0,
      isConnecting: false,
      
      connect: async () => {
        set({ isConnecting: true });
        
        // Simulate wallet connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const address = generateWalletAddress();
        const balances = generateBalances();
        
        set({
          isConnected: true,
          address,
          ...balances,
          isConnecting: false,
        });
      },
      
      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          ethBalance: 0,
          blockBalance: 0,
          isConnecting: false,
        });
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
);
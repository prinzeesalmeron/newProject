import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  blockBalance: number;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
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
  balance: (Math.random() * 10 + 0.1).toFixed(4), // 0.1 to 10.1 ETH
  blockBalance: Math.random() * 10000 + 100, // 100 to 10,100 BLOCK
});

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      balance: '0.0000',
      blockBalance: 0,
      connecting: false,
      
      connectWallet: async () => {
        set({ connecting: true });
        
        // Simulate wallet connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const address = generateWalletAddress();
        const balances = generateBalances();
        
        set({
          isConnected: true,
          address,
          ...balances,
          connecting: false,
        });
      },
      
      disconnectWallet: () => {
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
    }
  )
);
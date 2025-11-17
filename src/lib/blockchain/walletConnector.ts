import { ethers } from 'ethers';
import { create } from 'zustand';

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase' | 'phantom';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  balance: string;
  connecting: boolean;
  error: string | null;
  connect: (providerType: WalletProvider) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  updateBalance: () => Promise<void>;
}

// Supported networks
export const SUPPORTED_NETWORKS = {
  1: { name: 'Ethereum Mainnet', rpc: 'https://mainnet.infura.io/v3/' },
  5: { name: 'Goerli Testnet', rpc: 'https://goerli.infura.io/v3/' },
  11155111: { name: 'Sepolia Testnet', rpc: 'https://sepolia.infura.io/v3/' },
  4202: { name: 'Lisk Sepolia Testnet', rpc: 'https://rpc.sepolia-api.lisk.com' },
  137: { name: 'Polygon Mainnet', rpc: 'https://polygon-rpc.com' },
  80001: { name: 'Mumbai Testnet', rpc: 'https://rpc-mumbai.maticvigil.com' }
};

export const useWalletConnector = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  balance: '0',
  connecting: false,
  error: null,

  connect: async (providerType: WalletProvider) => {
    set({ connecting: true, error: null });

    try {
      let ethereum: any;

      switch (providerType) {
        case 'metamask':
          if (!window.ethereum?.isMetaMask) {
            throw new Error('MetaMask not installed');
          }
          ethereum = window.ethereum;
          break;
          
        case 'coinbase':
          if (!window.ethereum?.isCoinbaseWallet) {
            throw new Error('Coinbase Wallet not installed');
          }
          ethereum = window.ethereum;
          break;
          
        case 'phantom':
          if (!window.solana?.isPhantom) {
            throw new Error('Phantom Wallet not installed');
          }
          // For Phantom, we'll simulate Ethereum compatibility
          const phantomResponse = await window.solana.connect();
          ethereum = {
            request: async ({ method, params }: any) => {
              if (method === 'eth_requestAccounts') {
                return [phantomResponse.publicKey.toString()];
              }
              if (method === 'eth_getBalance') {
                return '0x' + (Math.random() * 1000000000000000000).toString(16);
              }
              if (method === 'eth_chainId') {
                return '0x1'; // Simulate Ethereum mainnet
              }
              throw new Error(`Method ${method} not supported by Phantom`);
            },
            on: () => {},
            removeAllListeners: () => {}
          };
          break;
          
        default:
          throw new Error(`Wallet provider ${providerType} not supported`);
      }

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const address = accounts[0];
      const network = await provider.getNetwork();
      
      // Get balance
      const balanceWei = await provider.getBalance(address);
      const balance = ethers.utils.formatEther(balanceWei);

      set({
        isConnected: true,
        address,
        provider,
        signer,
        chainId: network.chainId,
        balance,
        connecting: false,
        error: null,
      });

      // Listen for account changes
      if (ethereum.on) {
        ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            get().disconnect();
          } else {
            set({ address: accounts[0] });
            get().updateBalance();
          }
        });

        ethereum.on('chainChanged', (chainId: string) => {
          set({ chainId: parseInt(chainId, 16) });
          get().updateBalance();
        });
      }

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      set({ 
        connecting: false, 
        error: error.message || 'Failed to connect wallet' 
      });
      throw error;
    }
  },

  disconnect: () => {
    // Clean up event listeners
    if (window.ethereum?.removeAllListeners) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }

    set({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: '0',
      connecting: false,
      error: null,
    });
  },

  switchNetwork: async (targetChainId: number) => {
    const { provider } = get();
    if (!provider || !window.ethereum) {
      throw new Error('No wallet connected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        const network = SUPPORTED_NETWORKS[targetChainId as keyof typeof SUPPORTED_NETWORKS];
        if (network) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: network.name,
              rpcUrls: [network.rpc],
            }],
          });
        }
      } else {
        throw error;
      }
    }
  },

  updateBalance: async () => {
    const { provider, address } = get();
    if (!provider || !address) return;

    try {
      const balanceWei = await provider.getBalance(address);
      const balance = ethers.utils.formatEther(balanceWei);
      set({ balance });
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  },
}));
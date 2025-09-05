import { ethers } from 'ethers';
import { contractManager } from './blockchain/contractManager';
import { useWalletConnector } from './blockchain/walletConnector';

// Contract ABIs (simplified for demo - in production these would be full ABIs)
const PROPERTY_TOKEN_ABI = [
  "function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) public",
  "function balanceOf(address account, uint256 id) public view returns (uint256)",
  "function totalSupply(uint256 id) public view returns (uint256)",
  "function uri(uint256 id) public view returns (string memory)",
  "function setApprovalForAll(address operator, bool approved) public",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event PropertyTokenized(uint256 indexed propertyId, address indexed owner, uint256 totalTokens, uint256 pricePerToken)"
];

const STAKING_CONTRACT_ABI = [
  "function stake(uint256 poolId, uint256 amount) public",
  "function unstake(uint256 poolId, uint256 amount) public",
  "function claimRewards(uint256 poolId) public",
  "function getStakedAmount(address user, uint256 poolId) public view returns (uint256)",
  "function getPendingRewards(address user, uint256 poolId) public view returns (uint256)",
  "function getPoolInfo(uint256 poolId) public view returns (uint256 apy, uint256 lockPeriod, uint256 totalStaked)",
  "event Staked(address indexed user, uint256 indexed poolId, uint256 amount)",
  "event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount)"
];

const MARKETPLACE_ABI = [
  "function listProperty(string memory title, string memory location, uint256 totalTokens, uint256 pricePerToken, string memory metadataURI) public returns (uint256)",
  "function buyTokens(uint256 propertyId, uint256 amount) public payable",
  "function getProperty(uint256 propertyId) public view returns (string memory title, string memory location, uint256 totalTokens, uint256 availableTokens, uint256 pricePerToken, address owner)",
  "function getPropertyCount() public view returns (uint256)",
  "function distributeRentalIncome(uint256 propertyId, uint256 totalIncome) public",
  "event PropertyListed(uint256 indexed propertyId, address indexed owner, uint256 totalTokens, uint256 pricePerToken)",
  "event TokensPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalCost)",
  "event RentalIncomeDistributed(uint256 indexed propertyId, uint256 totalIncome, uint256 timestamp)"
];

const BLOCK_TOKEN_ABI = [
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Contract addresses (these would be deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet addresses (deployed via Foundry)
  PROPERTY_TOKEN: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
  MARKETPLACE: '0x8464135c8F25Da09e49BC8782676a84730C318bC',
  STAKING: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  BLOCK_TOKEN: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  GOVERNANCE: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  TIMELOCK: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
};

export interface PropertyTokenContract {
  mint: (to: string, tokenId: number, amount: number) => Promise<ethers.ContractTransaction>;
  balanceOf: (account: string, id: number) => Promise<ethers.BigNumber>;
  totalSupply: (id: number) => Promise<ethers.BigNumber>;
  setApprovalForAll: (operator: string, approved: boolean) => Promise<ethers.ContractTransaction>;
  safeTransferFrom: (from: string, to: string, id: number, amount: number) => Promise<ethers.ContractTransaction>;
}

export interface StakingContract {
  stake: (poolId: number, amount: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
  unstake: (poolId: number, amount: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
  claimRewards: (poolId: number) => Promise<ethers.ContractTransaction>;
  getStakedAmount: (user: string, poolId: number) => Promise<ethers.BigNumber>;
  getPendingRewards: (user: string, poolId: number) => Promise<ethers.BigNumber>;
  getPoolInfo: (poolId: number) => Promise<{ apy: ethers.BigNumber; lockPeriod: ethers.BigNumber; totalStaked: ethers.BigNumber }>;
}

export interface MarketplaceContract {
  listProperty: (title: string, location: string, totalTokens: number, pricePerToken: ethers.BigNumber, metadataURI: string) => Promise<ethers.ContractTransaction>;
  buyTokens: (propertyId: number, amount: number, options: { value: ethers.BigNumber }) => Promise<ethers.ContractTransaction>;
  getProperty: (propertyId: number) => Promise<{ title: string; location: string; totalTokens: ethers.BigNumber; availableTokens: ethers.BigNumber; pricePerToken: ethers.BigNumber; owner: string }>;
  getPropertyCount: () => Promise<ethers.BigNumber>;
  distributeRentalIncome: (propertyId: number, totalIncome: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
}

export interface BlockTokenContract {
  balanceOf: (account: string) => Promise<ethers.BigNumber>;
  transfer: (to: string, amount: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
  approve: (spender: string, amount: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
  allowance: (owner: string, spender: string) => Promise<ethers.BigNumber>;
  totalSupply: () => Promise<ethers.BigNumber>;
}

export class ContractService {
  // Delegate to the new contract manager
  private contractManager = contractManager;

  async initialize(provider: any) {
    try {
      await this.contractManager.initialize();
      console.log('Smart contracts initialized successfully');
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      throw error;
    }
  }

  // Property Token Methods
  async getPropertyTokenBalance(userAddress: string, propertyId: number): Promise<string> {
    return await this.contractManager.getPropertyTokenBalance(userAddress, propertyId);
  }

  async transferPropertyTokens(to: string, propertyId: number, amount: number): Promise<string> {
    return await this.contractManager.transferPropertyTokens(to, propertyId, amount);
  }

  // Staking Methods
  async stakeTokens(poolId: number, amount: string): Promise<string> {
    return await this.contractManager.stakeTokens(poolId, amount);
  }

  async unstakeTokens(poolId: number, amount: string): Promise<string> {
    return await this.contractManager.unstakeTokens(poolId, amount);
  }

  async claimStakingRewards(poolId: number): Promise<string> {
    return await this.contractManager.claimStakingRewards(poolId);
  }

  async getStakedAmount(userAddress: string, poolId: number): Promise<string> {
    return await this.contractManager.getStakedAmount(userAddress, poolId);
  }

  async getPendingRewards(userAddress: string, poolId: number): Promise<string> {
    return await this.contractManager.getPendingRewards(userAddress, poolId);
  }

  // Marketplace Methods
  async buyPropertyTokens(propertyId: number, amount: number, pricePerToken: string): Promise<string> {
    if (!this.marketplaceContract) throw new Error('Marketplace contract not initialized');
    
    try {
      const totalCost = ethers.utils.parseEther((parseFloat(pricePerToken) * amount).toString());
      
      const tx = await this.marketplaceContract.buyTokens(propertyId, amount, {
        value: totalCost
      });
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error buying property tokens:', error);
      throw error;
    }
  }

  async listProperty(
    title: string,
    location: string,
    totalTokens: number,
    pricePerToken: string,
    metadataURI: string
  ): Promise<string> {
    if (!this.marketplaceContract) throw new Error('Marketplace contract not initialized');
    
    try {
      const price = ethers.utils.parseEther(pricePerToken);
      
      const tx = await this.marketplaceContract.listProperty(
        title,
        location,
        totalTokens,
        price,
        metadataURI
      );
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error listing property:', error);
      throw error;
    }
  }

  // BLOCK Token Methods
  async getBlockTokenBalance(userAddress: string): Promise<string> {
    return await this.contractManager.getBlockTokenBalance(userAddress);
  }

  async transferBlockTokens(to: string, amount: string): Promise<string> {
    return await this.contractManager.transferBlockTokens(to, amount);
  }

  // Utility Methods
  async getGasPrice(): Promise<ethers.BigNumber> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getGasPrice();
  }

  async estimateGas(transaction: any): Promise<ethers.BigNumber> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.estimateGas(transaction);
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getTransactionReceipt(txHash);
  }

  // Event Listeners
  onPropertyTokenized(callback: (propertyId: number, owner: string, totalTokens: number, pricePerToken: string) => void) {
    this.contractManager.onPropertyTokenized(callback);
  }

  onTokensPurchased(callback: (propertyId: number, buyer: string, amount: number, totalCost: string) => void) {
    this.contractManager.onTokensPurchased(callback);
  }

  onStaked(callback: (user: string, poolId: number, amount: string) => void) {
    this.contractManager.onStaked(callback);
  }

  // Cleanup
  removeAllListeners() {
    this.contractManager.removeAllListeners();
  }
}

// Singleton instance
export const contractService = new ContractService();
import { ethers } from 'ethers';

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
  PROPERTY_TOKEN: '0x1234567890123456789012345678901234567890', // Deployed via Foundry
  STAKING: '0x2345678901234567890123456789012345678901', // Deployed via Foundry
  MARKETPLACE: '0x3456789012345678901234567890123456789012', // Deployed via Foundry
  BLOCK_TOKEN: '0x4567890123456789012345678901234567890123', // Deployed via Foundry
  GOVERNANCE: '0x5678901234567890123456789012345678901234', // Deployed via Foundry
  TIMELOCK: '0x6789012345678901234567890123456789012345' // Deployed via Foundry
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
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  
  private propertyTokenContract: PropertyTokenContract | null = null;
  private stakingContract: StakingContract | null = null;
  private marketplaceContract: MarketplaceContract | null = null;
  private blockTokenContract: BlockTokenContract | null = null;

  async initialize(provider: any) {
    try {
      this.provider = new ethers.providers.Web3Provider(provider);
      this.signer = this.provider.getSigner();
      
      // Initialize contracts
      this.propertyTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PROPERTY_TOKEN,
        PROPERTY_TOKEN_ABI,
        this.signer
      ) as PropertyTokenContract;
      
      this.stakingContract = new ethers.Contract(
        CONTRACT_ADDRESSES.STAKING,
        STAKING_CONTRACT_ABI,
        this.signer
      ) as StakingContract;
      
      this.marketplaceContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MARKETPLACE,
        MARKETPLACE_ABI,
        this.signer
      ) as MarketplaceContract;
      
      this.blockTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.BLOCK_TOKEN,
        BLOCK_TOKEN_ABI,
        this.signer
      ) as BlockTokenContract;
      
      console.log('Smart contracts initialized successfully');
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      throw error;
    }
  }

  // Property Token Methods
  async getPropertyTokenBalance(userAddress: string, propertyId: number): Promise<string> {
    if (!this.propertyTokenContract) throw new Error('Property token contract not initialized');
    
    try {
      const balance = await this.propertyTokenContract.balanceOf(userAddress, propertyId);
      return ethers.utils.formatUnits(balance, 0);
    } catch (error) {
      console.error('Error getting property token balance:', error);
      return '0';
    }
  }

  async transferPropertyTokens(to: string, propertyId: number, amount: number): Promise<string> {
    if (!this.propertyTokenContract || !this.signer) throw new Error('Contract not initialized');
    
    try {
      const fromAddress = await this.signer.getAddress();
      const tx = await this.propertyTokenContract.safeTransferFrom(
        fromAddress,
        to,
        propertyId,
        amount,
        '0x'
      );
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error transferring property tokens:', error);
      throw error;
    }
  }

  // Staking Methods
  async stakeTokens(poolId: number, amount: string): Promise<string> {
    if (!this.stakingContract || !this.blockTokenContract) throw new Error('Contracts not initialized');
    
    try {
      const stakeAmount = ethers.utils.parseUnits(amount, 18);
      
      // First approve the staking contract to spend tokens
      const approveTx = await this.blockTokenContract.approve(CONTRACT_ADDRESSES.STAKING, stakeAmount);
      await approveTx.wait();
      
      // Then stake the tokens
      const stakeTx = await this.stakingContract.stake(poolId, stakeAmount);
      await stakeTx.wait();
      
      return stakeTx.hash;
    } catch (error) {
      console.error('Error staking tokens:', error);
      throw error;
    }
  }

  async unstakeTokens(poolId: number, amount: string): Promise<string> {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    
    try {
      const unstakeAmount = ethers.utils.parseUnits(amount, 18);
      const tx = await this.stakingContract.unstake(poolId, unstakeAmount);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      throw error;
    }
  }

  async claimStakingRewards(poolId: number): Promise<string> {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    
    try {
      const tx = await this.stakingContract.claimRewards(poolId);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    }
  }

  async getStakedAmount(userAddress: string, poolId: number): Promise<string> {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    
    try {
      const amount = await this.stakingContract.getStakedAmount(userAddress, poolId);
      return ethers.utils.formatUnits(amount, 18);
    } catch (error) {
      console.error('Error getting staked amount:', error);
      return '0';
    }
  }

  async getPendingRewards(userAddress: string, poolId: number): Promise<string> {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    
    try {
      const rewards = await this.stakingContract.getPendingRewards(userAddress, poolId);
      return ethers.utils.formatUnits(rewards, 18);
    } catch (error) {
      console.error('Error getting pending rewards:', error);
      return '0';
    }
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
    if (!this.blockTokenContract) throw new Error('BLOCK token contract not initialized');
    
    try {
      const balance = await this.blockTokenContract.balanceOf(userAddress);
      return ethers.utils.formatUnits(balance, 18);
    } catch (error) {
      console.error('Error getting BLOCK token balance:', error);
      return '0';
    }
  }

  async transferBlockTokens(to: string, amount: string): Promise<string> {
    if (!this.blockTokenContract) throw new Error('BLOCK token contract not initialized');
    
    try {
      const transferAmount = ethers.utils.parseUnits(amount, 18);
      const tx = await this.blockTokenContract.transfer(to, transferAmount);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Error transferring BLOCK tokens:', error);
      throw error;
    }
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
    if (!this.propertyTokenContract) return;
    
    this.propertyTokenContract.on('PropertyTokenized', (propertyId, owner, totalTokens, pricePerToken) => {
      callback(
        propertyId.toNumber(),
        owner,
        totalTokens.toNumber(),
        ethers.utils.formatEther(pricePerToken)
      );
    });
  }

  onTokensPurchased(callback: (propertyId: number, buyer: string, amount: number, totalCost: string) => void) {
    if (!this.marketplaceContract) return;
    
    this.marketplaceContract.on('TokensPurchased', (propertyId, buyer, amount, totalCost) => {
      callback(
        propertyId.toNumber(),
        buyer,
        amount.toNumber(),
        ethers.utils.formatEther(totalCost)
      );
    });
  }

  onStaked(callback: (user: string, poolId: number, amount: string) => void) {
    if (!this.stakingContract) return;
    
    this.stakingContract.on('Staked', (user, poolId, amount) => {
      callback(user, poolId.toNumber(), ethers.utils.formatUnits(amount, 18));
    });
  }

  // Cleanup
  removeAllListeners() {
    this.propertyTokenContract?.removeAllListeners();
    this.stakingContract?.removeAllListeners();
    this.marketplaceContract?.removeAllListeners();
    this.blockTokenContract?.removeAllListeners();
  }
}

// Singleton instance
export const contractService = new ContractService();
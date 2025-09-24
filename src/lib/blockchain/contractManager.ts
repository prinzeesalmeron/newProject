import { ethers } from 'ethers';
import { useWalletConnector } from './walletConnector';

// Contract ABIs
const PROPERTY_TOKEN_ABI = [
  "function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) public",
  "function balanceOf(address account, uint256 id) public view returns (uint256)",
  "function totalSupply(uint256 id) public view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public",
  "function setApprovalForAll(address operator, bool approved) public",
  "function isApprovedForAll(address account, address operator) public view returns (bool)",
  "function tokenizeProperty(string memory title, string memory location, uint256 totalTokens, uint256 pricePerToken, string memory metadataURI) public returns (uint256)",
  "function purchaseTokens(uint256 propertyId, uint256 amount) public payable",
  "function getProperty(uint256 propertyId) public view returns (string memory, string memory, uint256, uint256, uint256, address, bool)",
  "event PropertyTokenized(uint256 indexed propertyId, address indexed owner, uint256 totalTokens, uint256 pricePerToken)",
  "event TokensPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalCost)"
];

const MARKETPLACE_ABI = [
  "function listTokens(uint256 propertyId, uint256 tokensForSale, uint256 pricePerToken) public returns (uint256)",
  "function buyTokens(uint256 listingId, uint256 amount) public",
  "function cancelListing(uint256 listingId) public",
  "function createRentalPayout(uint256 propertyId, uint256 totalAmount) public",
  "function claimRentalPayout(uint256 payoutId) public",
  "function instantBuy(uint256 propertyId, uint256 tokenAmount) public",
  "function instantSell(uint256 propertyId, uint256 tokenAmount) public",
  "function addLiquidity(uint256 propertyId, uint256 blockAmount, uint256 tokenAmount) public",
  "function getListing(uint256 listingId) public view returns (uint256, address, uint256, uint256, bool, uint256)",
  "function getPoolInfo(uint256 propertyId) public view returns (uint256, uint256, uint256)",
  "event PropertyListed(uint256 indexed listingId, uint256 indexed propertyId, address indexed seller, uint256 tokensForSale, uint256 pricePerToken)",
  "event TokensPurchased(uint256 indexed listingId, uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalCost)",
  "event RentalPayoutCreated(uint256 indexed payoutId, uint256 indexed propertyId, uint256 totalAmount)",
  "event RentalClaimed(uint256 indexed payoutId, uint256 indexed propertyId, address indexed recipient, uint256 amount)"
];

const STAKING_ABI = [
  "function stake(uint256 poolId, uint256 amount) public",
  "function unstake(uint256 poolId, uint256 amount) public",
  "function claimRewards(uint256 poolId) public",
  "function getStakedAmount(address user, uint256 poolId) public view returns (uint256)",
  "function getPendingRewards(address user, uint256 poolId) public view returns (uint256)",
  "function getPoolInfo(uint256 poolId) public view returns (uint256, uint256, uint256, uint256, uint256, bool)",
  "event Staked(address indexed user, uint256 indexed poolId, uint256 amount)",
  "event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount)"
];

const BLOCK_TOKEN_ABI = [
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function decimals() public view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Testnet contract addresses (these would be deployed addresses)
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet addresses
  PROPERTY_TOKEN: ethers.utils.getAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e'),
  MARKETPLACE: ethers.utils.getAddress('0x8464135c8F25Da09e49BC8782676a84730C318bC'),
  STAKING: ethers.utils.getAddress('0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'),
  BLOCK_TOKEN: ethers.utils.getAddress('0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'),
  GOVERNANCE: ethers.utils.getAddress('0x610178dA211FEF7D417bC0e6FeD39F05609AD788'),
  TIMELOCK: ethers.utils.getAddress('0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e')
};

export class ContractManager {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: Record<string, ethers.Contract> = {};

  async initialize() {
    const walletState = useWalletConnector.getState();
    
    if (!walletState.provider || !walletState.signer) {
      throw new Error('Wallet not connected');
    }

    this.provider = walletState.provider;
    this.signer = walletState.signer;

    // Initialize contracts
    this.contracts.propertyToken = new ethers.Contract(
      CONTRACT_ADDRESSES.PROPERTY_TOKEN,
      PROPERTY_TOKEN_ABI,
      this.signer
    );

    this.contracts.marketplace = new ethers.Contract(
      CONTRACT_ADDRESSES.MARKETPLACE,
      MARKETPLACE_ABI,
      this.signer
    );

    this.contracts.staking = new ethers.Contract(
      CONTRACT_ADDRESSES.STAKING,
      STAKING_ABI,
      this.signer
    );

    this.contracts.blockToken = new ethers.Contract(
      CONTRACT_ADDRESSES.BLOCK_TOKEN,
      BLOCK_TOKEN_ABI,
      this.signer
    );

    console.log('Smart contracts initialized successfully');
  }

  // Property Token Operations
  async getPropertyTokenBalance(userAddress: string, propertyId: number): Promise<string> {
    const balance = await this.contracts.propertyToken.balanceOf(userAddress, propertyId);
    return balance.toString();
  }

  async getPropertyTotalSupply(propertyId: number): Promise<string> {
    const supply = await this.contracts.propertyToken.totalSupply(propertyId);
    return supply.toString();
  }

  async approvePropertyTokens(spender: string): Promise<string> {
    const tx = await this.contracts.propertyToken.setApprovalForAll(spender, true);
    await tx.wait();
    return tx.hash;
  }

  async transferPropertyTokens(
    to: string, 
    propertyId: number, 
    amount: number
  ): Promise<string> {
    const fromAddress = await this.signer!.getAddress();
    const tx = await this.contracts.propertyToken.safeTransferFrom(
      fromAddress,
      to,
      propertyId,
      amount,
      '0x'
    );
    await tx.wait();
    return tx.hash;
  }

  // Marketplace Operations
  async listPropertyTokens(
    propertyId: number,
    tokensForSale: number,
    pricePerToken: string
  ): Promise<string> {
    const price = ethers.utils.parseUnits(pricePerToken, 18);
    
    // First approve marketplace to transfer tokens
    await this.approvePropertyTokens(CONTRACT_ADDRESSES.MARKETPLACE);
    
    const tx = await this.contracts.marketplace.listTokens(
      propertyId,
      tokensForSale,
      price
    );
    await tx.wait();
    return tx.hash;
  }

  async buyTokensFromListing(listingId: number, amount: number): Promise<string> {
    // First approve marketplace to spend BLOCK tokens
    const listing = await this.contracts.marketplace.getListing(listingId);
    const totalCost = listing.pricePerToken.mul(amount);
    
    await this.approveBlockTokens(CONTRACT_ADDRESSES.MARKETPLACE, totalCost);
    
    const tx = await this.contracts.marketplace.buyTokens(listingId, amount);
    await tx.wait();
    return tx.hash;
  }

  async instantBuyTokens(propertyId: number, tokenAmount: number): Promise<string> {
    const poolInfo = await this.contracts.marketplace.getPoolInfo(propertyId);
    const blockCost = poolInfo.blockAmount.mul(tokenAmount).div(poolInfo.tokenAmount);
    
    await this.approveBlockTokens(CONTRACT_ADDRESSES.MARKETPLACE, blockCost);
    
    const tx = await this.contracts.marketplace.instantBuy(propertyId, tokenAmount);
    await tx.wait();
    return tx.hash;
  }

  async instantSellTokens(propertyId: number, tokenAmount: number): Promise<string> {
    await this.approvePropertyTokens(CONTRACT_ADDRESSES.MARKETPLACE);
    
    const tx = await this.contracts.marketplace.instantSell(propertyId, tokenAmount);
    await tx.wait();
    return tx.hash;
  }

  async claimRentalPayout(payoutId: number): Promise<string> {
    const tx = await this.contracts.marketplace.claimRentalPayout(payoutId);
    await tx.wait();
    return tx.hash;
  }

  // BLOCK Token Operations
  async getBlockTokenBalance(userAddress: string): Promise<string> {
    const balance = await this.contracts.blockToken.balanceOf(userAddress);
    return ethers.utils.formatUnits(balance, 18);
  }

  async approveBlockTokens(spender: string, amount: ethers.BigNumber): Promise<string> {
    const tx = await this.contracts.blockToken.approve(spender, amount);
    await tx.wait();
    return tx.hash;
  }

  async transferBlockTokens(to: string, amount: string): Promise<string> {
    const transferAmount = ethers.utils.parseUnits(amount, 18);
    const tx = await this.contracts.blockToken.transfer(to, transferAmount);
    await tx.wait();
    return tx.hash;
  }

  // Staking Operations
  async stakeTokens(poolId: number, amount: string): Promise<string> {
    const stakeAmount = ethers.utils.parseUnits(amount, 18);
    
    // Approve staking contract
    await this.approveBlockTokens(CONTRACT_ADDRESSES.STAKING, stakeAmount);
    
    const tx = await this.contracts.staking.stake(poolId, stakeAmount);
    await tx.wait();
    return tx.hash;
  }

  async unstakeTokens(poolId: number, amount: string): Promise<string> {
    const unstakeAmount = ethers.utils.parseUnits(amount, 18);
    const tx = await this.contracts.staking.unstake(poolId, unstakeAmount);
    await tx.wait();
    return tx.hash;
  }

  async claimStakingRewards(poolId: number): Promise<string> {
    const tx = await this.contracts.staking.claimRewards(poolId);
    await tx.wait();
    return tx.hash;
  }

  async getStakedAmount(userAddress: string, poolId: number): Promise<string> {
    const amount = await this.contracts.staking.getStakedAmount(userAddress, poolId);
    return ethers.utils.formatUnits(amount, 18);
  }

  async getPendingRewards(userAddress: string, poolId: number): Promise<string> {
    const rewards = await this.contracts.staking.getPendingRewards(userAddress, poolId);
    return ethers.utils.formatUnits(rewards, 18);
  }

  // Event Listeners
  onPropertyTokenized(callback: (propertyId: number, owner: string, totalTokens: number, pricePerToken: string) => void) {
    this.contracts.propertyToken.on('PropertyTokenized', (propertyId, owner, totalTokens, pricePerToken) => {
      callback(
        propertyId.toNumber(),
        owner,
        totalTokens.toNumber(),
        ethers.utils.formatUnits(pricePerToken, 18)
      );
    });
  }

  onTokensPurchased(callback: (propertyId: number, buyer: string, amount: number, totalCost: string) => void) {
    this.contracts.marketplace.on('TokensPurchased', (listingId, propertyId, buyer, amount, totalCost) => {
      callback(
        propertyId.toNumber(),
        buyer,
        amount.toNumber(),
        ethers.utils.formatUnits(totalCost, 18)
      );
    });
  }

  onRentalPayoutCreated(callback: (payoutId: number, propertyId: number, totalAmount: string) => void) {
    this.contracts.marketplace.on('RentalPayoutCreated', (payoutId, propertyId, totalAmount) => {
      callback(
        payoutId.toNumber(),
        propertyId.toNumber(),
        ethers.utils.formatUnits(totalAmount, 18)
      );
    });
  }

  onStaked(callback: (user: string, poolId: number, amount: string) => void) {
    this.contracts.staking.on('Staked', (user, poolId, amount) => {
      callback(user, poolId.toNumber(), ethers.utils.formatUnits(amount, 18));
    });
  }

  // Utility Methods
  async estimateGas(contractMethod: any, ...args: any[]): Promise<ethers.BigNumber> {
    return await contractMethod.estimateGas(...args);
  }

  async getGasPrice(): Promise<ethers.BigNumber> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getGasPrice();
  }

  async waitForTransaction(txHash: string): Promise<ethers.providers.TransactionReceipt> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.waitForTransaction(txHash);
  }

  // Cleanup
  removeAllListeners() {
    Object.values(this.contracts).forEach(contract => {
      contract.removeAllListeners();
    });
  }
}

// Singleton instance
export const contractManager = new ContractManager();
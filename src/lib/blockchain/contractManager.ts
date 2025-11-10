import { ethers } from 'ethers';
import { useWalletConnector } from './walletConnector';
import { getContractAddresses } from '../contractConfig';

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



// Get contract addresses from config based on current network
const getAddresses = () => {
  const addresses = getContractAddresses();
  return {
    PROPERTY_TOKEN: addresses.PROPERTY_TOKEN,
    MARKETPLACE: addresses.MARKETPLACE,
    GOVERNANCE: addresses.GOVERNANCE,
    STAKING: addresses.STAKING
  };
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

    const addresses = getAddresses();

    // Initialize contracts
    this.contracts.propertyToken = new ethers.Contract(
      addresses.PROPERTY_TOKEN,
      PROPERTY_TOKEN_ABI,
      this.signer
    );

    this.contracts.marketplace = new ethers.Contract(
      addresses.MARKETPLACE,
      MARKETPLACE_ABI,
      this.signer
    );

    console.log('Smart contracts initialized successfully');
    console.log('PropertyToken:', addresses.PROPERTY_TOKEN);
    console.log('Marketplace:', addresses.MARKETPLACE);
    console.log('Connected wallet:', await this.signer.getAddress());
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
    const addresses = getAddresses();

    // First approve marketplace to transfer tokens
    await this.approvePropertyTokens(addresses.MARKETPLACE);

    const tx = await this.contracts.marketplace.listTokens(
      propertyId,
      tokensForSale,
      price
    );
    await tx.wait();
    return tx.hash;
  }

  async buyTokensFromListing(listingId: number, amount: number): Promise<string> {
    const listing = await this.contracts.marketplace.getListing(listingId);
    const totalCost = listing.pricePerToken.mul(amount);

    const tx = await this.contracts.marketplace.buyTokens(listingId, amount, {
      value: totalCost
    });
    await tx.wait();
    return tx.hash;
  }

  async instantBuyTokens(propertyId: number, tokenAmount: number): Promise<string> {
    const tx = await this.contracts.marketplace.instantBuy(propertyId, tokenAmount);
    await tx.wait();
    return tx.hash;
  }

  async instantSellTokens(propertyId: number, tokenAmount: number): Promise<string> {
    const addresses = getAddresses();
    await this.approvePropertyTokens(addresses.MARKETPLACE);

    const tx = await this.contracts.marketplace.instantSell(propertyId, tokenAmount);
    await tx.wait();
    return tx.hash;
  }

  async claimRentalPayout(payoutId: number): Promise<string> {
    const tx = await this.contracts.marketplace.claimRentalPayout(payoutId);
    await tx.wait();
    return tx.hash;
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
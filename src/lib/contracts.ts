import { ethers } from 'ethers';
import { contractManager } from './blockchain/contractManager';
import { useWalletConnector } from './blockchain/walletConnector';
import { ContractValidator } from './validators/contractValidator';
import { AuditService } from './services/auditService';

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


// Contract addresses (these would be deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet addresses (deployed via Foundry)
  PROPERTY_TOKEN: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
  MARKETPLACE: '0x8464135c8F25Da09e49BC8782676a84730C318bC',
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


export interface MarketplaceContract {
  listProperty: (title: string, location: string, totalTokens: number, pricePerToken: ethers.BigNumber, metadataURI: string) => Promise<ethers.ContractTransaction>;
  buyTokens: (propertyId: number, amount: number, options: { value: ethers.BigNumber }) => Promise<ethers.ContractTransaction>;
  getProperty: (propertyId: number) => Promise<{ title: string; location: string; totalTokens: ethers.BigNumber; availableTokens: ethers.BigNumber; pricePerToken: ethers.BigNumber; owner: string }>;
  getPropertyCount: () => Promise<ethers.BigNumber>;
  distributeRentalIncome: (propertyId: number, totalIncome: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
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
    // Validate inputs
    const validation = ContractValidator.validateTokenTransfer({
      to,
      propertyId,
      amount
    });

    if (!validation.valid) {
      const error = `Validation failed: ${validation.errors.join(', ')}`;
      await AuditService.logAudit({
        action: 'transfer_tokens',
        resourceType: 'contract',
        success: false,
        errorMessage: error
      });
      throw new Error(error);
    }

    try {
      const txHash = await this.contractManager.transferPropertyTokens(to, propertyId, amount);

      await AuditService.logAudit({
        action: 'transfer_tokens',
        resourceType: 'contract',
        resourceId: txHash,
        newData: { to, propertyId, amount },
        success: true
      });

      return txHash;
    } catch (error: any) {
      await AuditService.logAudit({
        action: 'transfer_tokens',
        resourceType: 'contract',
        success: false,
        errorMessage: error.message
      });
      throw error;
    }
  }


  // Marketplace Methods
  async buyPropertyTokens(propertyId: number, amount: number, pricePerToken: string): Promise<string> {
    // Validate inputs
    const totalCost = (parseFloat(pricePerToken) * amount).toString();
    const validation = ContractValidator.validateTokenPurchase({
      propertyId,
      amount,
      pricePerToken,
      maxTotalCost: '1000' // 1000 ETH max per transaction
    });

    if (!validation.valid) {
      const error = `Validation failed: ${validation.errors.join(', ')}`;
      await AuditService.logAudit({
        action: 'buy_tokens',
        resourceType: 'contract',
        success: false,
        errorMessage: error
      });
      throw new Error(error);
    }

    // Check for suspicious activity
    const suspiciousCheck = ContractValidator.detectSuspiciousTransaction({
      amount,
      totalCost,
      recentTransactionCount: 0 // Would be tracked in real implementation
    });

    if (suspiciousCheck.suspicious) {
      await AuditService.logSuspiciousActivity({
        description: `Suspicious token purchase: ${suspiciousCheck.reasons.join(', ')}`,
        metadata: { propertyId, amount, totalCost }
      });
    }

    try {
      const totalCostBN = ethers.utils.parseEther(totalCost);
      const txHash = await this.contractManager.buyPropertyTokens(propertyId, amount, pricePerToken);

      await AuditService.logTransaction({
        transactionId: txHash,
        amount: parseFloat(totalCost),
        type: 'token_purchase',
        success: true
      });

      return txHash;
    } catch (error: any) {
      await AuditService.logTransaction({
        transactionId: '',
        amount: parseFloat(totalCost),
        type: 'token_purchase',
        success: false,
        errorMessage: error.message
      });
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
    // Validate and sanitize inputs
    const validation = await ContractValidator.validateAndLogPropertyListing({
      title,
      location,
      totalTokens,
      pricePerToken,
      metadataURI
    });

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const sanitized = validation.sanitized!;

    try {
      const txHash = await this.contractManager.listProperty(
        sanitized.title,
        sanitized.location,
        sanitized.totalTokens,
        sanitized.pricePerToken,
        sanitized.metadataURI
      );

      await AuditService.logAudit({
        action: 'list_property',
        resourceType: 'contract',
        resourceId: txHash,
        newData: sanitized,
        success: true
      });

      return txHash;
    } catch (error: any) {
      await AuditService.logAudit({
        action: 'list_property',
        resourceType: 'contract',
        success: false,
        errorMessage: error.message
      });
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
    this.contractManager.onPropertyTokenized(callback);
  }

  onTokensPurchased(callback: (propertyId: number, buyer: string, amount: number, totalCost: string) => void) {
    this.contractManager.onTokensPurchased(callback);
  }


  // Cleanup
  removeAllListeners() {
    this.contractManager.removeAllListeners();
  }
}

// Singleton instance
export const contractService = new ContractService();
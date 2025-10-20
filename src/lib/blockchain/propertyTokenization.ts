import { ethers } from 'ethers';
import { useWalletConnector } from './walletConnector';
import { getContractAddresses } from '../contractConfig';
import StakingABI from '../abis/Staking.json';

/**
 * Property Tokenization Service
 * Handles blockchain interactions for tokenizing real estate properties
 */

// PropertyToken ABI - includes tokenizeProperty function
const PROPERTY_TOKEN_ABI = [
  "function tokenizeProperty(string memory title, string memory location, uint256 totalTokens, uint256 pricePerToken, string memory metadataURI) public returns (uint256)",
  "function purchaseTokens(uint256 propertyId, uint256 amount) public payable",
  "function getProperty(uint256 propertyId) public view returns (tuple(string title, string location, uint256 totalTokens, uint256 availableTokens, uint256 pricePerToken, address owner, bool isActive, string metadataURI))",
  "function balanceOf(address account, uint256 id) public view returns (uint256)",
  "function setApprovalForAll(address operator, bool approved) public",
  "function nextPropertyId() public view returns (uint256)",
  "event PropertyTokenized(uint256 indexed propertyId, address indexed owner, uint256 totalTokens, uint256 pricePerToken)"
];

export interface PropertyTokenizationData {
  title: string;
  location: string;
  totalTokens: number;
  pricePerToken: number; // In ETH
  description: string;
  imageUrl?: string;
  features?: string[];
}

export interface TokenizationResult {
  success: boolean;
  propertyId?: number;
  transactionHash?: string;
  error?: string;
  blockNumber?: number;
}

export class PropertyTokenizationService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the service with wallet connection
   */
  async initialize(): Promise<void> {
    const walletState = useWalletConnector.getState();

    if (!walletState.isConnected || !walletState.provider || !walletState.signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    this.provider = walletState.provider;
    this.signer = walletState.signer;

    // Get contract addresses
    const addresses = getContractAddresses();

    if (!addresses.PROPERTY_TOKEN || addresses.PROPERTY_TOKEN === '0x0000000000000000000000000000000000000000') {
      throw new Error('PropertyToken contract not deployed. Please deploy contracts first.');
    }

    // Initialize contract
    this.contract = new ethers.Contract(
      addresses.PROPERTY_TOKEN,
      PROPERTY_TOKEN_ABI,
      this.signer
    );

    console.log('PropertyTokenization service initialized with contract:', addresses.PROPERTY_TOKEN);
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    const walletState = useWalletConnector.getState();
    return walletState.isConnected;
  }

  /**
   * Get connected wallet address
   */
  getWalletAddress(): string | null {
    const walletState = useWalletConnector.getState();
    return walletState.address;
  }

  /**
   * Tokenize a property on the blockchain
   * This mints NFT tokens representing fractional ownership
   */
  async tokenizeProperty(data: PropertyTokenizationData): Promise<TokenizationResult> {
    try {
      // Ensure initialized
      if (!this.contract) {
        await this.initialize();
      }

      if (!this.contract || !this.signer) {
        throw new Error('Contract not initialized');
      }

      console.log('Tokenizing property:', data);

      // Convert price to Wei (smallest ETH unit)
      const pricePerTokenWei = ethers.utils.parseEther(data.pricePerToken.toString());

      // Create metadata URI (this would typically be stored on IPFS)
      const metadata = {
        title: data.title,
        description: data.description,
        location: data.location,
        imageUrl: data.imageUrl,
        features: data.features,
        totalTokens: data.totalTokens,
        pricePerToken: data.pricePerToken
      };
      const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

      // Estimate gas for the transaction
      console.log('Estimating gas...');
      const gasEstimate = await this.contract.estimateGas.tokenizeProperty(
        data.title,
        data.location,
        data.totalTokens,
        pricePerTokenWei,
        metadataURI
      );

      console.log('Gas estimate:', gasEstimate.toString());

      // Execute tokenization transaction
      console.log('Sending tokenization transaction...');
      const tx = await this.contract.tokenizeProperty(
        data.title,
        data.location,
        data.totalTokens,
        pricePerTokenWei,
        metadataURI,
        {
          gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        }
      );

      console.log('Transaction sent:', tx.hash);
      console.log('Waiting for confirmation...');

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      console.log('Transaction confirmed in block:', receipt.blockNumber);

      // Parse event to get property ID
      const propertyTokenizedEvent = receipt.events?.find(
        (e: any) => e.event === 'PropertyTokenized'
      );

      let propertyId: number | undefined;
      if (propertyTokenizedEvent) {
        propertyId = propertyTokenizedEvent.args?.propertyId.toNumber();
        console.log('Property tokenized with ID:', propertyId);
      }

      return {
        success: true,
        propertyId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error: any) {
      console.error('Tokenization failed:', error);

      let errorMessage = 'Failed to tokenize property';

      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas fees';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Purchase property tokens
   */
  async purchaseTokens(propertyId: number, amount: number): Promise<TokenizationResult> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Get property details to calculate total cost
      const property = await this.contract.getProperty(propertyId);
      const pricePerToken = property.pricePerToken;
      const totalCost = pricePerToken.mul(amount);

      console.log(`Purchasing ${amount} tokens for property ${propertyId}`);
      console.log(`Total cost: ${ethers.utils.formatEther(totalCost)} ETH`);

      // Execute purchase transaction
      const tx = await this.contract.purchaseTokens(propertyId, amount, {
        value: totalCost
      });

      console.log('Purchase transaction sent:', tx.hash);

      const receipt = await tx.wait();

      console.log('Purchase confirmed in block:', receipt.blockNumber);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error: any) {
      console.error('Purchase failed:', error);

      let errorMessage = 'Failed to purchase tokens';

      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get property token balance for an address
   */
  async getTokenBalance(propertyId: number, address?: string): Promise<number> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const walletAddress = address || this.getWalletAddress();
      if (!walletAddress) {
        throw new Error('No wallet address provided');
      }

      const balance = await this.contract.balanceOf(walletAddress, propertyId);
      return balance.toNumber();

    } catch (error) {
      console.error('Failed to get token balance:', error);
      return 0;
    }
  }

  /**
   * Get property details from blockchain
   */
  async getPropertyDetails(propertyId: number): Promise<any> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const property = await this.contract.getProperty(propertyId);

      return {
        title: property.title,
        location: property.location,
        totalTokens: property.totalTokens.toNumber(),
        availableTokens: property.availableTokens.toNumber(),
        pricePerToken: ethers.utils.formatEther(property.pricePerToken),
        owner: property.owner,
        isActive: property.isActive,
        metadataURI: property.metadataURI
      };

    } catch (error) {
      console.error('Failed to get property details:', error);
      throw error;
    }
  }

  /**
   * Estimate gas cost for tokenization
   */
  async estimateTokenizationCost(data: PropertyTokenizationData): Promise<{
    gasEstimate: string;
    gasCostETH: string;
    gasCostUSD?: string;
  }> {
    try {
      if (!this.contract || !this.provider) {
        await this.initialize();
      }

      if (!this.contract || !this.provider) {
        throw new Error('Contract not initialized');
      }

      const pricePerTokenWei = ethers.utils.parseEther(data.pricePerToken.toString());
      const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify(data)).toString('base64')}`;

      const gasEstimate = await this.contract.estimateGas.tokenizeProperty(
        data.title,
        data.location,
        data.totalTokens,
        pricePerTokenWei,
        metadataURI
      );

      const gasPrice = await this.provider.getGasPrice();
      const gasCost = gasEstimate.mul(gasPrice);
      const gasCostETH = ethers.utils.formatEther(gasCost);

      return {
        gasEstimate: gasEstimate.toString(),
        gasCostETH,
      };

    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  /**
   * Listen for PropertyTokenized events
   */
  onPropertyTokenized(
    callback: (propertyId: number, owner: string, totalTokens: number, pricePerToken: string) => void
  ): void {
    if (!this.contract) {
      console.warn('Contract not initialized, cannot listen for events');
      return;
    }

    this.contract.on('PropertyTokenized', (propertyId, owner, totalTokens, pricePerToken) => {
      callback(
        propertyId.toNumber(),
        owner,
        totalTokens.toNumber(),
        ethers.utils.formatEther(pricePerToken)
      );
    });
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

// Singleton instance
export const propertyTokenizationService = new PropertyTokenizationService();

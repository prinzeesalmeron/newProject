/**
 * Smart Contract Configuration
 *
 * This file contains contract addresses and network configuration
 * Update these addresses after deploying contracts
 */

export const NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://etherscan.io'
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://sepolia.etherscan.io'
  },
  LOCALHOST: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://localhost:8545',
    explorerUrl: ''
  }
} as const;

export type NetworkName = keyof typeof NETWORKS;

/**
 * Contract Addresses by Network
 *
 * IMPORTANT: Update these addresses after deploying contracts
 * These are placeholder addresses - replace with your deployed contract addresses
 */
export const CONTRACT_ADDRESSES: Record<NetworkName, {
  PROPERTY_TOKEN: string;
  MARKETPLACE: string;
  GOVERNANCE: string;
  STAKING: string;
}> = {
  MAINNET: {
    PROPERTY_TOKEN: '0x0000000000000000000000000000000000000000', // Deploy to mainnet
    MARKETPLACE: '0x0000000000000000000000000000000000000000',
    GOVERNANCE: '0x0000000000000000000000000000000000000000',
    STAKING: '0x0000000000000000000000000000000000000000',
  },
  SEPOLIA: {
    PROPERTY_TOKEN: '0x0000000000000000000000000000000000000000', // Update after deployment
    MARKETPLACE: '0x0000000000000000000000000000000000000000',
    GOVERNANCE: '0x0000000000000000000000000000000000000000',
    STAKING: '0x0000000000000000000000000000000000000000',
  },
  LOCALHOST: {
    PROPERTY_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Default Hardhat/Foundry addresses
    MARKETPLACE: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    GOVERNANCE: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    STAKING: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  },
};

/**
 * Get the current network based on environment
 */
export function getCurrentNetwork(): NetworkName {
  const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111');

  switch (chainId) {
    case 1:
      return 'MAINNET';
    case 11155111:
      return 'SEPOLIA';
    case 31337:
      return 'LOCALHOST';
    default:
      console.warn(`Unknown chain ID ${chainId}, defaulting to SEPOLIA`);
      return 'SEPOLIA';
  }
}

/**
 * Get contract addresses for the current network
 */
export function getContractAddresses() {
  const network = getCurrentNetwork();
  return CONTRACT_ADDRESSES[network];
}

/**
 * Get network configuration for the current network
 */
export function getNetworkConfig() {
  const network = getCurrentNetwork();
  return NETWORKS[network];
}

/**
 * Check if a contract address is deployed (not zero address)
 */
export function isContractDeployed(address: string): boolean {
  return address !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/address/${address}`;
}

/**
 * Validate contract addresses are set
 */
export function validateContracts(): {
  valid: boolean;
  missing: string[];
} {
  const addresses = getContractAddresses();
  const missing: string[] = [];

  Object.entries(addresses).forEach(([name, address]) => {
    if (!isContractDeployed(address)) {
      missing.push(name);
    }
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Contract deployment status
 */
export interface DeploymentInfo {
  network: NetworkName;
  timestamp?: string;
  deployer?: string;
  gasUsed?: {
    propertyToken?: string;
    marketplace?: string;
    governance?: string;
    staking?: string;
  };
  txHashes?: {
    propertyToken?: string;
    marketplace?: string;
    governance?: string;
    staking?: string;
  };
}

/**
 * Export deployment info to JSON
 */
export function getDeploymentInfo(): DeploymentInfo {
  const network = getCurrentNetwork();
  const addresses = getContractAddresses();

  return {
    network,
    timestamp: new Date().toISOString(),
    // Add more deployment details as needed
  };
}

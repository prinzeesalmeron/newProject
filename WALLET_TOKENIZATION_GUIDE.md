# Wallet-Based Property Tokenization Guide

Complete guide for using the wallet-based smart contract deployment feature for property tokenization.

## Overview

Your application now supports **wallet-based property tokenization**, allowing users to:
1. Connect their MetaMask wallet
2. Tokenize properties as NFTs on the blockchain
3. Pay gas fees directly from their wallet
4. View transactions on blockchain explorer

## Architecture

### Components Created

#### 1. **PropertyTokenizationService** (`src/lib/blockchain/propertyTokenization.ts`)
Core service that handles all blockchain interactions:
- Wallet connection management
- Property tokenization (minting NFTs)
- Token purchases
- Balance queries
- Gas estimation
- Event listening

#### 2. **AddPropertyModalWithBlockchain** (`src/components/AddPropertyModalWithBlockchain.tsx`)
Enhanced modal component with blockchain integration:
- Multi-step tokenization flow
- Wallet connection check
- Gas estimation display
- Transaction confirmation
- Real-time status updates
- Error handling

### How It Works

```
User Flow:
1. User clicks "Add Property"
   ↓
2. Check wallet connection
   ↓ (if not connected)
3. Connect MetaMask wallet
   ↓
4. Fill in property details
   ↓
5. Click "Estimate Gas"
   ↓
6. Review gas cost & confirm
   ↓
7. Sign transaction in MetaMask
   ↓
8. Wait for blockchain confirmation
   ↓
9. Save to Supabase database
   ↓
10. Success! Property is tokenized
```

## Setup Instructions

### Step 1: Deploy Smart Contracts

Before using the wallet-based tokenization, you MUST deploy the smart contracts first.

```bash
# Follow the deployment guide
./scripts/deploy.sh

# Or manually
forge script script/Deploy.s.sol:DeployPropertyToken \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

**Save the deployed contract address!**

### Step 2: Update Contract Addresses

Edit `src/lib/contractConfig.ts` and add your deployed contract address:

```typescript
export const CONTRACT_ADDRESSES = {
  SEPOLIA: {
    PROPERTY_TOKEN: '0xYourDeployedContractAddress', // ← UPDATE THIS
    MARKETPLACE: '0x...',
    GOVERNANCE: '0x...',
    STAKING: '0x...',
  },
  // ...
};
```

### Step 3: Update Marketplace.tsx

Replace the old `AddPropertyModal` with the new blockchain-enabled version:

```typescript
// In src/pages/Marketplace.tsx

// OLD:
import { AddPropertyModal } from '../components/AddPropertyModal';

// NEW:
import { AddPropertyModalWithBlockchain } from '../components/AddPropertyModalWithBlockchain';

// Update the component usage:
<AddPropertyModalWithBlockchain
  isOpen={showAddModal}
  onClose={() => setShowAddModal(false)}
  onAdd={handleAddProperty}
/>
```

### Step 4: Update handleAddProperty Function

Modify the `handleAddProperty` function to accept blockchain data:

```typescript
// In src/pages/Marketplace.tsx

const handleAddProperty = async (
  propertyData: Omit<Property, 'id'>,
  blockchainData?: {
    propertyId: number;
    transactionHash: string;
    blockNumber: number;
  }
) => {
  try {
    console.log('Adding property:', propertyData);
    console.log('Blockchain data:', blockchainData);

    // Create property in database with blockchain reference
    const newProperty = await PropertyAPI.createProperty({
      ...propertyData,
      // Add blockchain metadata
      blockchain_property_id: blockchainData?.propertyId,
      blockchain_tx_hash: blockchainData?.transactionHash,
      blockchain_block_number: blockchainData?.blockNumber,
    });

    console.log('Property added successfully:', newProperty);

    // Refresh the properties list
    fetchProperties();

    // Show success toast
    toast.success(
      'Property Tokenized!',
      `"${newProperty.title}" has been tokenized on blockchain!`
    );
  } catch (error) {
    console.error('Error adding property:', error);
    toast.error('Failed to Add Property', 'Please try again.');
    throw error;
  }
};
```

### Step 5: Add Database Columns (Optional)

If you want to store blockchain references in Supabase, add these columns to the `properties` table:

```sql
ALTER TABLE properties
ADD COLUMN blockchain_property_id INTEGER,
ADD COLUMN blockchain_tx_hash TEXT,
ADD COLUMN blockchain_block_number INTEGER;
```

## Usage Guide

### For Users

#### 1. Connect Wallet

When users click "Add Property," they'll be prompted to connect MetaMask:

```
┌─────────────────────────┐
│  Connect Your Wallet    │
│                         │
│  [Connect MetaMask]     │
│  [Cancel]               │
└─────────────────────────┘
```

**Requirements:**
- MetaMask installed
- Connected to Sepolia testnet
- Sufficient ETH for gas fees (~0.001-0.01 ETH)

#### 2. Fill Property Details

Standard property form:
- Title
- Location
- Description
- Image URL
- Property Type
- Total Tokens
- Price per Token
- Rental Yield
- etc.

#### 3. Estimate Gas

Click "Next: Estimate Gas" to see transaction costs:

```
┌─────────────────────────────┐
│  Confirm Tokenization       │
│                             │
│  Property: Modern Apt       │
│  Location: NYC              │
│  Total Tokens: 1000         │
│  Price per Token: $100      │
│                             │
│  Estimated Gas: 250,000     │
│  Gas Cost: ~0.005 ETH       │
│                             │
│  [Back]  [Confirm & Tokenize]│
└─────────────────────────────┘
```

#### 4. Confirm Transaction

Click "Confirm & Tokenize" to:
1. Open MetaMask for transaction signing
2. User reviews and confirms in MetaMask
3. Transaction is sent to blockchain
4. Wait for confirmation (10-30 seconds)

#### 5. Success!

Once confirmed:
- Property is tokenized as NFT
- Saved to database
- Transaction hash displayed
- Link to view on Etherscan

```
┌─────────────────────────────┐
│  ✓ Property Tokenized!      │
│                             │
│  Modern Apt has been        │
│  tokenized on blockchain    │
│                             │
│  [View on Explorer →]       │
└─────────────────────────────┘
```

## API Reference

### PropertyTokenizationService

#### `initialize()`
Initializes the service with wallet connection.

```typescript
await propertyTokenizationService.initialize();
```

#### `tokenizeProperty(data)`
Tokenizes a property on blockchain.

```typescript
const result = await propertyTokenizationService.tokenizeProperty({
  title: "Modern Apartment",
  location: "New York, NY",
  totalTokens: 1000,
  pricePerToken: 100,
  description: "Beautiful downtown apartment",
  imageUrl: "https://...",
  features: ["Pool", "Gym"]
});

// Result:
{
  success: true,
  propertyId: 1,
  transactionHash: "0x123...",
  blockNumber: 12345
}
```

#### `purchaseTokens(propertyId, amount)`
Purchase tokens of a tokenized property.

```typescript
const result = await propertyTokenizationService.purchaseTokens(1, 10);
```

#### `getTokenBalance(propertyId, address?)`
Get token balance for an address.

```typescript
const balance = await propertyTokenizationService.getTokenBalance(1);
// Returns: 10
```

#### `getPropertyDetails(propertyId)`
Get property details from blockchain.

```typescript
const property = await propertyTokenizationService.getPropertyDetails(1);
// Returns: { title, location, totalTokens, availableTokens, ... }
```

#### `estimateTokenizationCost(data)`
Estimate gas cost before tokenization.

```typescript
const estimate = await propertyTokenizationService.estimateTokenizationCost({
  title: "...",
  location: "...",
  totalTokens: 1000,
  pricePerToken: 100,
  // ...
});

// Returns: { gasEstimate: "250000", gasCostETH: "0.005" }
```

## Error Handling

### Common Errors

#### 1. "Wallet not connected"
**Solution:** User needs to connect MetaMask

```typescript
if (!propertyTokenizationService.isWalletConnected()) {
  await useWalletConnector.getState().connect('metamask');
}
```

#### 2. "Contract not deployed"
**Solution:** Deploy contracts first, update contract addresses

```bash
./scripts/deploy.sh
# Then update src/lib/contractConfig.ts
```

#### 3. "Insufficient funds for gas"
**Solution:** User needs more ETH in wallet
- Get from faucet: https://sepoliafaucet.com
- Need ~0.01 ETH for multiple transactions

#### 4. "Transaction rejected by user"
**Solution:** User cancelled in MetaMask
- Let user try again
- Show helpful message

#### 5. "Network mismatch"
**Solution:** Switch to correct network

```typescript
await useWalletConnector.getState().switchNetwork(11155111); // Sepolia
```

## Testing

### Test Checklist

- [ ] Wallet connection works
- [ ] MetaMask prompts for signature
- [ ] Gas estimation displays correctly
- [ ] Transaction sends successfully
- [ ] Property ID returned from blockchain
- [ ] Transaction hash recorded
- [ ] Property saved to database
- [ ] Success message displays
- [ ] Etherscan link works
- [ ] Error handling works

### Test on Sepolia

1. Get test ETH from https://sepoliafaucet.com
2. Connect MetaMask to Sepolia
3. Try tokenizing a test property
4. Verify transaction on https://sepolia.etherscan.io

## Security Considerations

### DO:
✅ Validate all input data
✅ Estimate gas before transactions
✅ Show clear confirmation dialogs
✅ Handle errors gracefully
✅ Store blockchain references in database
✅ Verify contracts are deployed

### DON'T:
❌ Store private keys anywhere
❌ Auto-sign transactions without user confirmation
❌ Skip wallet connection checks
❌ Ignore gas estimation errors
❌ Deploy to mainnet without testing

## Troubleshooting

### User Reports: "Transaction stuck"

Check transaction on Etherscan:
```
https://sepolia.etherscan.io/tx/[TRANSACTION_HASH]
```

Possible issues:
- Gas price too low (wait or speed up)
- Network congestion (wait)
- Transaction failed (check revert reason)

### User Reports: "MetaMask not opening"

Common fixes:
1. Refresh page
2. Check MetaMask is unlocked
3. Check correct network selected
4. Reinstall MetaMask (last resort)

### Developer: "Contract function not found"

Check:
1. Contract address correct in `contractConfig.ts`
2. ABI matches deployed contract
3. Contract verified on Etherscan
4. Function signature matches

## Advanced Usage

### Listen for Events

```typescript
// Listen for property tokenization events
propertyTokenizationService.onPropertyTokenized(
  (propertyId, owner, totalTokens, pricePerToken) => {
    console.log('New property tokenized:', {
      propertyId,
      owner,
      totalTokens,
      pricePerToken
    });
    // Update UI, show notification, etc.
  }
);

// Cleanup
propertyTokenizationService.removeAllListeners();
```

### Custom Gas Price

```typescript
// Get current gas price
const gasPrice = await provider.getGasPrice();

// Increase by 20% for faster confirmation
const fasterGasPrice = gasPrice.mul(120).div(100);

// Use in transaction
const tx = await contract.tokenizeProperty(..., {
  gasPrice: fasterGasPrice
});
```

### Batch Operations

```typescript
// Tokenize multiple properties
const properties = [property1, property2, property3];

for (const property of properties) {
  const result = await propertyTokenizationService.tokenizeProperty(property);
  console.log('Tokenized property ID:', result.propertyId);

  // Wait between transactions to avoid nonce issues
  await new Promise(resolve => setTimeout(resolve, 15000)); // 15s
}
```

## Integration Checklist

Before deploying to production:

- [ ] Smart contracts audited
- [ ] Contracts deployed to correct network
- [ ] Contract addresses updated in config
- [ ] Database schema includes blockchain fields
- [ ] Error handling tested
- [ ] Gas estimation accurate
- [ ] UI/UX reviewed
- [ ] Wallet connection flows tested
- [ ] Transaction receipts stored
- [ ] Explorer links working
- [ ] Documentation updated
- [ ] User guide created

## Support

For issues or questions:

1. Check this guide
2. Review contract deployment docs
3. Check Etherscan for transaction status
4. Verify wallet has sufficient funds
5. Ensure correct network selected

## Next Steps

1. ✅ Deploy smart contracts (see `DEPLOYMENT_INSTRUCTIONS.md`)
2. ✅ Update contract addresses in `contractConfig.ts`
3. ✅ Replace `AddPropertyModal` with `AddPropertyModalWithBlockchain`
4. ✅ Update `handleAddProperty` to accept blockchain data
5. ✅ Test on Sepolia testnet
6. ✅ Add database migrations for blockchain fields
7. ✅ Deploy to production

---

**Last Updated:** 2025-10-14
**Status:** Ready for Integration
**Network:** Sepolia Testnet (recommended)

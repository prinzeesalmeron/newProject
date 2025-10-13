# Smart Contract Deployment & Verification Guide

## Overview
This guide covers deploying and verifying the BlockEstate smart contracts (PropertyToken, Marketplace, and Governance contracts).

## Prerequisites

### 1. Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Install Dependencies
```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install smartcontractkit/chainlink
```

### 3. Configure Environment Variables

Create or update your `.env` file:

```bash
# Deployment wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC endpoints
ALCHEMY_API_KEY=your_alchemy_api_key

# Block explorers for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
```

**⚠️ SECURITY WARNING:** Never commit your `.env` file with real private keys to version control!

## Smart Contracts Included

### PropertyToken.sol
ERC1155 token representing fractional ownership of real estate properties.

### Marketplace.sol
Marketplace for trading property tokens with ETH.

### Governance.sol (MyGovernor)
On-chain governance system using OpenZeppelin Governor contracts.

## Deployment Steps

### Step 1: Compile Contracts

```bash
forge build
```

Expected output:
```
[⠊] Compiling...
[⠒] Compiling 3 files with 0.8.19
[⠢] Solc 0.8.19 finished in X.XXs
Compiler run successful!
```

### Step 2: Test Deployment (Dry Run)

Run without `--broadcast` to simulate:

```bash
# Testnet simulation
forge script script/DeployTestnet.s.sol:DeployTestnetScript \
  --rpc-url sepolia \
  -vvvv
```

This shows gas estimates and deployment addresses without actually deploying.

### Step 3: Deploy to Sepolia Testnet

```bash
forge script script/DeployTestnet.s.sol:DeployTestnetScript \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  -vvvv
```

**Flags explained:**
- `--rpc-url sepolia`: Use Sepolia testnet
- `--broadcast`: Actually send transactions
- `--verify`: Automatically verify contracts on Etherscan
- `-vvvv`: Verbose output for debugging

### Step 4: Deploy to Mainnet

⚠️ **CAUTION:** Mainnet deployment costs real ETH!

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url mainnet \
  --broadcast \
  --verify \
  -vvvv
```

## Manual Contract Verification

If automatic verification fails, verify manually:

### PropertyToken
```bash
forge verify-contract <CONTRACT_ADDRESS> \
  contracts/PropertyToken.sol:PropertyToken \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(string)" "https://api.blockestate.com/metadata/")
```

### Marketplace
```bash
forge verify-contract <CONTRACT_ADDRESS> \
  contracts/Marketplace.sol:Marketplace \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" <PAYMENT_TOKEN_ADDRESS> 250)
```

### Governance (MyGovernor)
```bash
forge verify-contract <CONTRACT_ADDRESS> \
  contracts/Governance.sol:MyGovernor \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(address,address)" <TOKEN_ADDRESS> <TIMELOCK_ADDRESS>)
```

### TimelockController
```bash
forge verify-contract <CONTRACT_ADDRESS> \
  @openzeppelin/contracts/governance/TimelockController.sol:TimelockController \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(uint256,address[],address[],address)" 3600 "[<PROPOSER>]" "[<EXECUTOR>]" <ADMIN>)
```

## Post-Deployment

### 1. Update Frontend Contract Addresses

Edit `src/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  PROPERTY_TOKEN: '0xYourPropertyTokenAddress',
  MARKETPLACE: '0xYourMarketplaceAddress',
  GOVERNANCE: '0xYourGovernorAddress',
  TIMELOCK: '0xYourTimelockAddress'
};
```

### 2. Verify on Block Explorer

Visit the block explorer (e.g., Etherscan):
- Sepolia: `https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>`
- Mainnet: `https://etherscan.io/address/<CONTRACT_ADDRESS>`

Look for the green checkmark ✓ indicating verified source code.

## Troubleshooting

### "Insufficient funds for gas"
- Check your wallet has enough ETH for gas fees
- Testnet: Get free ETH from [Sepolia faucet](https://sepoliafaucet.com/)

### "Verification failed"
- Ensure compiler version matches (0.8.19)
- Check constructor arguments are correct
- Try manual verification with exact parameters

### "Nonce too low"
- Another transaction is pending
- Wait or cancel pending transaction

### "Contract already verified"
- Contract is already verified, you're done!

## Gas Estimates

### Sepolia Testnet
- PropertyToken: ~2-3M gas
- Marketplace: ~1-2M gas
- Governance + Timelock: ~4-5M gas
- **Total:** ~8-10M gas (~0.01-0.05 ETH at typical gas prices)

### Mainnet
- Similar gas usage but real ETH costs
- **Estimated cost:** 0.5-2.0 ETH depending on gas prices

## Network Information

### Sepolia Testnet
- Chain ID: 11155111
- RPC: `https://eth-sepolia.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
- Explorer: https://sepolia.etherscan.io
- Faucet: https://sepoliafaucet.com

### Ethereum Mainnet
- Chain ID: 1
- RPC: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
- Explorer: https://etherscan.io

## Additional Commands

### Check deployment address before deploying
```bash
cast wallet address --private-key $PRIVATE_KEY
```

### Check ETH balance
```bash
cast balance <ADDRESS> --rpc-url sepolia
```

### Estimate gas price
```bash
cast gas-price --rpc-url sepolia
```

### View transaction details
```bash
cast tx <TX_HASH> --rpc-url sepolia
```

## Security Best Practices

1. ✅ Use a hardware wallet for mainnet deployments
2. ✅ Test thoroughly on testnet first
3. ✅ Never share private keys
4. ✅ Use environment variables for sensitive data
5. ✅ Verify contracts immediately after deployment
6. ✅ Audit code before mainnet deployment
7. ✅ Set up multi-sig for contract ownership

## Support

For issues or questions:
- Check Foundry docs: https://book.getfoundry.sh/
- OpenZeppelin docs: https://docs.openzeppelin.com/
- Foundry Telegram: https://t.me/foundry_rs

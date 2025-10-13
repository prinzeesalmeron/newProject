# Smart Contract Deployment & Verification Guide

Complete guide for deploying and verifying BlockEstate smart contracts on Ethereum networks.

---

## 📋 Prerequisites

### 1. Install Foundry

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
```

### 2. Get Required API Keys

**Etherscan API Key:**
1. Go to https://etherscan.io (or Sepolia: https://sepolia.etherscan.io)
2. Sign up / Log in
3. Navigate to API Keys section
4. Create new API key
5. Copy the key

**RPC URL:**
- **Infura**: https://infura.io (free tier available)
- **Alchemy**: https://www.alchemy.com (free tier available)
- **QuickNode**: https://www.quicknode.com

### 3. Get Test ETH (for Testnet)

**Sepolia Testnet Faucets:**
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

**Minimum Required:**
- ~0.5 ETH for all contract deployments
- Extra ETH for testing

---

## 🔐 Environment Setup

### 1. Create `.env` File

Create a `.env` file in the project root:

```bash
# Private key (DO NOT SHARE OR COMMIT!)
PRIVATE_KEY=your_private_key_here

# Sepolia Testnet
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Mainnet (use with extreme caution!)
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 2. Export Private Key from Wallet

**⚠️ CRITICAL SECURITY WARNING:**
- Never share your private key
- Use a separate wallet for deployment
- Never commit .env to git
- Verify .env is in .gitignore

**MetaMask:**
1. Click account icon → Account Details
2. Click "Show Private Key"
3. Enter password
4. Copy private key (without 0x prefix)

---

## 🚀 Deployment Process

### Step 1: Compile Contracts

```bash
# Compile all contracts
forge build

# Check for compilation errors
# Should see: "Compiler run successful"
```

**Expected Output:**
```
[⠢] Compiling...
[⠆] Compiling 4 files with 0.8.19
[⠰] Solc 0.8.19 finished in 2.34s
Compiler run successful!
```

### Step 2: Test Contracts (Optional but Recommended)

```bash
# Run tests if you have any
forge test

# Run with verbose output
forge test -vvv
```

### Step 3: Deploy to Sepolia Testnet

#### 3.1 Deploy PropertyToken

```bash
forge script script/Deploy.s.sol:DeployPropertyToken \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

**Save the deployed address!** Example output:
```
PropertyToken deployed to: 0x1234567890123456789012345678901234567890
```

#### 3.2 Deploy Marketplace

```bash
forge script script/Deploy.s.sol:DeployMarketplace \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

#### 3.3 Deploy Governance

```bash
forge script script/Deploy.s.sol:DeployGovernance \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

#### 3.4 Deploy Staking

```bash
forge script script/DeployStaking.s.sol:DeployStaking \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### Step 4: Fund Staking Rewards Pool

```bash
# Send ETH to staking contract for rewards
# Replace with your deployed staking address
cast send <STAKING_ADDRESS> \
  --value 1ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## ✅ Manual Verification (If Auto-Verify Fails)

If automatic verification fails, verify manually:

### 1. Flatten Contract

```bash
# Flatten the contract
forge flatten contracts/Staking.sol > Staking_flat.sol
```

### 2. Verify on Etherscan

1. Go to contract address on Etherscan
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Fill in details:
   - **Compiler Type**: Solidity (Single file)
   - **Compiler Version**: v0.8.19+commit.7dd6d404
   - **License**: MIT
5. Paste flattened code
6. Click "Verify and Publish"

### Alternative: Verify with Foundry

```bash
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --compiler-version v0.8.19+commit.7dd6d404 \
  <CONTRACT_ADDRESS> \
  contracts/Staking.sol:Staking \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

---

## 🔍 Verification Status

### Check Verification Status

```bash
# Check if contract is verified
cast interface <CONTRACT_ADDRESS> \
  --chain sepolia
```

### View on Etherscan

Visit your contract on Etherscan:
- **Sepolia**: `https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>`
- **Mainnet**: `https://etherscan.io/address/<CONTRACT_ADDRESS>`

**Verified contracts show:**
- ✅ Green checkmark
- "Contract Source Code Verified"
- Readable source code tab
- Read/Write contract interface

---

## 📝 Post-Deployment Checklist

### 1. Save All Contract Addresses

Create a deployment record:

```javascript
// deployment-addresses.json
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployedAt": "2025-10-13T08:30:00Z",
  "contracts": {
    "PropertyToken": "0x...",
    "Marketplace": "0x...",
    "Governance": "0x...",
    "Staking": "0x..."
  }
}
```

### 2. Update Frontend Configuration

Update `src/lib/config.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  PROPERTY_TOKEN: '0xYourPropertyTokenAddress',
  MARKETPLACE: '0xYourMarketplaceAddress',
  GOVERNANCE: '0xYourGovernanceAddress',
  STAKING: '0xYourStakingAddress',
} as const;

export const CHAIN_ID = 11155111; // Sepolia
```

### 3. Export ABIs

```bash
# Create ABIs directory if it doesn't exist
mkdir -p src/lib/abis

# Export ABIs
forge inspect PropertyToken abi > src/lib/abis/PropertyToken.json
forge inspect Marketplace abi > src/lib/abis/Marketplace.json
forge inspect Governance abi > src/lib/abis/Governance.json
forge inspect Staking abi > src/lib/abis/Staking.json
```

### 4. Test Contract Interactions

```bash
# Test reading from contract
cast call <STAKING_ADDRESS> "poolCount()" --rpc-url $SEPOLIA_RPC_URL

# Should return: 4 (number of pools)
```

### 5. Verify on Frontend

1. Start development server: `npm run dev`
2. Connect wallet to Sepolia
3. Navigate to staking page
4. Verify pools are loading
5. Test staking with small amount

---

## 🌐 Mainnet Deployment

**⚠️ EXTREME CAUTION REQUIRED**

Only deploy to mainnet after:
- [ ] Extensive testnet testing (minimum 1 week)
- [ ] Security audit completed
- [ ] All features tested thoroughly
- [ ] Gas optimization review
- [ ] Emergency procedures documented
- [ ] Sufficient ETH for deployment (~$500-1000 in gas)

### Mainnet Deployment Commands

```bash
# PropertyToken
forge script script/Deploy.s.sol:DeployPropertyToken \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv

# Marketplace
forge script script/Deploy.s.sol:DeployMarketplace \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv

# Governance
forge script script/Deploy.s.sol:DeployGovernance \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv

# Staking
forge script script/DeployStaking.s.sol:DeployStaking \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### Mainnet Safety Checklist

Before mainnet deployment:

1. **Smart Contract Audit**
   - [ ] Hire professional auditors
   - [ ] Fix all critical issues
   - [ ] Address high/medium severity issues
   - [ ] Document remaining known issues

2. **Testing**
   - [ ] All unit tests passing
   - [ ] Integration tests completed
   - [ ] Stress tests performed
   - [ ] Economic model validated

3. **Security**
   - [ ] Admin keys secured (hardware wallet)
   - [ ] Multisig setup for admin functions
   - [ ] Emergency pause procedures tested
   - [ ] Bug bounty program ready

4. **Legal & Compliance**
   - [ ] Legal review completed
   - [ ] Regulatory compliance checked
   - [ ] Terms of service ready
   - [ ] Privacy policy prepared

5. **Operations**
   - [ ] Monitoring system setup
   - [ ] Alert system configured
   - [ ] Support team trained
   - [ ] Documentation complete

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid API Key"
- Verify Etherscan API key is correct
- Check if key has verification permissions
- Wait 5 minutes after creating new key

#### 2. "Insufficient Funds"
- Check deployer wallet has enough ETH
- Gas prices may be high - wait or increase budget
- Sepolia faucets for testnet ETH

#### 3. "Contract Already Deployed"
- Different nonce needed
- Clear broadcast directory: `rm -rf broadcast/`
- Use `--resume` flag to continue

#### 4. "Compilation Failed"
- Check Solidity version matches (0.8.19)
- Run `forge clean` then `forge build`
- Verify all dependencies installed

#### 5. "Verification Failed"
- Try manual verification on Etherscan
- Flatten contract first
- Check compiler version exactly matches
- Ensure optimizer settings match

### Get Help

```bash
# Check Foundry documentation
forge --help
cast --help

# View transaction details
cast receipt <TX_HASH> --rpc-url $SEPOLIA_RPC_URL

# Check gas price
cast gas-price --rpc-url $SEPOLIA_RPC_URL

# Check wallet balance
cast balance <YOUR_ADDRESS> --rpc-url $SEPOLIA_RPC_URL
```

---

## 📊 Gas Estimation

Approximate gas costs on Ethereum (as of 2024):

### Deployment Costs (Sepolia Testnet - FREE)
| Contract | Gas Used | ETH Cost (50 gwei) | USD (ETH @ $2000) |
|----------|----------|-------------------|-------------------|
| PropertyToken | ~2M | 0.1 ETH | $200 |
| Marketplace | ~1.5M | 0.075 ETH | $150 |
| Governance | ~1.8M | 0.09 ETH | $180 |
| Staking | ~2.5M | 0.125 ETH | $250 |
| **Total** | ~7.8M | **0.39 ETH** | **$780** |

### Mainnet Costs (varies with gas price)
At 50 gwei gas price: ~$780 total
At 100 gwei gas price: ~$1,560 total

**Tip:** Deploy during low gas periods (weekends, late night UTC)

---

## 🔒 Security Best Practices

### 1. Private Key Management
- ✅ Use hardware wallet for mainnet
- ✅ Never commit private keys
- ✅ Use separate deployment wallet
- ✅ Test with small amounts first

### 2. Contract Security
- ✅ Run security audit before mainnet
- ✅ Test pause/unpause functionality
- ✅ Verify emergency withdrawal works
- ✅ Check all admin functions restricted

### 3. Post-Deployment
- ✅ Transfer ownership to multisig
- ✅ Set up monitoring alerts
- ✅ Document all admin actions
- ✅ Regular security reviews

---

## 📚 Additional Resources

### Documentation
- Foundry Book: https://book.getfoundry.sh/
- Etherscan Verification: https://docs.etherscan.io/tutorials/verifying-contracts
- OpenZeppelin: https://docs.openzeppelin.com/

### Tools
- Gas Tracker: https://etherscan.io/gastracker
- Sepolia Faucet: https://sepoliafaucet.com
- Remix IDE: https://remix.ethereum.org (for quick testing)

### Security
- Consensys Best Practices: https://consensys.github.io/smart-contract-best-practices/
- OpenZeppelin Security: https://docs.openzeppelin.com/contracts/security

---

## ✅ Quick Reference

### Essential Commands

```bash
# Compile
forge build

# Test
forge test -vvv

# Deploy (Sepolia)
forge script script/DeployStaking.s.sol:DeployStaking \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Verify manually
forge verify-contract \
  --chain-id 11155111 \
  <ADDRESS> \
  contracts/Staking.sol:Staking \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Export ABI
forge inspect Staking abi > src/lib/abis/Staking.json

# Check balance
cast balance <ADDRESS> --rpc-url $SEPOLIA_RPC_URL

# Send ETH
cast send <ADDRESS> --value 1ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

---

**Last Updated:** 2025-10-13
**Status:** Ready for Deployment
**Recommended Network:** Sepolia Testnet (before mainnet)

---

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Get test ETH from faucet
3. ✅ Deploy contracts to Sepolia
4. ✅ Verify contracts on Etherscan
5. ✅ Update frontend config
6. ✅ Test all features
7. ⏳ Run for 1+ week on testnet
8. ⏳ Get security audit
9. ⏳ Deploy to mainnet

**Good luck with your deployment! 🚀**

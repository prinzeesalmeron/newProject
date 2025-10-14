# Smart Contract Deployment Instructions

Complete step-by-step guide for deploying BlockEstate smart contracts.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Foundry installed (`forge --version` should work)
- [ ] A wallet with sufficient ETH for deployment
- [ ] Infura or Alchemy API key
- [ ] Etherscan API key for contract verification
- [ ] Private key from deployment wallet

## Quick Start

### 1. Install Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and update these critical values:

```bash
# Your wallet private key (without 0x prefix)
PRIVATE_KEY=your_actual_private_key_here

# RPC URLs (get from Infura or Alchemy)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_actual_etherscan_api_key
```

**Security Warning:** Never commit your `.env` file! It contains your private key.

### 3. Get Test ETH (for Sepolia)

Get free testnet ETH from these faucets:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

You'll need approximately **0.5 ETH** on Sepolia for all deployments.

### 4. Deploy Contracts

#### Option A: Interactive Script (Recommended)

```bash
./scripts/deploy.sh
```

The script will guide you through:
1. Network selection (Sepolia/Mainnet/Localhost)
2. Contract selection (All or specific contracts)
3. Automatic deployment and verification

#### Option B: Manual Deployment

Deploy each contract individually:

```bash
# Compile contracts first
forge build

# Deploy PropertyToken
forge script script/Deploy.s.sol:DeployPropertyToken \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv

# Deploy Marketplace
forge script script/Deploy.s.sol:DeployMarketplace \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv

# Deploy Governance
forge script script/Deploy.s.sol:DeployGovernance \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv

# Deploy Staking
forge script script/DeployStaking.s.sol:DeployStaking \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### 5. Save Deployment Addresses

After deployment, you'll see output like:

```
PropertyToken deployed to: 0x1234...
Marketplace deployed to: 0x5678...
Governance deployed to: 0x9abc...
Staking deployed to: 0xdef0...
```

**Save these addresses immediately!**

Update `deployment-addresses.json`:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployedAt": "2025-10-14T10:00:00Z",
  "deployer": "0xYourDeployerAddress",
  "contracts": {
    "PropertyToken": {
      "address": "0xYourPropertyTokenAddress",
      "deploymentTx": "0xTransactionHash",
      "verified": true
    },
    "Marketplace": {
      "address": "0xYourMarketplaceAddress",
      "deploymentTx": "0xTransactionHash",
      "verified": true
    },
    "Governance": {
      "address": "0xYourGovernanceAddress",
      "deploymentTx": "0xTransactionHash",
      "verified": true
    },
    "Staking": {
      "address": "0xYourStakingAddress",
      "deploymentTx": "0xTransactionHash",
      "verified": true
    }
  }
}
```

### 6. Update Frontend Configuration

Edit `src/lib/contractConfig.ts` and update the contract addresses:

```typescript
export const CONTRACT_ADDRESSES: Record<NetworkName, {...}> = {
  SEPOLIA: {
    PROPERTY_TOKEN: '0xYourPropertyTokenAddress',
    MARKETPLACE: '0xYourMarketplaceAddress',
    GOVERNANCE: '0xYourGovernanceAddress',
    STAKING: '0xYourStakingAddress',
  },
  // ... other networks
};
```

### 7. Export Contract ABIs

If you need to update ABIs (already provided):

```bash
forge inspect Staking abi > src/lib/abis/Staking.json
forge inspect PropertyToken abi > src/lib/abis/PropertyToken.json
forge inspect Marketplace abi > src/lib/abis/Marketplace.json
forge inspect Governance abi > src/lib/abis/Governance.json
```

### 8. Fund Staking Contract

Send ETH to the staking contract for rewards:

```bash
cast send <STAKING_CONTRACT_ADDRESS> \
  --value 1ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 9. Test Deployment

```bash
# Check if contracts are deployed
cast code <CONTRACT_ADDRESS> --rpc-url $SEPOLIA_RPC_URL

# Call a view function (e.g., check pool count)
cast call <STAKING_ADDRESS> "poolCount()" --rpc-url $SEPOLIA_RPC_URL

# Should return: 4 (if staking has 4 pools)
```

### 10. Verify on Etherscan

Visit your contracts on Etherscan:
- **Sepolia:** `https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>`
- **Mainnet:** `https://etherscan.io/address/<CONTRACT_ADDRESS>`

Look for:
- ✅ Green checkmark next to contract
- "Contract Source Code Verified" label
- Read/Write Contract tabs available

## Manual Verification (if auto-verify fails)

```bash
# Flatten contract
forge flatten contracts/Staking.sol > Staking_flat.sol

# Verify on Etherscan
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --compiler-version v0.8.19+commit.7dd6d404 \
  <CONTRACT_ADDRESS> \
  contracts/Staking.sol:Staking \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

Or use Etherscan's web interface:
1. Go to contract page on Etherscan
2. Click "Contract" → "Verify and Publish"
3. Select "Solidity (Single file)"
4. Paste flattened code
5. Submit

## Testing the Integration

After deployment, test the frontend integration:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

**Test these features:**
1. Connect wallet (MetaMask on Sepolia)
2. Navigate to Staking page
3. Verify 4 pools are displayed
4. Try staking a small amount (0.01 ETH)
5. Check transaction on Etherscan

## Troubleshooting

### "Insufficient funds for gas"
- Check your wallet has enough ETH
- Get more from faucet: https://sepoliafaucet.com

### "Invalid API Key"
- Verify Etherscan API key is correct
- Wait 5 minutes after creating new key
- Check key has verification permissions

### "Contract already deployed"
- Clear broadcast cache: `rm -rf broadcast/`
- Use `--resume` flag to continue deployment

### "Verification failed"
- Try manual verification (see above)
- Check compiler version matches (v0.8.19)
- Ensure optimization settings match

### "RPC Error"
- Check RPC URL is correct
- Verify API key in RPC URL is valid
- Try different RPC provider (Infura/Alchemy)

## Gas Costs Estimate

### Sepolia (Testnet - FREE)
All testnet deployments are free. Just get testnet ETH from faucets.

### Mainnet (as of 2024)
At 50 gwei gas price:
- PropertyToken: ~$200
- Marketplace: ~$150
- Governance: ~$180
- Staking: ~$250
- **Total: ~$780**

**Tip:** Deploy during low gas periods (weekends, late night UTC)

## Security Checklist

Before mainnet deployment:

- [ ] Smart contracts audited by professional auditors
- [ ] All critical/high severity issues fixed
- [ ] Extensive testing on testnet (minimum 1 week)
- [ ] Admin keys secured (hardware wallet)
- [ ] Multisig wallet setup for admin functions
- [ ] Emergency procedures documented and tested
- [ ] Bug bounty program prepared
- [ ] Legal review completed
- [ ] Monitoring and alerting system ready

## Post-Deployment Checklist

- [ ] Contract addresses saved in `deployment-addresses.json`
- [ ] Frontend config updated with addresses
- [ ] Contracts verified on Etherscan
- [ ] Staking contract funded with rewards
- [ ] All contracts tested via frontend
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Monitoring enabled

## Support

If you encounter issues:

1. Check Foundry docs: https://book.getfoundry.sh/
2. Review Etherscan verification guide
3. Check deployment logs in `broadcast/` directory
4. Verify all environment variables are set correctly

## Important Links

- **Sepolia Faucet:** https://sepoliafaucet.com
- **Sepolia Explorer:** https://sepolia.etherscan.io
- **Alchemy:** https://www.alchemy.com
- **Infura:** https://infura.io
- **Foundry Book:** https://book.getfoundry.sh/
- **OpenZeppelin:** https://docs.openzeppelin.com/

---

**Last Updated:** 2025-10-14
**Network Recommendation:** Sepolia Testnet (before mainnet)
**Status:** Ready for Deployment

Good luck! 🚀

# Quick Start - Contract Deployment

Ultra-fast guide to get your contracts deployed in under 10 minutes.

## 1. Install Foundry (2 minutes)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## 2. Configure Environment (2 minutes)

```bash
# Copy and edit
cp .env.example .env
nano .env  # or use your editor

# Add these 3 values:
PRIVATE_KEY=your_wallet_private_key_without_0x
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Get API keys:**
- Alchemy: https://dashboard.alchemy.com (free)
- Etherscan: https://etherscan.io/myapikey (free)

## 3. Get Test ETH (2 minutes)

https://sepoliafaucet.com
- Connect wallet
- Request 0.5 ETH

## 4. Deploy (3 minutes)

```bash
./scripts/deploy.sh
```

Select:
- Network: `1` (Sepolia)
- Contracts: `5` (Staking only, or `1` for all)

## 5. Update Config (1 minute)

After deployment, copy the contract address from output and update:

**File: `src/lib/contractConfig.ts`**

```typescript
SEPOLIA: {
  STAKING: '0xYourAddressHere',  // ← Paste here
  // ...
}
```

## 6. Test (2 minutes)

```bash
npm run dev
```

Visit http://localhost:5173/staking
- Connect MetaMask (Sepolia network)
- Try staking 0.01 ETH

## Done! 🎉

Your contract is deployed and integrated!

---

## Troubleshooting

**"Insufficient funds"** → Get more ETH from faucet
**"Invalid API key"** → Check your Alchemy/Etherscan keys
**"RPC Error"** → Verify RPC URL in .env

## Full Documentation

- Complete guide: `DEPLOYMENT_INSTRUCTIONS.md`
- Integration details: `CONTRACT_INTEGRATION_SUMMARY.md`
- Original guide: `CONTRACT_DEPLOYMENT_GUIDE.md`

---

**Time:** ~10 minutes
**Cost:** FREE (testnet)
**Difficulty:** Easy

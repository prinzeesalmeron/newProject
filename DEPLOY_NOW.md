# 🚀 Deploy Smart Contracts NOW

## ✅ Everything is ready! Just deploy contracts.

---

## Quick 3-Step Process (15 minutes)

### Step 1: Configure `.env` (2 min)

Edit your `.env` file and add these 3 values:

```bash
PRIVATE_KEY=your_metamask_private_key_without_0x
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Get Keys:**
- **Private Key:** MetaMask → 3 dots → Account details → Show private key
- **Alchemy:** https://dashboard.alchemy.com (free, takes 2 min)
- **Etherscan:** https://etherscan.io/myapikey (free, instant)

---

### Step 2: Deploy Contract (10 min)

```bash
./scripts/deploy.sh
```

**Select:**
- Network: `1` (Sepolia)
- Contract: `2` (PropertyToken) or `1` (All)

**Wait for output:**
```
✓ PropertyToken deployed to: 0x1234567890abcdef...
```

**COPY THIS ADDRESS!** ☝️

---

### Step 3: Update Config (1 min)

Open `src/lib/contractConfig.ts`

Find line 53 and paste your address:
```typescript
PROPERTY_TOKEN: '0xYourAddressHere', // ← PASTE HERE
```

Save the file.

---

## Test It! (2 min)

```bash
npm run dev
```

1. Open http://localhost:5173
2. Go to Marketplace
3. Click "Add Property"
4. Connect MetaMask
5. Fill form → Estimate Gas → Confirm
6. Success! Property tokenized! 🎉

---

## Need Test ETH?

https://sepoliafaucet.com (free, instant)

---

## That's It!

Your blockchain integration is live!

**View transactions:** https://sepolia.etherscan.io

**Full docs:** See `WALLET_TOKENIZATION_GUIDE.md`

---

## Commands Quick Reference

```bash
# Deploy
./scripts/deploy.sh

# Test
npm run dev

# Build
npm run build
```

---

**Total Time:** 15 minutes
**Cost:** FREE (testnet)
**Status:** ✅ Ready NOW

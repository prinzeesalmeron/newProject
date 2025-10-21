# ✅ Deployment Script Fixed!

## What Was Wrong

The `deploy.sh` script was looking for individual deployment contracts like:
- `DeployPropertyToken`
- `DeployMarketplace`
- `DeployGovernance`

But these don't exist! The actual script is `DeployTestnet` which deploys all contracts together.

## What I Fixed

Updated `scripts/deploy.sh` to use the correct script:
- Now uses `script/DeployTestnet.s.sol:DeployTestnet`
- Deploys all contracts in one transaction
- Works for all menu options (1-4)

---

## How To Deploy NOW

### Step 1: Run the script again

```bash
./scripts/deploy.sh
```

### Step 2: Make your selections

```
Select network: 1 (Sepolia Testnet)
Select contract: 1 (All Contracts)
```

### Step 3: Watch for output

You should see:
```
PropertyToken deployed at: 0x1234...
Marketplace deployed at: 0x5678...
Staking deployed at: 0x9abc...
TimelockController deployed at: 0xdef0...
```

### Step 4: Copy the PropertyToken address

Look for this line:
```
PropertyToken deployed at: 0x1234567890abcdef...
                          ↑ COPY THIS!
```

### Step 5: Update your config

Open `src/lib/contractConfig.ts` and paste at line 53:

```typescript
PROPERTY_TOKEN: '0x1234567890abcdef...', // ← PASTE HERE
```

---

## If It Still Fails

### Error: "PRIVATE_KEY not found"
**Fix:** Make sure your `.env` file has:
```bash
PRIVATE_KEY=your_private_key_without_0x
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_key
```

### Error: "Insufficient funds"
**Fix:** Get test ETH from https://sepoliafaucet.com
- You need ~0.01 ETH for deployment

### Error: "Network timeout"
**Fix:** Check your RPC URL is correct
- Alchemy: https://dashboard.alchemy.com
- Get free API key
- Use format: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### Error: "Verification failed"
**Don't worry!** The contracts are still deployed.
- Just copy the addresses from the console output
- You can verify manually later on Etherscan

---

## Quick Test After Deployment

```bash
# Start dev server
npm run dev

# Open browser
# Go to: http://localhost:5173

# Test the flow:
1. Click "Marketplace"
2. Click "Add Property"
3. Click "Connect MetaMask"
4. Connect your wallet
5. Fill the form
6. Click "Next: Estimate Gas"
7. Review gas cost
8. Click "Confirm & Tokenize"
9. Confirm in MetaMask
10. Wait for confirmation
11. Success! 🎉
```

---

## What Gets Deployed

The `DeployTestnet` script deploys **4 contracts**:

1. **PropertyToken** ← YOU NEED THIS ONE!
2. **Marketplace** (for trading tokens)
3. **Staking** (for staking rewards)
4. **TimelockController** (for governance)

For the wallet tokenization feature, you only need the **PropertyToken** address.

---

## Contract Addresses You'll Get

After successful deployment:

```
PropertyToken deployed at: 0xABC123...      ← USE THIS
Marketplace deployed at: 0xDEF456...        ← Optional
Staking deployed at: 0xGHI789...            ← Optional
TimelockController deployed at: 0xJKL012... ← Optional
```

Copy the PropertyToken address to `src/lib/contractConfig.ts`!

---

## Summary

✅ **Deploy script is FIXED**
✅ **Ready to deploy NOW**
✅ **Just run: `./scripts/deploy.sh`**

After deployment:
1. Copy PropertyToken address
2. Paste in contractConfig.ts
3. Run `npm run dev`
4. Test property tokenization!

**Time:** ~5 minutes
**Cost:** FREE (Sepolia testnet)

Good luck! 🚀

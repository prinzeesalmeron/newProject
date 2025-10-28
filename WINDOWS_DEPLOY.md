# 🪟 Windows Deployment Guide

## ⚠️ Important: Windows PowerShell Commands

The `deploy.sh` script is for Linux/Mac. On Windows, you need to run the forge command directly.

---

## Quick Deploy (Windows PowerShell)

### Step 1: Check your .env file

Make sure `.env` has these 3 values (no quotes needed):

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Example:**
```env
PRIVATE_KEY=abc123def456...
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xyz789...
ETHERSCAN_API_KEY=ABC123XYZ...
```

---

### Step 2: Load environment variables in PowerShell

```powershell
# Load .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Verify they're loaded
echo $env:PRIVATE_KEY
echo $env:SEPOLIA_RPC_URL
echo $env:ETHERSCAN_API_KEY
```

If the echo commands show your values, you're good to go!

---

### Step 3: Deploy contracts

```powershell
forge script script/DeployTestnet.s.sol --rpc-url $env:SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $env:ETHERSCAN_API_KEY -vvvv
```

**This will:**
- Deploy PropertyToken
- Deploy Marketplace
- Deploy Staking
- Deploy TimelockController
- Create a test property
- Verify contracts on Etherscan

---

### Step 4: Copy the PropertyToken address

Look for this in the output:

```
PropertyToken deployed at: 0x1234567890abcdef1234567890abcdef12345678
                          ↑↑↑ COPY THIS ADDRESS ↑↑↑
```

---

### Step 5: Update config

Open `src/lib/contractConfig.ts` and find line 53:

```typescript
PROPERTY_TOKEN: '0x1234567890abcdef1234567890abcdef12345678', // ← PASTE HERE
```

Save the file.

---

### Step 6: Test it!

```powershell
npm run dev
```

Then:
1. Open http://localhost:5173
2. Go to Marketplace
3. Click "Add Property"
4. Connect MetaMask
5. Fill form and tokenize!

---

## Alternative: One-Line Deploy (If .env is properly formatted)

If your `.env` file is set up correctly, you can try:

```powershell
forge script script/DeployTestnet.s.sol --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY --broadcast -vvvv
```

Replace `YOUR_KEY` with your actual Alchemy API key.

---

## Troubleshooting

### Issue: "PRIVATE_KEY not found"

**Option A: Set manually in PowerShell**
```powershell
$env:PRIVATE_KEY = "your_private_key_here"
$env:SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
$env:ETHERSCAN_API_KEY = "your_etherscan_key"
```

Then run the forge script command.

**Option B: Use --private-key flag (NOT RECOMMENDED - visible in history)**
```powershell
forge script script/DeployTestnet.s.sol --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY --private-key YOUR_PRIVATE_KEY --broadcast -vvvv
```

---

### Issue: "Insufficient funds"

**Get test ETH:**
1. Go to: https://sepoliafaucet.com
2. Enter your wallet address
3. Click "Send Me ETH"
4. Wait ~30 seconds
5. Try deploying again

---

### Issue: "Invalid API Key"

**Check your Alchemy URL:**
```powershell
echo $env:SEPOLIA_RPC_URL
```

Should look like:
```
https://eth-sepolia.g.alchemy.com/v2/abcd1234efgh5678...
```

**Get/verify your key:**
1. Go to: https://dashboard.alchemy.com
2. Click your app
3. Copy the API key
4. Make sure it's in your `.env` file

---

### Issue: "Verification failed"

**Don't worry!** Your contracts are still deployed.

Just skip verification:
```powershell
forge script script/DeployTestnet.s.sol --rpc-url $env:SEPOLIA_RPC_URL --broadcast -vvvv
```

(Remove `--verify` and `--etherscan-api-key` flags)

---

## What Gets Deployed

```
✅ PropertyToken (0x1234...)      ← YOU NEED THIS ONE
✅ Marketplace (0x5678...)
✅ Staking (0x9abc...)
✅ TimelockController (0xdef0...)
✅ Test Property #1 created
```

Only the **PropertyToken** address is required for the wallet tokenization feature.

---

## Complete PowerShell Script

Save this as `deploy-windows.ps1`:

```powershell
# Load environment variables from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

Write-Host "Environment variables loaded:"
Write-Host "PRIVATE_KEY: $($env:PRIVATE_KEY.Substring(0,10))..."
Write-Host "SEPOLIA_RPC_URL: $env:SEPOLIA_RPC_URL"
Write-Host ""
Write-Host "Deploying contracts to Sepolia..."
Write-Host ""

# Deploy
forge script script/DeployTestnet.s.sol `
    --rpc-url $env:SEPOLIA_RPC_URL `
    --broadcast `
    --verify `
    --etherscan-api-key $env:ETHERSCAN_API_KEY `
    -vvvv

Write-Host ""
Write-Host "========================================="
Write-Host "Deployment Complete!"
Write-Host "========================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Copy the PropertyToken address from the output above"
Write-Host "2. Open src/lib/contractConfig.ts"
Write-Host "3. Paste the address at line 53"
Write-Host "4. Run: npm run dev"
Write-Host "5. Test property tokenization!"
Write-Host ""
```

**Run it:**
```powershell
.\deploy-windows.ps1
```

---

## Summary

**For Windows PowerShell:**

1. Load .env variables:
   ```powershell
   Get-Content .env | ForEach-Object {
       if ($_ -match '^([^=]+)=(.*)$') {
           [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
       }
   }
   ```

2. Deploy:
   ```powershell
   forge script script/DeployTestnet.s.sol --rpc-url $env:SEPOLIA_RPC_URL --broadcast -vvvv
   ```

3. Copy PropertyToken address

4. Update `src/lib/contractConfig.ts` line 53

5. Test:
   ```powershell
   npm run dev
   ```

**Time:** ~5 minutes
**Cost:** FREE (Sepolia testnet)

Good luck! 🚀

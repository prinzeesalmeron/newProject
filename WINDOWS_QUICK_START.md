# 🚀 Windows Quick Start - Deploy in 2 Minutes

## For Windows PowerShell Users

### ⚡ Super Fast Method

```powershell
# 1. Run the deployment script
.\deploy-windows.ps1

# 2. Copy the PropertyToken address from output

# 3. Update src\lib\contractConfig.ts line 53

# 4. Start dev server
npm run dev
```

**Done!** 🎉

---

## Manual Method (If script doesn't work)

### Step 1: Load environment variables

```powershell
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
```

### Step 2: Deploy

```powershell
forge script script/DeployTestnet.s.sol --rpc-url $env:SEPOLIA_RPC_URL --broadcast -vvvv
```

### Step 3: Copy address & update config

Look for: `PropertyToken deployed at: 0x...`

Update `src\lib\contractConfig.ts` line 53

### Step 4: Test

```powershell
npm run dev
```

---

## Your .env File Should Look Like:

```env
PRIVATE_KEY=abc123def456789...
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xyz789...
ETHERSCAN_API_KEY=ABC123XYZ...
```

**No quotes needed!**

---

## Need Test ETH?

https://sepoliafaucet.com (free, instant)

---

## Troubleshooting

**"PRIVATE_KEY not found"**
→ Check your .env file has no spaces around `=`

**"Insufficient funds"**
→ Get test ETH from sepoliafaucet.com

**"Invalid RPC URL"**
→ Get free API key from dashboard.alchemy.com

---

## What You'll See

```
PropertyToken deployed at: 0x1234...       ← COPY THIS!
Marketplace deployed at: 0x5678...
Staking deployed at: 0x9abc...
TimelockController deployed at: 0xdef0...
```

Only need the **PropertyToken** address!

---

## Files Created for You

- `deploy-windows.ps1` - Automated deployment script
- `WINDOWS_DEPLOY.md` - Complete Windows guide
- `WINDOWS_QUICK_START.md` - This quick reference

---

**Time:** 2 minutes
**Cost:** FREE
**Ready:** NOW! 🚀

# Windows PowerShell Deployment Script for BlockEstate Contracts

Write-Host "======================================"
Write-Host "BlockEstate Contract Deployment (Windows)"
Write-Host "======================================"
Write-Host ""

# Check if .env exists
if (-Not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create a .env file with:"
    Write-Host "PRIVATE_KEY=your_private_key"
    Write-Host "SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
    Write-Host "ETHERSCAN_API_KEY=your_etherscan_key"
    exit 1
}

# Load environment variables from .env
Write-Host "Loading environment variables from .env..."
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

# Verify required variables
$missingVars = @()

if (-not $env:PRIVATE_KEY) {
    $missingVars += "PRIVATE_KEY"
}
if (-not $env:SEPOLIA_RPC_URL) {
    $missingVars += "SEPOLIA_RPC_URL"
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Error: Missing required environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Please add them to your .env file"
    exit 1
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green
Write-Host "   PRIVATE_KEY: $($env:PRIVATE_KEY.Substring(0,10))..." -ForegroundColor Gray
Write-Host "   SEPOLIA_RPC_URL: $env:SEPOLIA_RPC_URL" -ForegroundColor Gray
if ($env:ETHERSCAN_API_KEY) {
    Write-Host "   ETHERSCAN_API_KEY: $($env:ETHERSCAN_API_KEY.Substring(0,10))..." -ForegroundColor Gray
}
Write-Host ""

# Check if forge is installed
$forgeVersion = forge --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Foundry (forge) not found!" -ForegroundColor Red
    Write-Host "Install from: https://getfoundry.sh"
    exit 1
}
Write-Host "✅ Foundry found: $forgeVersion" -ForegroundColor Green
Write-Host ""

# Compile contracts
Write-Host "======================================"
Write-Host "Compiling Contracts..."
Write-Host "======================================"
forge build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilation successful!" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "======================================"
Write-Host "Deploying to Sepolia Testnet..."
Write-Host "======================================"
Write-Host ""

# Choose deployment with or without verification
if ($env:ETHERSCAN_API_KEY) {
    Write-Host "Deploying with Etherscan verification..." -ForegroundColor Cyan
    forge script script/DeployTestnet.s.sol `
        --rpc-url $env:SEPOLIA_RPC_URL `
        --broadcast `
        --verify `
        --etherscan-api-key $env:ETHERSCAN_API_KEY `
        -vvvv
} else {
    Write-Host "Deploying without Etherscan verification..." -ForegroundColor Yellow
    Write-Host "(Add ETHERSCAN_API_KEY to .env for auto-verification)" -ForegroundColor Yellow
    forge script script/DeployTestnet.s.sol `
        --rpc-url $env:SEPOLIA_RPC_URL `
        --broadcast `
        -vvvv
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Insufficient funds - Get test ETH from https://sepoliafaucet.com"
    Write-Host "2. Wrong RPC URL - Check your Alchemy API key"
    Write-Host "3. Invalid private key - Make sure it's correct in .env"
    exit 1
}

Write-Host ""
Write-Host "======================================"
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "======================================"
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Find the PropertyToken address in the output above"
Write-Host "   Look for: 'PropertyToken deployed at: 0x...'"
Write-Host ""
Write-Host "2. Open: src\lib\contractConfig.ts"
Write-Host ""
Write-Host "3. Update line 53 with your PropertyToken address:"
Write-Host "   PROPERTY_TOKEN: '0xYourAddressHere',"
Write-Host ""
Write-Host "4. Start the dev server:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "5. Test property tokenization at:"
Write-Host "   http://localhost:5173"
Write-Host ""
Write-Host "View your transactions on Etherscan:"
Write-Host "https://sepolia.etherscan.io"
Write-Host ""

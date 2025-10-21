#!/bin/bash

# BlockEstate Smart Contract Deployment Script
# This script helps deploy contracts to Ethereum networks

set -e  # Exit on error

echo "======================================"
echo "BlockEstate Contract Deployment"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with the required configuration."
    echo "See .env.example for reference."
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

# Check required environment variables
check_env_var() {
    if [ -z "${!1}" ] || [ "${!1}" == "your_"* ]; then
        echo "❌ Error: $1 is not set or uses placeholder value"
        echo "Please update your .env file with actual values."
        exit 1
    fi
}

echo "Checking environment variables..."
check_env_var "PRIVATE_KEY"
check_env_var "SEPOLIA_RPC_URL"
check_env_var "ETHERSCAN_API_KEY"

# Check if foundry is installed
if ! command -v forge &> /dev/null; then
    echo "❌ Error: Foundry is not installed!"
    echo ""
    echo "To install Foundry, run:"
    echo "curl -L https://foundry.paradigm.xyz | bash"
    echo "foundryup"
    exit 1
fi

echo "✅ Foundry found: $(forge --version | head -n 1)"
echo ""

# Network selection
echo "Select network for deployment:"
echo "1) Sepolia Testnet (recommended for testing)"
echo "2) Ethereum Mainnet (production - use with extreme caution)"
echo "3) Local Network (localhost:8545)"
echo ""
read -p "Enter choice (1-3): " network_choice

case $network_choice in
    1)
        NETWORK="sepolia"
        RPC_URL=$SEPOLIA_RPC_URL
        echo "✅ Deploying to Sepolia Testnet"
        ;;
    2)
        echo "⚠️  WARNING: You are about to deploy to MAINNET!"
        echo "This will cost real ETH and cannot be undone."
        read -p "Are you absolutely sure? (type 'YES' to continue): " confirm
        if [ "$confirm" != "YES" ]; then
            echo "Deployment cancelled."
            exit 0
        fi
        NETWORK="mainnet"
        RPC_URL=$MAINNET_RPC_URL
        ;;
    3)
        NETWORK="localhost"
        RPC_URL="http://localhost:8545"
        echo "✅ Deploying to Local Network"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Compiling Contracts..."
echo "======================================"
forge build

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"
echo ""

# Contract selection
echo "Select contract to deploy:"
echo "1) All Contracts"
echo "2) PropertyToken only"
echo "3) Marketplace only"
echo "4) Governance only"
echo "5) Staking only"
echo ""
read -p "Enter choice (1-5): " contract_choice

deploy_contract() {
    CONTRACT_NAME=$1
    SCRIPT_PATH=$2

    echo ""
    echo "======================================"
    echo "Deploying $CONTRACT_NAME..."
    echo "======================================"

    forge script $SCRIPT_PATH \
        --rpc-url $RPC_URL \
        --broadcast \
        --verify \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        -vvvv

    if [ $? -eq 0 ]; then
        echo "✅ $CONTRACT_NAME deployed successfully!"
    else
        echo "❌ $CONTRACT_NAME deployment failed!"
        exit 1
    fi
}

case $contract_choice in
    1)
        echo "Deploying all contracts..."
        deploy_contract "All Contracts (PropertyToken, Marketplace, Staking, Timelock)" "script/DeployTestnet.s.sol:DeployTestnet"
        ;;
    2)
        echo "Deploying PropertyToken only..."
        deploy_contract "All Contracts (PropertyToken, Marketplace, Staking, Timelock)" "script/DeployTestnet.s.sol:DeployTestnet"
        echo ""
        echo "⚠️  Note: DeployTestnet script deploys all contracts together."
        echo "    You can use the PropertyToken address and ignore the others."
        ;;
    3)
        echo "Deploying all contracts (Marketplace cannot be deployed alone)..."
        deploy_contract "All Contracts (PropertyToken, Marketplace, Staking, Timelock)" "script/DeployTestnet.s.sol:DeployTestnet"
        ;;
    4)
        echo "Deploying all contracts (Governance/Timelock cannot be deployed alone)..."
        deploy_contract "All Contracts (PropertyToken, Marketplace, Staking, Timelock)" "script/DeployTestnet.s.sol:DeployTestnet"
        ;;
    5)
        deploy_contract "Staking" "script/DeployStaking.s.sol:DeployStaking"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Check broadcast/ directory for deployment details"
echo "2. Update deployment-addresses.json with contract addresses"
echo "3. Update src/lib/contractConfig.ts with deployed addresses"
echo "4. Verify contracts on Etherscan if auto-verification failed"
echo "5. Export ABIs: forge inspect <ContractName> abi > src/lib/abis/<ContractName>.json"
echo ""
echo "View your contracts on Etherscan:"
if [ "$NETWORK" == "sepolia" ]; then
    echo "https://sepolia.etherscan.io/"
elif [ "$NETWORK" == "mainnet" ]; then
    echo "https://etherscan.io/"
fi
echo ""

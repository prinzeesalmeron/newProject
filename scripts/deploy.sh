#!/bin/bash

set -e

echo "========================================="
echo "BlockEstate Smart Contract Deployment"
echo "========================================="
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./scripts/deploy.sh [network]"
  echo "Available networks: sepolia,lisk-sepolia, mainnet, localhost"
  exit 1
fi

NETWORK=$1

if [ "$NETWORK" != "sepolia" ] && [ "$NETWORK" != "lisk-sepolia" ] && [ "$NETWORK" != "mainnet" ] && [ "$NETWORK" != "localhost" ]; then
  echo "Error: Invalid network. Choose 'scleepolia', 'mainnet', or 'localhost'"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Error: .env file not found. Copy .env.example to .env and configure it."
  exit 1
fi

source .env

if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: PRIVATE_KEY not set in .env file"
  exit 1
fi

echo "Network: $NETWORK"
echo ""

if [ "$NETWORK" == "mainnet" ]; then
  echo "⚠️  WARNING: You are about to deploy to MAINNET!"
  echo "This will cost real ETH (estimated 15-20M gas)"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
  fi
  RPC_URL=$MAINNET_RPC_URL
# elif [ "$NETWORK" == "sepolia" ]; then
#   RPC_URL=$SEPOLIA_RPC_URL
elif [ "$NETWORK" == "lisk-sepolia" ]; then
  RPC_URL=$LISK_SEPOLIA_RPC_URL

else
  RPC_URL="http://localhost:8545"
fi

if [ -z "$RPC_URL" ]; then
  echo "Error: RPC_URL not set for network $NETWORK"
  exit 1
fi

echo "1. Compiling contracts..."
forge build

echo ""
echo "2. Running tests..."
forge test -vvv

echo ""
echo "3. Deploying contracts to $NETWORK..."

if [ "$NETWORK" == "mainnet" ] || [ "$NETWORK" == "sepolia" ]; then
  forge script script/DeployTestnet.s.sol:DeployScript \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    -vvvv
else
  forge script script/DeployTestnet.s.sol:DeployScript \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vvvv
fi

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Check deployment-addresses.json for contract addresses"
echo "2. Update src/lib/contractConfig.ts with the new addresses"
echo "3. Verify contracts on Etherscan (if not auto-verified)"
echo "4. Test the deployment on the frontend"
echo ""

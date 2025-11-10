# Wallet Integration Guide

Your smart contracts have been successfully deployed to **Lisk Sepolia Testnet** and integrated with the application!

## Deployed Contracts

| Contract | Address |
|----------|---------|
| PropertyToken | `0x4817b4059BFa893be869BAcEd8aCC6e54d8bb8fB` |
| Marketplace | `0x66CD1116101F811d4eacE535d1F9EbfF1D5136C2` |
| Governance (Timelock) | `0x2BF28F5a09fc675F50A7d17E5A3eA1D94638eccD` |
| Staking | `0x3Db34c54D5dbb10Cdc4BA78e072ef054d9eB9950` |

**Network:** Lisk Sepolia Testnet (Chain ID: 4202)
**Explorer:** https://sepolia-blockscout.lisk.com
**RPC URL:** https://rpc.sepolia-api.lisk.com

## How It Works

### 1. Connect Your Wallet

The application now displays a **"Connect Wallet"** button in the navigation bar. Users can:

- Click "Connect Wallet" to choose from available wallet providers (MetaMask, Coinbase Wallet, etc.)
- The wallet will prompt users to connect their account
- Once connected, the user's address and balance are displayed

### 2. Network Detection & Switching

The application automatically:

- Detects which network the wallet is connected to
- Shows a **Network Switcher** component if the wrong network is selected
- Allows users to switch to Lisk Sepolia with one click
- The network switcher appears in the navbar when a wallet is connected

### 3. Smart Contract Integration

All blockchain operations now use the **connected wallet address**:

#### Property Tokenization
- When a property is tokenized, it uses the connected wallet as the owner
- Transactions are signed with the user's wallet
- Gas estimation is shown before confirmation

#### Token Purchases
- Users can buy property tokens directly from their wallet
- ETH is transferred from the user's wallet to the contract
- Tokens are minted to the user's address

#### Marketplace Operations
- List tokens for sale using the connected wallet
- Buy tokens from other users
- All transactions require wallet approval

#### Staking
- Stake tokens directly from the connected wallet
- Claim rewards to the wallet address
- Unstake tokens back to the wallet

## User Experience Flow

1. **User visits the site**
   - Sees "Connect Wallet" button in navbar

2. **User clicks "Connect Wallet"**
   - Dropdown shows available wallet options
   - User selects their preferred wallet (e.g., MetaMask)

3. **Wallet prompts for connection**
   - User approves the connection in their wallet
   - Application now has access to the wallet address

4. **Network check**
   - If on wrong network, "Network Switcher" appears
   - User clicks "Switch to Lisk Sepolia Testnet"
   - Wallet prompts to add/switch network

5. **User can now interact**
   - All blockchain operations use their wallet
   - Transactions require wallet approval
   - Transaction history visible in wallet

## Configuration

The application is configured to use Lisk Sepolia by default:

**Environment Variables** (`.env`):
```bash
VITE_CHAIN_ID=4202
VITE_LISK_SEPOLIA_RPC=https://rpc.sepolia-api.lisk.com
```

**Contract Addresses** (`src/lib/contractConfig.ts`):
- Automatically uses the correct addresses based on the connected network
- Supports multiple networks (Mainnet, Sepolia, Lisk Sepolia, Localhost)

## Testing

To test the integration:

1. Install MetaMask or another Web3 wallet
2. Add Lisk Sepolia network to your wallet:
   - Network Name: Lisk Sepolia Testnet
   - RPC URL: https://rpc.sepolia-api.lisk.com
   - Chain ID: 4202
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia-blockscout.lisk.com

3. Get testnet ETH for Lisk Sepolia:
   - Visit a Lisk Sepolia faucet
   - Request test ETH to your wallet address

4. Connect to the application:
   - Click "Connect Wallet"
   - Approve the connection
   - You should see your address and balance

5. Try blockchain operations:
   - Navigate to the Marketplace
   - Try tokenizing a property (requires wallet signature)
   - Buy tokens from an existing property
   - Check transactions on the block explorer

## Key Features

### Wallet State Management
- Persistent wallet connection (survives page refresh)
- Automatic reconnection on page load
- Real-time balance updates
- Account switching detection

### Security
- All transactions require explicit user approval
- Private keys never leave the user's wallet
- Read-only operations don't require signatures
- Contract addresses are validated before use

### User Feedback
- Loading states during transactions
- Success/error messages
- Transaction hash with explorer links
- Gas cost estimation before confirmation

## Troubleshooting

**Wallet not connecting?**
- Ensure you have a Web3 wallet installed
- Check if the wallet extension is enabled
- Try refreshing the page
- Clear browser cache if needed

**Wrong network error?**
- Click the "Switch to Lisk Sepolia Testnet" button
- Approve the network switch in your wallet
- If the network doesn't exist, the wallet will prompt to add it

**Transaction failing?**
- Ensure you have enough ETH for gas fees
- Check if you're on the correct network
- Verify contract addresses are correct
- Check transaction details in the explorer

**Balance not updating?**
- Wait a few seconds for blockchain confirmation
- Try disconnecting and reconnecting the wallet
- Refresh the page

## Architecture

### Wallet Connection Flow
```
User → WalletButton → useWalletConnector (Zustand store)
                            ↓
                    Web3Provider (ethers.js)
                            ↓
                    Connected to Lisk Sepolia RPC
```

### Contract Interaction Flow
```
User Action → Component → ContractManager
                               ↓
                    Get Signer from Wallet
                               ↓
                    Sign & Send Transaction
                               ↓
                    Wait for Confirmation
                               ↓
                    Update UI with Result
```

### State Management
- **Wallet State**: Zustand store (`useWalletConnector`)
- **Contract State**: ContractManager singleton
- **Network Config**: `contractConfig.ts` with environment-based selection

## Next Steps

1. **Add more wallet providers**: Implement WalletConnect for mobile wallets
2. **Enhanced error handling**: Show more detailed error messages
3. **Transaction history**: Display past transactions from the wallet
4. **Gas optimization**: Implement gas price selection
5. **Multi-signature support**: Add support for multi-sig wallets
6. **Hardware wallet support**: Integrate Ledger/Trezor

## Support

For issues or questions:
- Check the browser console for error messages
- Verify network configuration in the wallet
- Ensure contracts are deployed correctly
- Check the block explorer for transaction details

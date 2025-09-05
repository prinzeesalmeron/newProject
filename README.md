# BlockEstate - Real Estate Investment Platform

A modern real estate investment platform built with React, TypeScript, and Supabase that enables fractional property ownership through blockchain tokenization.

## Features

### 🏠 Property Marketplace
- Browse tokenized real estate properties
- View detailed property information and analytics
- Invest in fractional property ownership
- Track property performance and rental yields

### 💰 Staking & Rewards
- Stake BLOCK tokens to earn passive rewards
- Multiple staking pools with different APY rates
- Smart contract integration for transparent staking
- Automated reward distribution

### ⛓️ Blockchain Integration
- Full smart contract deployment on Sepolia testnet
- Tokenized property ownership with ERC-1155 tokens
- Automated rental payout distribution
- Decentralized marketplace with instant liquidity
- Multi-wallet support (MetaMask, Coinbase, Phantom)
- Real-time blockchain transaction tracking

### 📊 Investment Dashboard
- Track your real estate portfolio
- Monitor investment performance
- View rental income history
- Manage your property tokens

### 🔐 User Authentication
- Secure user registration and login
- Profile management with KYC verification
- Role-based access control
- Integration with Supabase Auth

### 🌐 Blockchain Integration
- Wallet connectivity (MetaMask, Phantom, etc.)
- Smart contract interactions
- Token transfers and staking
- Transaction history tracking

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account (optional - works with mock data)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blockestate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure Supabase (optional):
   - Create a new Supabase project
   - Copy your project URL and anon key to `.env`
   - Run the database migrations in the Supabase dashboard

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The application works without Supabase configuration using mock data for demonstration purposes.

## Database Schema

The application uses the following main tables:
- `users` - User profiles and authentication data
- `properties` - Real estate property listings
- `shares` - User property ownership records
- `transactions` - Financial transaction history
- `staking_pools` - Staking pool configurations
- `user_stakes` - User staking positions
- `notifications` - User notifications
- `kyc_verifications` - KYC/AML compliance data

## Authentication Flow

### Registration
1. User fills out registration form with email, password, and full name
2. System creates user in Supabase Auth (or mock data if not configured)
3. User profile is created in the `users` table
4. User can immediately sign in and use the platform

### Login
1. User enters email and password
2. System authenticates against Supabase Auth (or mock data)
3. User session is established
4. User profile data is loaded

## Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **State Management:** Zustand
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Blockchain:** Ethers.js, Web3 wallet integration, Foundry for smart contract development
- **Smart Contracts:** Solidity ^0.8.19, OpenZeppelin libraries
- **Testnet:** Sepolia Ethereum Testnet
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── blockchain/      # Blockchain-specific components
│       ├── WalletConnector.tsx
│       ├── TokenizedMarketplace.tsx
│       └── RentalPayoutSystem.tsx
├── pages/              # Main application pages
│   ├── Marketplace.tsx  # Property marketplace
│   ├── Staking.tsx     # Token staking interface
│   ├── Learn.tsx       # Educational content
│   ├── Portfolio.tsx   # Portfolio analytics
│   ├── Governance.tsx  # DAO governance
│   ├── Blockchain.tsx  # Blockchain integration hub
│   └── InvestmentDashboard.tsx # Investment dashboard
├── lib/                # Utilities and services
│   ├── auth.ts         # Authentication logic
│   ├── supabase.ts     # Database configuration
│   ├── blockchain/     # Blockchain integration layer
│   │   ├── walletConnector.ts    # Multi-wallet connection
│   │   └── contractManager.ts    # Smart contract management
│   ├── contracts.ts    # Legacy contract service (updated)
│   └── api.ts          # API service layer
├── types/              # TypeScript type definitions
├── styles/             # Global styles and themes
└── contracts/          # Solidity smart contracts
    ├── BlockToken.sol       # ERC-20 governance token
    ├── PropertyToken.sol    # ERC-1155 property tokens
    ├── Staking.sol         # Staking rewards contract
    ├── Marketplace.sol     # Decentralized trading
    └── Governance.sol      # DAO governance
```

## Key Features Implementation

### Blockchain & Tokenization
- **Smart Contracts:** Deployed on Sepolia testnet with full audit trail
- **Property Tokenization:** ERC-1155 tokens representing fractional ownership
- **Automated Rental Payouts:** Smart contract distributes rental income proportionally
- **Decentralized Trading:** Peer-to-peer marketplace with instant liquidity pools
- **Multi-Wallet Support:** MetaMask, Coinbase Wallet, Phantom, WalletConnect
- **Real-time Updates:** Event-driven UI updates from blockchain events

### User Registration & Authentication
- Secure password-based authentication
- Automatic user profile creation
- Session management with persistent login
- Role-based access control (investor, admin, property_manager)

### Property Investment
- Browse available tokenized properties
- View detailed property analytics
- Purchase property tokens
- Track investment performance

### Staking System
- Multiple staking pools with different rewards
- Flexible and locked staking options
- Automated reward calculations
- Smart contract integration

### Portfolio Management
- Real-time portfolio valuation
- Investment performance tracking
- Rental income monitoring
- Transaction history
- Asset allocation visualization
- Performance analytics

- **BLOCK Token:** `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`
- **Property Token:** `0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e`
- **Marketplace:** `0x8464135c8F25Da09e49BC8782676a84730C318bC`
- **Staking:** `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6`
- **Governance:** `0x610178dA211FEF7D417bC0e6FeD39F05609AD788`
- **Timelock:** `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e`
### Governance System
### Smart Contract Features
- Decentralized governance voting
#### Property Tokenization
- ERC-1155 multi-token standard for fractional ownership
- Automated token minting for new properties
- Metadata URI support for property details
- Transfer restrictions and approval mechanisms
- Proposal creation and management
#### Marketplace Trading
- Peer-to-peer token listings and sales
- Instant buy/sell through liquidity pools
- Automated fee collection (2.5% platform fee)
- Escrow system for secure transactions
- Token-based voting power
#### Rental Income Distribution
- Automated monthly rental payouts
- Proportional distribution based on token ownership
- Claimable rewards system
- Gas-efficient batch processing

The project uses Foundry for smart contract development:
- Governance analytics
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
#### Staking & Governance
# Compile contracts
forge build
- Multiple staking pools with different APY rates
# Run tests
forge test
- Lock periods for higher rewards
# Deploy to testnet
forge script script/DeployTestnet.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
- Governance token voting power
# Verify contracts
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_PATH> --chain sepolia
```
- Proposal creation and execution through timelock
### Environment Variables for Blockchain

```env
# Blockchain Configuration
PRIVATE_KEY=your_private_key_for_deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
ETHERSCAN_API_KEY=your_etherscan_api_key
## Development
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Adding New Features
1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `src/App.tsx`
4. Add database migrations in `supabase/migrations/`

### Database Migrations
Database schema changes are managed through Supabase migrations:
1. Create new migration file in `supabase/migrations/`
2. Write SQL for schema changes
3. Apply migration in Supabase dashboard

### Testing
The application includes comprehensive error handling and works in both:
- **Production mode:** With full Supabase integration
- **Demo mode:** With mock data when Supabase is not configured

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred hosting platform
3. Set up Supabase project and configure environment variables
4. Run database migrations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
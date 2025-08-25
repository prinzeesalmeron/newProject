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
- **Blockchain:** Ethers.js, Web3 wallet integration
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── lib/                # Utilities and services
│   ├── auth.ts         # Authentication logic
│   ├── supabase.ts     # Database configuration
│   ├── wallet.ts       # Blockchain wallet integration
│   ├── contracts.ts    # Smart contract interactions
│   └── api.ts          # API service layer
├── types/              # TypeScript type definitions
└── styles/             # Global styles and themes
```

## Key Features Implementation

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

## Development

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
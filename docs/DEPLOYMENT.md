# BlockEstate Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account
- Stripe account
- Domain name and SSL certificate

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd blockestate
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure all required variables:

```bash
cp .env.example .env
```

**Required Environment Variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## Database Setup

### 1. Supabase Project Setup
1. Create new Supabase project
2. Copy project URL and keys to `.env`
3. Run database migrations:

```bash
# In Supabase Dashboard SQL Editor, run each migration file in order:
# - supabase/migrations/20250818072226_jolly_frog.sql
# - supabase/migrations/20250818072329_square_shadow.sql
# - supabase/migrations/20250818072345_tiny_spring.sql
# - supabase/migrations/20250818072447_icy_snow.sql
# - supabase/migrations/20250821052023_amber_fountain.sql
# - supabase/migrations/20250821060428_autumn_queen.sql
# - supabase/migrations/20250825060243_velvet_voice.sql
# - supabase/migrations/20250826055104_nameless_temple.sql
# - supabase/migrations/20250826055253_weathered_haze.sql
# - supabase/migrations/20250826055508_dark_sky.sql
# - supabase/migrations/20250901054633_flat_lodge.sql
# - supabase/migrations/20250920105439_little_scene.sql
# - supabase/migrations/20250922053122_warm_torch.sql
# - supabase/migrations/add_performance_indexes.sql
# - supabase/migrations/add_property_verification_system.sql
```

### 2. Edge Functions Deployment
Deploy Supabase Edge Functions:

```bash
# Deploy API function
supabase functions deploy api --project-ref <your-project-ref>

# Deploy webhook functions
supabase functions deploy stripe-webhook --project-ref <your-project-ref>
supabase functions deploy kyc-webhook --project-ref <your-project-ref>
supabase functions deploy payment-webhook --project-ref <your-project-ref>
supabase functions deploy process-refund --project-ref <your-project-ref>
supabase functions deploy create-payment-intent --project-ref <your-project-ref>
supabase functions deploy update-currency-rates --project-ref <your-project-ref>
```

## Smart Contract Deployment

### 1. Testnet Deployment (Sepolia)
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile contracts
forge build

# Deploy to Sepolia testnet
forge script script/DeployTestnet.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 2. Mainnet Deployment
```bash
# Deploy to Ethereum mainnet (EXPENSIVE - 15-20M gas)
forge script contracts/MainnetDeploy.sol \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Verify contracts on Etherscan
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_PATH> \
  --chain mainnet \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Payment Setup

### 1. Stripe Configuration
1. Create Stripe account
2. Get API keys from Stripe Dashboard
3. Configure webhook endpoints:
   - `https://your-domain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`

### 2. Payment Method Setup
1. Enable payment methods in Stripe Dashboard
2. Configure 3D Secure for EU compliance
3. Set up ACH/bank transfers if needed

## Security Configuration

### 1. KYC/AML Setup
1. **Jumio Account:**
   - Sign up at jumio.com
   - Get API credentials
   - Configure webhook: `https://your-domain.com/api/webhooks/kyc`

2. **Onfido Account:**
   - Sign up at onfido.com
   - Get API credentials
   - Configure identity verification workflow

3. **Chainalysis Account:**
   - Sign up for AML screening
   - Get API credentials for sanctions/PEP screening

### 2. Security Headers
Configure these headers in your hosting provider:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Monitoring Setup

### 1. Error Tracking (Sentry)
1. Create Sentry account
2. Create new project
3. Add DSN to environment variables
4. Configure error boundaries

### 2. Performance Monitoring (Datadog)
1. Create Datadog account
2. Get API key
3. Configure RUM (Real User Monitoring)
4. Set up custom dashboards

### 3. Analytics (Mixpanel)
1. Create Mixpanel account
2. Get project token
3. Configure event tracking

## Production Deployment

### 1. Netlify Deployment
```bash
# Build for production
pnpm build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### 2. Custom Server Deployment
```bash
# Build application
pnpm build

# Serve with nginx/Apache
# Configure reverse proxy for API endpoints
# Set up SSL certificates
# Configure CDN for static assets
```

### 3. Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "preview"]
```

## Post-Deployment Checklist

### 1. Functionality Testing
- [ ] User registration and login
- [ ] Property browsing and investment
- [ ] Payment processing
- [ ] KYC verification
- [ ] Wallet connection
- [ ] Smart contract interactions

### 2. Security Testing
- [ ] Rate limiting works
- [ ] CSRF protection active
- [ ] Input validation
- [ ] Authentication flows
- [ ] Authorization checks

### 3. Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Database query optimization
- [ ] CDN configuration
- [ ] Image optimization

### 4. Monitoring Setup
- [ ] Error tracking active
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Alert configuration

## Maintenance

### 1. Database Backups
- Automated daily backups via Supabase
- Weekly full database exports
- Test restore procedures monthly

### 2. Security Updates
- Monthly dependency updates
- Quarterly security audits
- Annual penetration testing

### 3. Performance Optimization
- Monthly performance reviews
- Database query optimization
- CDN cache optimization
- Image compression updates

## Troubleshooting

### Common Issues

**1. Supabase Connection Errors**
- Check environment variables
- Verify project URL and keys
- Check network connectivity

**2. Stripe Payment Failures**
- Verify webhook endpoints
- Check API key configuration
- Review Stripe Dashboard logs

**3. Smart Contract Issues**
- Verify contract addresses
- Check network configuration
- Ensure sufficient gas limits

**4. Performance Issues**
- Check database indexes
- Review API response times
- Optimize image loading
- Enable caching

### Support Contacts

- **Technical Support:** tech@blockestate.com
- **Security Issues:** security@blockestate.com
- **Emergency:** +1-555-EMERGENCY
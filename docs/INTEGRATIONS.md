# Third-Party Integrations Guide

This document provides comprehensive information about all third-party integrations in the BlockEstate platform.

## Overview

BlockEstate integrates with multiple external services to provide a complete real estate tokenization platform:

- **KYC/AML**: Identity verification and compliance
- **Payment Processing**: Fiat and crypto payment handling
- **Email**: Transactional and marketing communications
- **Property Data**: Real estate market data and valuations
- **Market Data**: Crypto and real estate market feeds
- **Monitoring**: Integration health and performance tracking

---

## 1. KYC/AML Integration (Persona)

### Purpose
Identity verification, document validation, and AML screening for regulatory compliance.

### Setup

1. **Create Persona Account**
   - Sign up at [withpersona.com](https://withpersona.com)
   - Create an inquiry template for real estate investors
   - Get your API key from the dashboard

2. **Configuration**
   ```env
   VITE_PERSONA_API_KEY=persona_live_xxxxxxxxxxxx
   VITE_PERSONA_TEMPLATE_ID=itmpl_xxxxxxxxxxxx
   VITE_PERSONA_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Webhook Setup**
   - URL: `https://yourdomain.com/api/webhooks/persona`
   - Events: `inquiry.completed`, `inquiry.failed`

### Usage

```typescript
import { PersonaKYCService } from '@/lib/integrations';

// Start KYC verification
const { inquiryId, sessionToken } = await PersonaKYCService.createInquiry(
  userId,
  {
    templateId: 'itmpl_xxxxxxxxxxxx',
    referenceId: userId,
    fields: {
      nameFirst: 'John',
      nameLast: 'Doe',
      emailAddress: 'john@example.com'
    }
  }
);

// Check verification status
const result = await PersonaKYCService.getInquiryStatus(inquiryId);
```

### Pricing
- $2-5 per verification depending on verification level
- Volume discounts available

---

## 2. Payment Processing (Stripe)

### Purpose
Credit card, ACH, and bank payment processing for property investments.

### Setup

1. **Create Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Complete business verification
   - Enable payment methods: Cards, ACH, Bank Transfers

2. **Configuration**
   ```env
   VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

3. **Webhook Setup**
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events:
     - `payment_intent.succeeded`
     - `payment_intent.failed`
     - `charge.refunded`
     - `customer.subscription.updated`

### Usage

```typescript
import { StripePaymentService } from '@/lib/integrations';

// Create payment intent
const intent = await StripePaymentService.createPaymentIntent(
  5000, // $50.00
  'usd',
  {
    property_id: 'prop_123',
    user_id: userId
  }
);

// Confirm payment
const result = await StripePaymentService.confirmCardPayment(
  intent.client_secret,
  paymentMethodId
);
```

### Pricing
- **Card payments**: 2.9% + $0.30 per transaction
- **ACH payments**: 0.8% capped at $5
- **International cards**: +1.5%

---

## 3. Email Service (Resend)

### Purpose
Transactional emails, notifications, and user communications.

### Setup

1. **Create Resend Account**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain
   - Generate API key

2. **Configuration**
   ```env
   VITE_RESEND_API_KEY=re_xxxxxxxxxxxx
   VITE_FROM_EMAIL=BlockEstate <noreply@yourdomain.com>
   ```

3. **Domain Verification**
   - Add DNS records to your domain
   - Verify SPF, DKIM, and DMARC
   - Enable DMARC reporting

### Usage

```typescript
import { ResendEmailService } from '@/lib/integrations';

// Send welcome email
await ResendEmailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  verificationUrl
);

// Send investment confirmation
await ResendEmailService.sendInvestmentConfirmation(
  'user@example.com',
  'John Doe',
  'Sunset Tower Apartments',
  5000,
  50,
  receiptUrl
);
```

### Available Templates
- Welcome email
- Investment confirmation
- KYC reminder
- Dividend notification
- Security alert
- Password reset
- Transaction receipt

### Pricing
- **Free tier**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails
- Additional: $1 per 1,000 emails

---

## 4. Property Data APIs

### Purpose
Real-time property valuations, market data, and rental income estimates.

### Providers

#### Zillow API
```env
VITE_ZILLOW_API_KEY=your_zillow_api_key
```
- Zestimate valuations
- Property details
- Price history
- **Pricing**: Contact Zillow for enterprise API access

#### Redfin API
```env
VITE_REDFIN_API_KEY=your_redfin_api_key
```
- Property estimates
- Tax assessments
- HOA fees
- **Pricing**: Partner API, contact Redfin

#### Realtor.com API
```env
VITE_REALTOR_API_KEY=your_realtor_api_key
```
- Property descriptions
- Market listings
- Comparable sales
- **Pricing**: Via RapidAPI, ~$0.01 per request

#### Rentometer API
```env
VITE_RENTOMETER_API_KEY=your_rentometer_api_key
```
- Rental market analysis
- Median rent estimates
- Vacancy rates
- **Pricing**: $50/month for 1,000 requests

### Usage

```typescript
import { PropertyDataService } from '@/lib/integrations';

// Get comprehensive property data
const propertyData = await PropertyDataService.getPropertyData(
  '123 Main St, San Francisco, CA 94102'
);

// Get rental market analysis
const rentalData = await PropertyDataService.getRentalMarketData(
  '123 Main St, San Francisco, CA 94102',
  3, // bedrooms
  2, // bathrooms
  1800 // square feet
);
```

---

## 5. Market Data Feeds

### Purpose
Real-time cryptocurrency prices, economic indicators, and market trends.

### Providers

#### CoinGecko API
```env
VITE_COINGECKO_API_KEY=your_coingecko_api_key
```
- Crypto prices (ETH, BTC, USDC, USDT)
- Market cap and volume
- Price changes
- **Pricing**: Free tier 10-50 calls/min, Pro $129/month

#### FRED Economic Data
```env
VITE_FRED_API_KEY=your_fred_api_key
```
- Median home prices
- Mortgage rates
- Economic indicators
- **Pricing**: Free with attribution

### Usage

```typescript
import { MarketDataService } from '@/lib/integrations';

// Get crypto market data
const cryptoData = await MarketDataService.getCryptoMarketData();
console.log(`ETH Price: $${cryptoData.eth_usd}`);

// Get real estate market data
const reData = await MarketDataService.getRealEstateMarketData('US');
console.log(`Median Price: $${reData.national_median_price}`);

// Get platform metrics
const platformData = await MarketDataService.getTokenizedREMarketData();
console.log(`Total Market Cap: $${platformData.total_market_cap}`);
```

---

## 6. Integration Monitoring

### Purpose
Health checks, performance monitoring, and error tracking for all integrations.

### Features
- Real-time health status
- Response time tracking
- Error rate monitoring
- Rate limit management
- Automated alerts

### Usage

```typescript
import { IntegrationMonitorService } from '@/lib/integrations';

// Start monitoring
IntegrationMonitorService.startMonitoring();

// Get health status
const health = await IntegrationMonitorService.checkAllIntegrations();

// Get metrics
const metrics = await IntegrationMonitorService.getIntegrationMetrics('stripe');

// Get dashboard data
const dashboard = await IntegrationMonitorService.getDashboardData();
```

### Monitoring Dashboard

Access integration health at: `/admin/integrations`

Metrics include:
- ✅ Status (healthy, degraded, down)
- ⏱️ Response time
- 📊 Error rate
- 📈 Request volume
- 🔄 Uptime percentage

---

## Cost Summary

### Development (Testing)
- **Total**: ~$0/month (free tiers)

### Production (Estimated)
- **KYC (Persona)**: $500/month (250 verifications)
- **Payments (Stripe)**: 2.9% + $0.30 per transaction
- **Email (Resend)**: $20/month (50K emails)
- **Property Data**: $200/month (APIs + caching)
- **Market Data**: $150/month (CoinGecko Pro)
- **Monitoring**: Included

**Estimated Monthly Cost**: ~$870 + payment processing fees

---

## Environment Setup Checklist

### Required for Launch
- [x] Persona KYC account and API key
- [x] Stripe account (verified business)
- [x] Resend account with verified domain
- [x] Database tables created (run migrations)

### Recommended
- [ ] CoinGecko Pro account
- [ ] Property data API subscriptions
- [ ] Monitoring dashboard access
- [ ] Webhook endpoints secured

### Optional (Can add later)
- [ ] Additional KYC providers (Jumio, Onfido)
- [ ] Payment alternatives (Coinbase Commerce)
- [ ] SMS notifications (Twilio)
- [ ] Analytics (Mixpanel, Amplitude)

---

## Troubleshooting

### Common Issues

**KYC verification fails**
- Check Persona API key is valid
- Verify webhook signature
- Ensure user provided valid documents

**Payment processing errors**
- Verify Stripe webhook is configured
- Check payment method is valid
- Ensure sufficient funds

**Email delivery issues**
- Confirm domain is verified
- Check SPF/DKIM records
- Review bounce/spam reports

**Property data unavailable**
- Check API rate limits
- Verify API keys are active
- Use cached data as fallback

### Support Contacts

- **Persona**: support@withpersona.com
- **Stripe**: https://support.stripe.com
- **Resend**: support@resend.com
- **Platform**: support@yourdomain.com

---

## Security Best Practices

1. **API Keys**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly
   - Use different keys for dev/prod

2. **Webhooks**
   - Always verify signatures
   - Use HTTPS only
   - Implement replay protection
   - Log all webhook events

3. **Data Handling**
   - Encrypt sensitive data
   - Follow PCI-DSS for payments
   - Comply with GDPR/CCPA
   - Regular security audits

4. **Monitoring**
   - Set up error alerts
   - Monitor API usage
   - Track rate limits
   - Review logs regularly

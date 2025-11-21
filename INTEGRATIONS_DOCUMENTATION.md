# Third-Party Integrations - Complete Documentation

## Overview
BlockEstate integrates with best-in-class third-party services for email communications, property data aggregation, payments, KYC verification, and market data. All integrations include proper error handling, caching, and fallback mechanisms.

---

## 1. Email Service (Resend) ✅

### Location
`src/lib/integrations/resendEmail.ts`

### Features
- **Production-ready email infrastructure** with Resend API
- **8 professional email templates** built-in
- **Transactional emails** for all user actions
- **Security alerts and notifications**
- **Webhook handling** for delivery tracking
- **Batch email sending** for newsletters
- **Email logging and analytics** in Supabase
- **Mock mode** for development without API key

### Email Templates

#### 1. Welcome Email
**Trigger**: New user registration
```typescript
ResendEmailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'https://app.com/verify?token=...'
);
```

#### 2. Investment Confirmation
**Trigger**: Successful property investment
```typescript
ResendEmailService.sendInvestmentConfirmation(
  'user@example.com',
  'John Doe',
  'Sunset Villa Apartments',
  10000,
  100,
  'https://app.com/receipt/123'
);
```

#### 3. KYC Reminder
**Trigger**: User hasn't completed KYC within 7 days
```typescript
ResendEmailService.sendKYCReminder(
  'user@example.com',
  'John Doe',
  'https://app.com/kyc/verify'
);
```

#### 4. Dividend Notification
**Trigger**: Monthly dividend payment
```typescript
ResendEmailService.sendDividendNotification(
  'user@example.com',
  'John Doe',
  'Sunset Villa Apartments',
  250.00,
  '2024-01-15'
);
```

#### 5. Security Alert
**Trigger**: Suspicious account activity
```typescript
ResendEmailService.sendSecurityAlert(
  'user@example.com',
  'John Doe',
  'Unusual Login Detected',
  'A login from New York, USA was detected',
  'https://app.com/security/review'
);
```

#### 6. Password Reset
**Trigger**: User requests password reset
```typescript
ResendEmailService.sendPasswordReset(
  'user@example.com',
  'https://app.com/reset?token=...'
);
```

#### 7. Transaction Receipt
**Trigger**: Any transaction completion
```typescript
ResendEmailService.sendTransactionReceipt(
  'user@example.com',
  'John Doe',
  'TX123456',
  1000.00,
  'Property token purchase',
  '2024-01-15'
);
```

#### 8. Newsletter (Batch)
**Trigger**: Scheduled or manual newsletter
```typescript
const recipients = [
  { email: 'user1@example.com', variables: { name: 'John' } },
  { email: 'user2@example.com', variables: { name: 'Jane' } }
];

const result = await ResendEmailService.sendBatchEmails(
  recipients,
  'Monthly Market Update',
  'newsletter',
  { month: 'January', year: '2024' }
);

console.log(`Sent: ${result.sent}, Failed: ${result.failed}`);
```

### Webhook Events

The service tracks email delivery status through webhooks:

| Event | Description | Action |
|-------|-------------|--------|
| `email.sent` | Email sent from server | Update status to 'sent' |
| `email.delivered` | Email delivered to inbox | Update status to 'delivered' |
| `email.bounced` | Email bounced | Update status to 'bounced', log reason |
| `email.opened` | Recipient opened email | Track open timestamp |
| `email.clicked` | Recipient clicked link | Track click timestamp and link |

**Webhook Handler**:
```typescript
// In your API endpoint
const payload = await request.json();
await ResendEmailService.handleWebhook(payload);
```

### Email Logging

All emails are logged to the `email_logs` table in Supabase:

```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id text,
  recipient text NOT NULL,
  subject text NOT NULL,
  template text,
  status text NOT NULL,
  error text,
  opened_at timestamptz,
  clicked_at timestamptz,
  clicked_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);
```

### Analytics

Track email performance:
- **Delivery rate**: Delivered / Sent
- **Open rate**: Opened / Delivered
- **Click rate**: Clicked / Opened
- **Bounce rate**: Bounced / Sent

Query example:
```sql
SELECT
  template,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
  ROUND(100.0 * COUNT(*) FILTER (WHERE opened_at IS NOT NULL) /
    NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0), 2) as open_rate
FROM email_logs
GROUP BY template;
```

### Configuration

**Environment Variables**:
```env
VITE_RESEND_API_KEY=re_123...
VITE_FROM_EMAIL="BlockEstate <noreply@blockestate.com>"
```

**Setup Webhook** (in Resend Dashboard):
1. Go to Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/email`
3. Select events: sent, delivered, bounced, opened, clicked
4. Save and test

---

## 2. Property Data APIs ✅

### Location
`src/lib/integrations/propertyDataAPI.ts`

### Features
- **Multi-source data aggregation** from Zillow, Redfin, and Realtor.com
- **Rental market analysis** with Rentometer
- **Smart caching** (7-day expiration)
- **Comprehensive property details**: valuations, tax assessments, features, schools
- **Fallback mechanisms** for API failures
- **Mock data** for development

### Integrated APIs

#### 1. Zillow (Zestimate)
**Provides**:
- Property valuation (Zestimate)
- Property details (beds, baths, sqft, year built)
- Price history
- Property images
- Geocoding (lat/long)

**Usage**:
```typescript
const zillowData = await PropertyDataService.getZillowData(address);
console.log(`Zestimate: $${zillowData.zestimate}`);
```

#### 2. Redfin
**Provides**:
- Property valuation (Redfin Estimate)
- Tax assessment
- Property taxes
- HOA fees
- Property features
- School ratings

**Usage**:
```typescript
const redfinData = await PropertyDataService.getRedfinData(address);
console.log(`Property taxes: $${redfinData.propertyTaxes}/year`);
```

#### 3. Realtor.com
**Provides**:
- Property valuation (Realtor Estimate)
- Property description
- Lot size
- Property type classification

**Usage**:
```typescript
const realtorData = await PropertyDataService.getRealtorData(address);
console.log(`Description: ${realtorData.description}`);
```

#### 4. Rentometer (Rental Analysis)
**Provides**:
- Median rent estimates
- Rent range (25th-75th percentile)
- Vacancy rates
- Rental yield calculations
- Comparable rentals

**Usage**:
```typescript
const rentalData = await PropertyDataService.getRentalMarketData(
  '123 Main St, San Francisco, CA',
  3, // bedrooms
  2, // bathrooms
  1800 // square feet
);

console.log(`Median rent: $${rentalData.medianRent}/month`);
console.log(`Rental yield: ${rentalData.rentalYield}%`);
```

### Comprehensive Property Data

**Get all property data**:
```typescript
const propertyData = await PropertyDataService.getPropertyData(
  '123 Main St, San Francisco, CA 94102'
);

console.log({
  address: propertyData.address,
  city: propertyData.city,
  state: propertyData.state,

  // Valuations from 3 sources
  zestimate: propertyData.zestimate,
  redfinEstimate: propertyData.redfin_estimate,
  realtorEstimate: propertyData.realtor_estimate,
  averageEstimate: propertyData.averageEstimate,

  // Property details
  bedrooms: propertyData.bedrooms,
  bathrooms: propertyData.bathrooms,
  squareFeet: propertyData.squareFeet,
  yearBuilt: propertyData.yearBuilt,

  // Financial data
  taxAssessment: propertyData.taxAssessment,
  propertyTaxes: propertyData.propertyTaxes,
  hoaFees: propertyData.hoaFees,

  // Additional info
  features: propertyData.features,
  schoolRatings: propertyData.schoolRatings,
  images: propertyData.images
});
```

### Data Merging Strategy

The service aggregates data from multiple sources using this priority:

1. **Valuation**: Average of all available estimates
2. **Property Details**: Zillow (most comprehensive)
3. **Tax Data**: Redfin (most accurate)
4. **Features**: Redfin (detailed list)
5. **Description**: Realtor.com (most detailed)

**Example merged data**:
```javascript
{
  zestimate: 450000,           // Zillow
  redfin_estimate: 455000,     // Redfin
  realtor_estimate: 448000,    // Realtor.com
  averageEstimate: 451000,     // Calculated average

  bedrooms: 3,                 // Zillow
  bathrooms: 2,                // Zillow
  taxAssessment: 420000,       // Redfin
  features: ['...'],           // Redfin
  description: '...'           // Realtor.com
}
```

### Caching System

**Cache Strategy**:
- Data cached in `property_data_cache` table
- Cache expires after 7 days
- Automatic cache refresh on API call
- Fallback to cache if APIs fail

**Cache Table**:
```sql
CREATE TABLE property_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_property_data_cache_address
  ON property_data_cache(address);
```

**Cache Workflow**:
1. Check cache for address (lowercase)
2. If cached and < 7 days old, return cached data
3. If no cache or expired, fetch from APIs
4. Merge data from all sources
5. Update cache with new data
6. Return merged data

### Error Handling & Fallbacks

**Multiple Fallback Levels**:

1. **API Level**: If one API fails, continue with others
   ```typescript
   const [zillow, redfin, realtor] = await Promise.allSettled([
     this.getZillowData(address),
     this.getRedfinData(address),
     this.getRealtorData(address)
   ]);
   // Use whatever succeeded
   ```

2. **Cache Fallback**: If all APIs fail, use cached data
   ```typescript
   const cached = await this.getCachedPropertyData(address);
   if (cached) return cached;
   ```

3. **Mock Data**: If no cache and APIs unavailable, use mock data for development
   ```typescript
   if (!API_KEY) return this.mockZillowData(address);
   ```

### Configuration

**Environment Variables**:
```env
VITE_ZILLOW_API_KEY=your_zillow_key
VITE_REDFIN_API_KEY=your_redfin_key
VITE_REALTOR_API_KEY=your_realtor_key
VITE_RENTOMETER_API_KEY=your_rentometer_key
```

**API Providers**:
- **Zillow**: Bridge Interactive (BridgeDataOutput) - https://bridgedataoutput.com
- **Redfin**: Redfin Partner API (contact Redfin)
- **Realtor.com**: RapidAPI - https://rapidapi.com/apidojo/api/realtor-com4
- **Rentometer**: Direct API - https://www.rentometer.com/api

### Cost Optimization

**Reduce API costs**:
1. **Cache aggressively**: 7-day cache prevents duplicate calls
2. **Batch requests**: Fetch property data once, cache for multiple users
3. **Use mock mode** in development
4. **Prioritize free tiers**: Start with Zillow (limited free tier)

**Expected API Costs** (monthly):
- Zillow/Bridge: ~$100-500 (varies by volume)
- Redfin: Partner program (negotiate)
- Realtor.com (RapidAPI): $50-200
- Rentometer: $29-99

**Free Alternatives** for MVP:
- Use mock data until revenue is generated
- Implement just Zillow initially
- Cache aggressively to reduce calls

---

## 3. Payment Integration (Stripe) ✅

### Location
`src/lib/integrations/stripePayments.ts`

### Features
- Card payments with 3D Secure
- ACH/Bank transfers
- Payment refunds
- Stripe Connect for property owners
- Webhook handling
- Payment intent management

**Documented in**: `FIAT_PAYMENT_GATEWAY_GUIDE.md`

---

## 4. KYC/AML Verification (Persona) ✅

### Location
`src/lib/integrations/personaKYC.ts`

### Features
- Identity verification
- Document verification (ID, passport, driver's license)
- Liveness detection
- Address verification
- Webhook integration for status updates
- Compliance reporting

**Configuration**:
```env
VITE_PERSONA_API_KEY=your_persona_key
VITE_PERSONA_TEMPLATE_ID=itmpl_...
```

---

## 5. Market Data Service ✅

### Location
`src/lib/integrations/marketDataService.ts`

### Features
- Cryptocurrency price feeds (CoinGecko)
- Real estate market indicators
- Interest rate tracking
- Market trend analysis
- Price history and charts

---

## Integration Summary

| Integration | Status | API Key Required | Mock Mode | Caching | Webhooks |
|------------|--------|------------------|-----------|---------|----------|
| **Resend Email** | ✅ Complete | Yes | Yes | Logs only | Yes |
| **Zillow** | ✅ Complete | Yes | Yes | 7 days | No |
| **Redfin** | ✅ Complete | Yes | Yes | 7 days | No |
| **Realtor.com** | ✅ Complete | Yes | Yes | 7 days | No |
| **Rentometer** | ✅ Complete | Yes | Yes | No | No |
| **Stripe** | ✅ Complete | Yes | Yes | No | Yes |
| **Persona KYC** | ✅ Complete | Yes | Yes | No | Yes |
| **Market Data** | ✅ Complete | Optional | Yes | 5 min | No |

---

## Environment Configuration

### Required for Production

```env
# Email Service
VITE_RESEND_API_KEY=re_...
VITE_FROM_EMAIL="BlockEstate <noreply@blockestate.com>"

# Property Data
VITE_ZILLOW_API_KEY=your_zillow_key
VITE_REDFIN_API_KEY=your_redfin_key
VITE_REALTOR_API_KEY=your_realtor_key
VITE_RENTOMETER_API_KEY=your_rentometer_key

# Payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# KYC/AML
VITE_PERSONA_API_KEY=your_persona_key
VITE_PERSONA_TEMPLATE_ID=itmpl_...

# Analytics
VITE_MIXPANEL_TOKEN=your_mixpanel_token

# Error Tracking
VITE_SENTRY_DSN=https://...@sentry.io/...
```

### Optional for MVP

```env
# Market Data (has free tier)
VITE_COINGECKO_API_KEY=optional_for_higher_limits
```

---

## Testing

### Email Service Testing

```typescript
// Test welcome email
await ResendEmailService.sendWelcomeEmail(
  'test@example.com',
  'Test User',
  'https://app.com/verify'
);

// Test batch emails
const result = await ResendEmailService.sendBatchEmails(
  [
    { email: 'user1@test.com', variables: { name: 'User 1' } },
    { email: 'user2@test.com', variables: { name: 'User 2' } }
  ],
  'Test Newsletter',
  'newsletter'
);

console.log(`Success: ${result.sent}, Failed: ${result.failed}`);
```

### Property Data Testing

```typescript
// Test property data aggregation
const data = await PropertyDataService.getPropertyData(
  '1 Infinite Loop, Cupertino, CA'
);

console.log('Estimates:', {
  zillow: data.zestimate,
  redfin: data.redfin_estimate,
  realtor: data.realtor_estimate,
  average: data.averageEstimate
});

// Test rental analysis
const rental = await PropertyDataService.getRentalMarketData(
  '1 Infinite Loop, Cupertino, CA',
  3, 2, 1800
);

console.log('Rental data:', rental);
```

---

## Monitoring & Alerts

### Email Service Monitoring

**Track these metrics**:
- Email delivery rate
- Bounce rate
- Open rate
- Click rate
- Failed sends

**Alerts**:
- Alert if delivery rate < 95%
- Alert if bounce rate > 5%
- Alert if API key is invalid

### Property Data Monitoring

**Track these metrics**:
- API response times
- Cache hit rate
- API failure rate
- Data freshness

**Alerts**:
- Alert if all APIs fail for an address
- Alert if cache is stale (> 30 days)
- Alert if API rate limits approached

---

## Best Practices

### Email Service
1. ✅ Use templates for consistency
2. ✅ Log all emails for auditing
3. ✅ Handle bounces and unsubscribes
4. ✅ Implement rate limiting for batch sends
5. ✅ Test templates before deployment
6. ✅ Monitor delivery rates daily

### Property Data
1. ✅ Cache aggressively (7 days minimum)
2. ✅ Handle partial data gracefully
3. ✅ Use average of estimates, not single source
4. ✅ Refresh cache periodically in background
5. ✅ Monitor API usage to avoid overages
6. ✅ Have fallback to mock data

---

## Troubleshooting

### Email Service

**Problem**: Emails not sending
- Check Resend API key is valid
- Check "from" email is verified domain
- Check recipient email is valid
- Review Resend dashboard for errors

**Problem**: Emails going to spam
- Add SPF, DKIM, DMARC records
- Use verified domain
- Avoid spam trigger words
- Include unsubscribe link

### Property Data

**Problem**: No data returned
- Check API keys are valid
- Check address format is correct
- Check cache table exists
- Review API provider dashboards

**Problem**: Stale data
- Check cache expiration (7 days)
- Manually clear cache if needed
- Verify API responses are current

---

## Future Enhancements

### Email Service
- [ ] A/B testing for subject lines
- [ ] Advanced template builder
- [ ] SMS notifications via Twilio
- [ ] Push notifications
- [ ] Email preference center

### Property Data
- [ ] Additional data sources (PropStream, Attom Data)
- [ ] Historical trend analysis
- [ ] Predictive analytics
- [ ] Neighborhood data
- [ ] Crime statistics
- [ ] School district ratings
- [ ] Walkability scores

---

## Support

For integration issues:
- **Email**: Check Resend documentation - https://resend.com/docs
- **Property Data**: Contact respective API providers
- **Platform Issues**: support@blockestate.com

---

## Conclusion

All third-party integrations are production-ready with:
✅ Professional implementation
✅ Error handling and fallbacks
✅ Caching for performance
✅ Mock modes for development
✅ Comprehensive logging
✅ Webhook support where applicable

The platform is ready for commercial launch with enterprise-grade integrations!

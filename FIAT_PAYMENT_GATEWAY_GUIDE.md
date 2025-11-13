# Fiat Payment Gateway Guide

Your application now has a comprehensive fiat payment gateway integrated with Stripe for processing credit/debit card payments and bank transfers.

## Features

### Payment Methods Supported
- Credit Cards (Visa, Mastercard, American Express, Discover)
- Debit Cards
- ACH Bank Transfers (Coming Soon)

### Key Capabilities
1. **Add Payment Methods**: Securely add and save credit/debit cards
2. **Manage Methods**: Set default payment method, view all saved methods
3. **Delete Methods**: Remove payment methods you no longer need
4. **Secure Processing**: All payment data encrypted via Stripe
5. **PCI Compliance**: Level 1 PCI DSS compliant payment processing

## How It Works

### For Users

**Accessing the Fiat Gateway:**
1. Sign in to your account
2. Navigate to **Payments** page from the navbar
3. Click on the **"Fiat Gateway"** tab (first option)

**Adding a Credit/Debit Card:**
1. Click **"Add Payment Method"** button
2. Select **"Credit/Debit Card"** option
3. Enter your card details in the secure form:
   - Card number
   - Expiration date (MM/YY)
   - CVC code
   - ZIP/Postal code
4. Click **"Add Payment Method"**
5. Your card is securely saved with Stripe (we never store your card details)

**Managing Payment Methods:**
- **View All**: See all your saved payment methods with masked card numbers
- **Set Default**: Click "Set as Default" on any method to make it your primary payment option
- **Remove**: Click "Remove" to delete a payment method

**Using for Property Investments:**
- When investing in properties, your default payment method will be used
- You can change the payment method before confirming any transaction
- All transactions are processed securely through Stripe

### Security Features

**Encryption & Storage:**
- Card details are never stored on our servers
- All payment data is encrypted and stored by Stripe
- We only store:
  - Last 4 digits of card
  - Card brand (Visa, Mastercard, etc.)
  - Expiration date
  - Stripe payment method ID

**Compliance:**
- PCI DSS Level 1 compliant
- 256-bit SSL encryption
- Secure 3D authentication when required
- Real-time fraud detection

**User Protection:**
- Escrow protection for all property transactions
- Refund support through admin dashboard
- Transaction history and receipts
- Dispute resolution process

## Technical Implementation

### Database Schema

```sql
payment_methods
├── id (uuid, primary key)
├── user_id (uuid, references auth.users)
├── stripe_payment_method_id (text, unique)
├── type (text, 'card' or 'bank_account')
├── last4 (text)
├── brand (text, e.g., 'visa', 'mastercard')
├── exp_month (integer)
├── exp_year (integer)
├── bank_name (text, for bank accounts)
├── account_type (text, 'checking' or 'savings')
├── is_default (boolean)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Component Structure

**FiatPaymentGateway** (`/src/components/FiatPaymentGateway.tsx`)
- Main gateway component
- Lists all payment methods
- Handles add/delete/set default operations
- Integrates with Stripe Elements

**AddPaymentMethodForm** (nested in FiatPaymentGateway)
- Secure form for adding new cards
- Uses Stripe CardElement for PCI compliance
- Supports both card and bank account types
- Real-time validation

### API Integration

**Stripe Methods Used:**
```typescript
// Initialize Stripe
loadStripe(publicKey)

// Create payment method
stripe.createPaymentMethod({
  type: 'card',
  card: cardElement
})
```

**Supabase Queries:**
```typescript
// Save payment method
supabase.from('payment_methods').insert({
  user_id,
  stripe_payment_method_id,
  type,
  last4,
  brand,
  exp_month,
  exp_year,
  is_default
})

// Load user's payment methods
supabase.from('payment_methods')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

// Set default payment method
supabase.from('payment_methods')
  .update({ is_default: true })
  .eq('id', methodId)

// Delete payment method
supabase.from('payment_methods')
  .delete()
  .eq('id', methodId)
```

## Configuration

### Environment Variables

Make sure these are set in your `.env` file:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase Configuration (already set)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Stripe Account Setup

1. **Create Stripe Account**:
   - Sign up at https://stripe.com
   - Complete account verification
   - Get API keys from Dashboard

2. **Enable Payment Methods**:
   - Go to Stripe Dashboard → Settings → Payment Methods
   - Enable credit/debit cards
   - Enable ACH/bank transfers (optional)
   - Configure 3D Secure settings

3. **Set Up Webhooks** (for production):
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe-webhook`
   - Subscribe to events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_method.attached`
     - `payment_method.detached`

## Payment Flow

### Property Investment Payment Flow

```
1. User selects property and number of tokens
   ↓
2. System calculates total cost + fees
   ↓
3. User clicks "Invest" button
   ↓
4. Payment modal opens showing:
   - Property details
   - Token amount
   - Total cost
   - Selected payment method
   ↓
5. User confirms payment
   ↓
6. System creates Stripe payment intent
   ↓
7. Funds placed in escrow
   ↓
8. Blockchain transaction processed
   ↓
9. Tokens minted to user's wallet
   ↓
10. Escrow released
   ↓
11. Transaction complete
```

### Fee Structure

**Platform Fees:**
- Platform fee: 2.5% of transaction
- Stripe processing fee (cards): 2.9% + $0.30
- Stripe processing fee (ACH): 0.8% + $0.80

**Example:**
```
Property investment: $1,000
Platform fee (2.5%): $25.00
Stripe fee (2.9% + $0.30): $29.30
Total charged: $1,054.30
```

## Testing

### Test Cards (Stripe Test Mode)

**Successful Payment:**
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment:**
- Card: 4000 0000 0000 0002
- Expiry: Any future date
- CVC: Any 3 digits

**Requires Authentication:**
- Card: 4000 0025 0000 3155
- Expiry: Any future date
- CVC: Any 3 digits

### Testing Flow

1. **Add Test Card:**
   ```
   - Navigate to Payments → Fiat Gateway
   - Click "Add Payment Method"
   - Enter test card: 4242 4242 4242 4242
   - Expiry: 12/25, CVC: 123, ZIP: 12345
   - Click "Add Payment Method"
   ```

2. **Test Investment:**
   ```
   - Go to Marketplace
   - Select a property
   - Click "Invest"
   - Choose amount
   - Verify payment method
   - Complete investment
   ```

3. **Verify in Stripe Dashboard:**
   ```
   - Go to Stripe Dashboard → Payments
   - See test payment listed
   - Verify payment method attached
   ```

## Error Handling

**Common Errors & Solutions:**

1. **"Stripe not initialized"**
   - Check VITE_STRIPE_PUBLIC_KEY in .env
   - Ensure key starts with `pk_test_` or `pk_live_`

2. **"Card declined"**
   - Insufficient funds
   - Bank declined transaction
   - Use different payment method

3. **"Payment method creation failed"**
   - Invalid card details
   - Stripe API issue
   - Network connectivity problem

4. **"User not authenticated"**
   - Sign in required
   - Session expired
   - Re-authenticate

## Support & Troubleshooting

**For Users:**
- Contact support through the app
- Check payment history in Analytics tab
- View transaction receipts
- Report issues via help center

**For Developers:**
- Check Stripe logs in Dashboard
- Review Supabase logs
- Monitor webhook events
- Check browser console for errors

## Future Enhancements

**Planned Features:**
1. ACH/Bank Transfer support
2. International payment methods (SEPA, etc.)
3. Recurring payments for subscriptions
4. Payment scheduling
5. Multi-currency support
6. Apple Pay & Google Pay integration
7. Cryptocurrency on-ramp
8. Payment plans/installments

## Best Practices

**Security:**
- Never log sensitive payment data
- Always use HTTPS in production
- Implement rate limiting
- Monitor for suspicious activity
- Regular security audits

**User Experience:**
- Save payment methods for faster checkout
- Clear error messages
- Loading states during processing
- Success confirmations
- Email receipts

**Compliance:**
- Follow PCI DSS requirements
- Implement KYC/AML checks
- Privacy policy compliance
- Terms of service agreement
- Data retention policies

## Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **PCI Compliance**: https://stripe.com/docs/security/guide
- **Supabase Docs**: https://supabase.com/docs
- **Support**: support@blockestate.com

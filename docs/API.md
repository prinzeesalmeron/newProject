# BlockEstate API Documentation

## Overview

The BlockEstate API provides programmatic access to real estate investment data, user management, and blockchain interactions.

**Base URL:** `https://your-domain.com/api`
**Authentication:** Bearer token (JWT)

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

### Sign In
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

## Properties

### Get All Properties
```http
GET /properties
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- property_type: string
- location: string
- min_price: number
- max_price: number
```

### Get Property Details
```http
GET /properties/{id}
Authorization: Bearer <token>
```

### Create Property (Admin/Property Manager only)
```http
POST /properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Property Title",
  "description": "Property description",
  "location": "City, State",
  "property_type": "Single Family",
  "price_per_token": 100,
  "total_tokens": 1000,
  "available_tokens": 1000,
  "rental_yield": 8.5,
  "projected_return": 12.0,
  "features": ["Pool", "Gym"]
}
```

## Investments

### Invest in Property
```http
POST /investments
Authorization: Bearer <token>
Content-Type: application/json

{
  "property_id": "uuid",
  "token_amount": 10,
  "payment_method_id": "pm_xxx"
}
```

### Get User Investments
```http
GET /investments
Authorization: Bearer <token>
```

## Staking

### Get Staking Pools
```http
GET /staking/pools
Authorization: Bearer <token>
```

### Stake Tokens
```http
POST /staking/stake
Authorization: Bearer <token>
Content-Type: application/json

{
  "pool_id": "uuid",
  "amount": 1000
}
```

### Unstake Tokens
```http
POST /staking/unstake
Authorization: Bearer <token>
Content-Type: application/json

{
  "pool_id": "uuid",
  "amount": 500
}
```

## Transactions

### Get User Transactions
```http
GET /transactions
Authorization: Bearer <token>

Query Parameters:
- page: number
- limit: number
- type: string (purchase, sale, rental_income, etc.)
- status: string (pending, completed, failed)
```

## KYC/Verification

### Start KYC Process
```http
POST /kyc/start
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "document_type": "passport",
  "document": <file>,
  "country": "US"
}
```

### Check KYC Status
```http
GET /kyc/status
Authorization: Bearer <token>
```

## Payments

### Create Payment Intent
```http
POST /payments/intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000,
  "currency": "USD",
  "property_id": "uuid",
  "token_amount": 10
}
```

### Process Refund
```http
POST /payments/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "transaction_id": "uuid",
  "amount": 500,
  "reason": "User requested refund"
}
```

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limits

- **Authentication:** 5 requests per 15 minutes
- **Investments:** 10 requests per minute
- **General API:** 1000 requests per 15 minutes
- **File Uploads:** 20 requests per minute

## Webhooks

### Stripe Webhooks
```
POST /webhooks/stripe
```

### KYC Webhooks
```
POST /webhooks/kyc
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { BlockEstateAPI } from '@blockestate/sdk';

const api = new BlockEstateAPI({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Get properties
const properties = await api.properties.list({
  property_type: 'Single Family',
  location: 'Austin, TX'
});

// Invest in property
const investment = await api.investments.create({
  property_id: 'uuid',
  token_amount: 10,
  payment_method_id: 'pm_xxx'
});
```

### Python
```python
from blockestate import BlockEstateAPI

api = BlockEstateAPI(
    api_key='your-api-key',
    environment='production'
)

# Get properties
properties = api.properties.list(
    property_type='Single Family',
    location='Austin, TX'
)

# Invest in property
investment = api.investments.create(
    property_id='uuid',
    token_amount=10,
    payment_method_id='pm_xxx'
)
```
# Required Fixes After BlockToken Removal

## Overview
BlockToken has been successfully removed from smart contracts, but **17 files still reference it**. Here's what needs fixing:

---

## 🔴 CRITICAL - Fix Immediately

### 1. Fix Contract Service (`src/lib/contracts.ts`)

**Problem:** Uninitialized contracts and broken methods

**Current broken code:**
```typescript
async buyPropertyTokens(propertyId: number, amount: number, pricePerToken: string): Promise<string> {
  if (!this.marketplaceContract) throw new Error('Marketplace contract not initialized');
  // ❌ marketplaceContract is never initialized!
}
```

**Solution:** Either remove these methods or properly initialize:
```typescript
// Option 1: Remove broken methods entirely
// Option 2: Initialize properly in constructor
private marketplaceContract: ethers.Contract;

async initialize(provider: any) {
  this.provider = new ethers.providers.Web3Provider(provider);
  this.signer = this.provider.getSigner();
  this.marketplaceContract = new ethers.Contract(
    CONTRACT_ADDRESSES.MARKETPLACE,
    MARKETPLACE_ABI,
    this.signer
  );
}
```

---

### 2. Disable or Remove Staking Page

**File:** `src/pages/Staking.tsx`

**Problem:** Entire page references non-existent BLOCK token staking

**Quick Fix (Disable):**
```typescript
export const Staking = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md">
        <h2 className="text-2xl font-bold mb-4">Staking Coming Soon</h2>
        <p className="text-gray-600">
          Staking features are currently under development.
          Check back soon for updates!
        </p>
      </Card>
    </div>
  );
};
```

**Or remove from routes:** `src/App.tsx`

---

### 3. Fix Blockchain Components

**Files to update:**
- `src/components/SmartContractInterface.tsx`
- `src/components/blockchain/TokenizedMarketplace.tsx`
- `src/components/blockchain/RentalPayoutSystem.tsx`

**Changes needed:**
1. Remove all calls to `getBlockTokenBalance()`
2. Remove all calls to `transferBlockTokens()`
3. Remove all calls to `approveBlockTokens()`
4. Change "BLOCK" text to "ETH" or remove
5. Update payment flows to use ETH only

---

## 🟡 HIGH PRIORITY - Fix Soon

### 4. Update Governance Page

**File:** `src/pages/Governance.tsx`

**Changes:**
- Line 210: Change "BLOCK Governance Token" to "Governance"
- Line 218: Remove fake token balance or use property tokens
- Lines 281-321: Remove "Buy BLOCK Tokens" and "Stake Your BLOCK" sections
- Update voting to use property token holdings

---

### 5. Clean Up Wallet Components

**Files:**
- `src/components/WalletButton.tsx` (line 48)
- `src/components/UserProfile.tsx` (lines 387, 389, 506)
- `src/lib/wallet.ts` (lines 160-173)

**Changes:**
```typescript
// Remove BLOCK balance
const { ethBalance } = useWalletConnector();

// Update display
<div>
  {ethBalance.toFixed(4)} ETH
</div>
```

---

### 6. Fix Payment Service

**File:** `src/lib/services/paymentService.ts`

**Changes:**
```typescript
// Line 18: Remove BLOCK from currency type
currency: 'USD' | 'ETH'; // Remove | 'BLOCK'

// Line 722: Remove BLOCK handling
if (currency === 'ETH') {
  // Handle ETH payments
}
```

---

## 🟢 MEDIUM PRIORITY - Clean Up

### 7. Update Edge Function

**File:** `supabase/functions/update-currency-rates/index.ts`

**Remove lines 125-135:**
```typescript
// Remove BLOCK token rates
{
  from_currency: 'USD',
  to_currency: 'BLOCK',
  rate: 1.2,
  updated_at: now
},
```

---

### 8. Update CryptoConverter

**File:** `src/components/CryptoConverter.tsx`

**Remove BLOCK option from dropdown (line 187)**

---

### 9. Update Documentation

**Files:**
- `README.md` - Remove lines 14, 156, 199
- `docs/USER_GUIDE.md` - Remove staking section (lines 81-127)
- `docs/API.md` - Remove BLOCK token endpoints

---

## 📋 CHECKLIST

Copy this to track progress:

### Critical Fixes
- [ ] Fix `src/lib/contracts.ts` initialization
- [ ] Disable or remove staking page
- [ ] Update `SmartContractInterface.tsx`
- [ ] Update `TokenizedMarketplace.tsx`
- [ ] Update `RentalPayoutSystem.tsx`

### High Priority
- [ ] Update `Governance.tsx`
- [ ] Fix `WalletButton.tsx`
- [ ] Fix `UserProfile.tsx`
- [ ] Fix `wallet.ts`
- [ ] Update `paymentService.ts`

### Medium Priority
- [ ] Update `update-currency-rates` edge function
- [ ] Update `CryptoConverter.tsx`
- [ ] Update `README.md`
- [ ] Update `USER_GUIDE.md`
- [ ] Update `API.md`

### Testing
- [ ] Test property purchasing with ETH
- [ ] Test marketplace functionality
- [ ] Test wallet connection
- [ ] Test all pages load without errors
- [ ] Check browser console for errors
- [ ] Verify documentation accuracy

---

## 🎯 RECOMMENDED APPROACH

### Phase 1: Make It Work (Critical)
1. Fix contract initialization issues
2. Disable non-functional features
3. Remove broken method calls
4. Test that app loads without crashing

### Phase 2: Make It Right (High Priority)
5. Update UI to remove BLOCK references
6. Fix wallet displays
7. Update payment flows
8. Test all user flows

### Phase 3: Make It Clean (Medium Priority)
9. Update all documentation
10. Remove dead code
11. Clean up edge functions
12. Final QA testing

---

## 💡 ARCHITECTURE DECISION NEEDED

You need to decide:

**A. ETH-Only Platform** ✅ Recommended
- Remove all token references
- Use ETH for payments
- Use property tokens for governance
- Simplest to implement

**B. New Governance Token**
- Deploy new ERC20 token
- Re-implement staking
- Update all references
- More complex

**C. Wait for Token Strategy**
- Disable features now
- Plan token economics
- Implement properly later
- Best long-term

---

## 🚨 DEPLOYMENT BLOCKERS

Do NOT deploy until:
1. ✅ All Critical fixes complete
2. ✅ App loads without console errors
3. ✅ Basic user flows tested
4. ✅ Documentation updated

---

**Need Help?** Review `AUDIT_REPORT.md` for detailed analysis.

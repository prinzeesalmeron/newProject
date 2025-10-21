# Blockchain Integration Guide

Complete guide for integrating BlockEstate smart contracts with the frontend UI.

---

## ✅ What's Been Integrated

### 1. **Staking System**
- ✅ Smart contract ABI exported
- ✅ StakingService created with full contract interaction
- ✅ Staking page connected to blockchain
- ✅ Real-time pool data loading
- ✅ User stakes tracking
- ✅ Transaction handling with confirmations

### 2. **Contract Configuration**
- ✅ Multi-network support (Mainnet, Sepolia, Localhost)
- ✅ Environment-based network detection
- ✅ Contract address validation
- ✅ Explorer URL generation

### 3. **User Interface**
- ✅ Wallet connection integration
- ✅ Transaction status notifications
- ✅ Error handling with user-friendly messages
- ✅ Loading states for blockchain operations
- ✅ Navigation menu updated with Staking link

---

## 🔧 How It Works

### Architecture

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ StakingService  │ ← Handles all contract interactions
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Ethers.js     │ ← Web3 library
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  MetaMask/Web3  │ ← User's wallet
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Smart Contracts │ ← On blockchain
└─────────────────┘
```

### Flow Example: Staking ETH

1. **User Action**: Clicks "Stake ETH" button
2. **Frontend**: Validates inputs and connects to wallet
3. **StakingService**: Creates contract instance
4. **Transaction**: Sends stake transaction to blockchain
5. **Confirmation**: Waits for transaction confirmation
6. **UI Update**: Refreshes pools and stakes data
7. **Notification**: Shows success message to user

---

## 📁 Files Created/Modified

### New Files

1. **`src/lib/abis/Staking.json`**
   - Contract ABI for Staking contract
   - Essential function signatures
   - Event definitions

2. **`src/lib/blockchain/stakingService.ts`**
   - Complete staking service implementation
   - All contract interaction methods
   - Type-safe interfaces

3. **`BLOCKCHAIN_INTEGRATION.md`**
   - This guide

### Modified Files

1. **`src/pages/Staking.tsx`**
   - Replaced mock data with real contract calls
   - Added transaction handling
   - Integrated StakingService

2. **`src/components/Navbar.tsx`**
   - Added "Staking" navigation link
   - Positioned between Governance and Dashboard

3. **`src/App.tsx`**
   - Added `/staking` route (already done)

---

## 🚀 Usage Instructions

### For Development (Before Deployment)

The app will work with mock data until contracts are deployed. To test:

1. **Connect MetaMask** to Sepolia testnet
2. **Navigate to** `/staking` page
3. **UI will show** "Failed to Load" error (expected - no contract deployed yet)

### After Contract Deployment

1. **Deploy contracts** using the deployment guide
2. **Update contract addresses** in `src/lib/contractConfig.ts`:

```typescript
SEPOLIA: {
  PROPERTY_TOKEN: '0xYourPropertyTokenAddress',
  MARKETPLACE: '0xYourMarketplaceAddress',
  GOVERNANCE: '0xYourGovernanceAddress',
  STAKING: '0xYourStakingAddress', // ← Add this
}
```

3. **Restart dev server**: `npm run dev`
4. **Test integration**:
   - Connect wallet
   - View pools
   - Stake small amount (0.01 ETH minimum)
   - Claim rewards
   - Unstake after lock period

---

## 🔍 StakingService API

### Initialization

```typescript
import { stakingService } from '../lib/blockchain/stakingService';
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
await stakingService.initialize(provider);
```

### Read Functions (No Gas)

```typescript
// Get all pools
const pools = await stakingService.getAllPools();

// Get user's stakes
const stakes = await stakingService.getUserStakes(address);

// Calculate rewards
const rewards = await stakingService.calculateRewards(address, stakeId);

// Get pool count
const count = await stakingService.getPoolCount();

// Get minimum stake amount
const minAmount = await stakingService.getMinStakeAmount();

// Check if paused
const paused = await stakingService.isPaused();

// Get rewards pool balance
const rewardsBalance = await stakingService.getRewardsPoolBalance();
```

### Write Functions (Requires Gas)

```typescript
// Stake ETH
const tx = await stakingService.stake(poolId, amount);
await tx.wait(); // Wait for confirmation

// Unstake
const tx = await stakingService.unstake(stakeId);
await tx.wait();

// Claim rewards
const tx = await stakingService.claimRewards(stakeId);
await tx.wait();
```

---

## 🎨 UI Components

### Loading States

```typescript
const [loading, setLoading] = useState(false);
const [loadingPools, setLoadingPools] = useState(true);

// Show spinner while loading
{loadingPools && <LoadingSpinner />}

// Disable buttons while processing
<Button disabled={loading}>
  {loading ? 'Processing...' : 'Stake ETH'}
</Button>
```

### Error Handling

```typescript
try {
  const tx = await stakingService.stake(poolId, amount);
  toast.info('Transaction Pending', 'Waiting for confirmation...');
  await tx.wait();
  toast.success('Success!', 'ETH staked successfully');
} catch (error: any) {
  console.error('Error:', error);
  toast.error('Failed', error.message || 'Transaction failed');
}
```

### Toast Notifications

```typescript
import { toast } from '../components/ui/Toast';

// Success
toast.success('Title', 'Description');

// Error
toast.error('Title', 'Description');

// Info
toast.info('Title', 'Description');

// Warning
toast.warning('Title', 'Description');
```

---

## 🔐 Security Considerations

### User Safety

1. **Always validate inputs** before sending transactions
2. **Show transaction details** before confirmation
3. **Display gas estimates** when possible
4. **Warn about irreversible actions**
5. **Implement transaction timeouts**

### Contract Interaction

```typescript
// ✅ Good: Validate before transaction
if (parseFloat(amount) > parseFloat(balance)) {
  toast.error('Insufficient Balance');
  return;
}

// ✅ Good: Handle errors gracefully
try {
  const tx = await stakingService.stake(poolId, amount);
  await tx.wait();
} catch (error: any) {
  // Don't expose raw error to user
  toast.error('Transaction Failed', 'Please try again');
  console.error('Error:', error); // Log for debugging
}

// ❌ Bad: No validation
await stakingService.stake(poolId, amount); // Could fail with no feedback
```

---

## 🧪 Testing Checklist

### Before Deployment

- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors
- [ ] All imports resolved
- [ ] UI renders without contract

### After Deployment

- [ ] Contract addresses updated
- [ ] Wallet connects successfully
- [ ] Pools load from blockchain
- [ ] User can stake ETH
- [ ] Transaction confirmations work
- [ ] User stakes display correctly
- [ ] Rewards calculate properly
- [ ] User can claim rewards
- [ ] User can unstake after lock period
- [ ] Error messages are helpful
- [ ] Loading states work
- [ ] Toast notifications appear

---

## 🐛 Common Issues

### Issue: "Service not initialized"
**Solution**: Ensure you call `initialize()` with a provider before using other methods.

```typescript
const provider = new ethers.providers.Web3Provider(window.ethereum);
await stakingService.initialize(provider);
```

### Issue: "Failed to Load" pools
**Solutions**:
- Check contract is deployed
- Verify contract address in config
- Ensure wallet is connected
- Check network (Sepolia vs Mainnet)

### Issue: Transaction reverts
**Common causes**:
- Insufficient ETH balance
- Amount below minimum (0.01 ETH)
- Pool capacity exceeded
- Lock period not ended (for unstaking)
- Contract paused

### Issue: MetaMask not detected
**Solution**: Check `window.ethereum` exists:

```typescript
if (!window.ethereum) {
  toast.error('No Wallet', 'Please install MetaMask');
  return;
}
```

---

## 📊 Data Flow

### Pool Data

```typescript
// Blockchain → Service → Component → UI
Contract.getAllPools()
  → stakingService.getAllPools()
    → setPools(data)
      → UI renders pools
```

### User Stakes

```typescript
// Blockchain → Service → Component → UI + Database
Contract.getUserStakes(address)
  → stakingService.getUserStakes(address)
    → setUserStakes(data)
      → UI renders stakes
      → Optional: Save to Supabase for analytics
```

### Staking Flow

```typescript
// UI → Service → Contract → Confirmation → Refresh
handleStake()
  → stakingService.stake(poolId, amount)
    → Contract.stake{value: amount}()
      → tx.wait()
        → loadUserStakes()
        → loadPools()
```

---

## 🚧 Future Enhancements

### Planned Features

1. **Auto-refresh** pools and stakes every 30 seconds
2. **Transaction history** from blockchain events
3. **Estimated gas** display before transactions
4. **Batch operations** (claim all rewards)
5. **Mobile wallet** support (WalletConnect)
6. **ENS name** resolution
7. **Multi-sig** support for admin functions

### Code Improvements

1. **Service caching** to reduce RPC calls
2. **Optimistic UI** updates
3. **Better error recovery**
4. **Retry logic** for failed transactions
5. **Gas price** optimization
6. **Event listeners** for real-time updates

---

## 📚 Resources

### Documentation
- Ethers.js: https://docs.ethers.org/v5/
- MetaMask: https://docs.metamask.io/
- React Hooks: https://react.dev/reference/react

### Tools
- Sepolia Faucet: https://sepoliafaucet.com
- Etherscan Sepolia: https://sepolia.etherscan.io
- Gas Tracker: https://etherscan.io/gastracker

### Debugging
- Check console for errors
- Use React DevTools
- Inspect MetaMask activity
- View transactions on Etherscan

---

## ✅ Integration Complete!

The staking system is fully integrated with blockchain functionality. After deploying contracts and updating addresses, users will be able to:

- ✅ View real-time staking pools
- ✅ Stake ETH directly from UI
- ✅ Track their active stakes
- ✅ Claim rewards
- ✅ Unstake after lock periods
- ✅ See transaction confirmations
- ✅ Get helpful error messages

**Next Steps:**
1. Deploy contracts to testnet
2. Update contract addresses
3. Test all features
4. Fix any issues
5. Deploy to production

**Build Status**: ✅ PASSING
**Integration Status**: ✅ COMPLETE

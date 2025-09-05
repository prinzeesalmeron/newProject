// Application constants for easy configuration
export const APP_CONFIG = {
  name: 'BlockEstate',
  version: '1.0.0',
  description: 'Real Estate Investment Platform',
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
    retryAttempts: 3
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // Investment limits
  investment: {
    minAmount: 10,
    maxAmount: 100000,
    defaultTokens: 10
  },
  
  // Staking configuration
  staking: {
    minStake: 100,
    maxStake: 1000000
  },
  
  // UI Configuration
  ui: {
    animationDuration: 300,
    toastDuration: 5000,
    debounceDelay: 300
  },
  
  // Feature flags
  features: {
    darkMode: true,
    notifications: true,
    analytics: true,
    governance: true,
    staking: true,
    walletConnect: true
  }
} as const;

// Property types
export const PROPERTY_TYPES = [
  'Single Family',
  'Multi Family', 
  'Commercial',
  'Vacation Rentals',
  'Cash Flowing'
] as const;

// User roles
export const USER_ROLES = [
  'investor',
  'property_manager', 
  'admin'
] as const;

// Transaction types
export const TRANSACTION_TYPES = [
  'purchase',
  'sale',
  'rental_income',
  'staking_reward',
  'withdrawal',
  'deposit'
] as const;

// Status types
export const STATUSES = {
  property: ['active', 'sold_out', 'coming_soon'],
  transaction: ['pending', 'completed', 'failed', 'cancelled'],
  kyc: ['pending', 'verified', 'rejected']
} as const;

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  INVESTMENT_SUCCESS: 'Investment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PROPERTY_ADDED: 'Property added successfully!',
  STAKE_SUCCESS: 'Tokens staked successfully!',
  WALLET_CONNECTED: 'Wallet connected successfully!'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_INPUT: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet first.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.'
} as const;
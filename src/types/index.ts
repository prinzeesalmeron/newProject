// Centralized type definitions for better type safety
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'investor' | 'property_manager' | 'admin';
  kyc_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  location: string;
  property_type: 'Single Family' | 'Multi Family' | 'Commercial' | 'Vacation Rentals' | 'Cash Flowing';
  price_per_token: number;
  total_tokens: number;
  available_tokens: number;
  rental_yield: number;
  projected_return: number;
  rating: number;
  features: string[];
  is_yield_property: boolean;
  yield_percentage?: string;
  status: 'active' | 'sold_out' | 'coming_soon';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  property_id?: string;
  transaction_type: 'purchase' | 'sale' | 'rental_income' | 'staking_reward' | 'withdrawal' | 'deposit';
  amount: number;
  token_amount?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface StakingPool {
  id: string;
  name: string;
  description?: string;
  apy: number;
  lock_period: number;
  min_stake: number;
  max_stake?: number;
  is_active: boolean;
}

export interface Investment {
  id: string;
  user_id: string;
  property_id: string;
  tokens_owned: number;
  purchase_price: number;
  current_value: number;
  monthly_income: number;
  total_return: number;
  purchase_date: string;
  property?: Property;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FilterOptions {
  property_type?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  min_yield?: number;
  max_yield?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Error types for better error handling
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Form types
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  loading: boolean;
  touched: Record<string, boolean>;
}

// Wallet types
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  blockBalance: number;
  provider: string | null;
  connecting: boolean;
}

// Theme types
export interface ThemeState {
  isDarkMode: boolean;
  primaryColor: string;
  accentColor: string;
}
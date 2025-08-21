import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Using mock mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Property = {
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
};

export type StakingPool = {
  id: string;
  name: string;
  description?: string;
  apy: number;
  lock_period: number;
  min_stake: number;
  max_stake?: number;
  is_active: boolean;
};

export type Course = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  duration: string;
  students_count: number;
  rating: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
  content?: string;
  is_featured: boolean;
};

export type Article = {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  image_url?: string;
  category?: string;
  author?: string;
  read_time?: string;
  published_date: string;
  is_featured: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  block_balance: number;
  total_portfolio_value: number;
};

export type Investment = {
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
};
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

// Mock data
export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Apartment Complex',
    description: 'Premium apartment complex in the heart of downtown with excellent rental potential.',
    image_url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    location: 'New York, NY',
    property_type: 'Multi Family',
    price_per_token: 100,
    total_tokens: 1000,
    available_tokens: 750,
    rental_yield: 8.5,
    projected_return: 12.3,
    rating: 4.8,
    features: ['Pool', 'Gym', 'Parking', 'Security'],
    is_yield_property: true,
    yield_percentage: '8.5%',
    status: 'active'
  },
  {
    id: '2',
    title: 'Luxury Beach House',
    description: 'Stunning beachfront property perfect for vacation rentals with high occupancy rates.',
    image_url: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
    location: 'Miami, FL',
    property_type: 'Vacation Rentals',
    price_per_token: 250,
    total_tokens: 400,
    available_tokens: 200,
    rental_yield: 15.2,
    projected_return: 18.7,
    rating: 4.9,
    features: ['Beach Access', 'Pool', 'Hot Tub', 'Ocean View'],
    is_yield_property: true,
    yield_percentage: '15.2%',
    status: 'active'
  },
  {
    id: '3',
    title: 'Commercial Office Building',
    description: 'Prime commercial real estate in business district with long-term tenants.',
    image_url: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg',
    location: 'Chicago, IL',
    property_type: 'Commercial',
    price_per_token: 500,
    total_tokens: 2000,
    available_tokens: 1200,
    rental_yield: 6.8,
    projected_return: 9.5,
    rating: 4.6,
    features: ['Elevator', 'Parking Garage', 'Conference Rooms', 'Security'],
    is_yield_property: true,
    yield_percentage: '6.8%',
    status: 'active'
  },
  {
    id: '4',
    title: 'Single Family Rental Home',
    description: 'Beautiful single family home in a desirable neighborhood with steady rental income.',
    image_url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
    location: 'Austin, TX',
    property_type: 'Single Family',
    price_per_token: 75,
    total_tokens: 800,
    available_tokens: 600,
    rental_yield: 7.2,
    projected_return: 10.8,
    rating: 4.7,
    features: ['Garden', 'Garage', 'Modern Kitchen', 'Hardwood Floors'],
    is_yield_property: true,
    yield_percentage: '7.2%',
    status: 'active'
  },
  {
    id: '5',
    title: 'Cash Flowing Duplex',
    description: 'Excellent duplex property generating strong cash flow with reliable tenants.',
    image_url: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg',
    location: 'Denver, CO',
    property_type: 'Cash Flowing',
    price_per_token: 120,
    total_tokens: 600,
    available_tokens: 400,
    rental_yield: 9.1,
    projected_return: 13.5,
    rating: 4.5,
    features: ['Two Units', 'Separate Entrances', 'Parking', 'Updated Appliances'],
    is_yield_property: true,
    yield_percentage: '9.1%',
    status: 'active'
  }
];

export const mockStakingPools: StakingPool[] = [
  {
    id: '1',
    name: 'Flexible Staking',
    description: 'Stake your BLOCK tokens with no lock period and earn daily rewards.',
    apy: 5.2,
    lock_period: 0,
    min_stake: 100,
    is_active: true
  },
  {
    id: '2',
    name: '30-Day Lock',
    description: 'Lock your tokens for 30 days to earn higher rewards.',
    apy: 7.8,
    lock_period: 30,
    min_stake: 500,
    max_stake: 50000,
    is_active: true
  },
  {
    id: '3',
    name: '90-Day Lock',
    description: 'Maximum rewards with 90-day lock period for serious investors.',
    apy: 12.5,
    lock_period: 90,
    min_stake: 1000,
    max_stake: 100000,
    is_active: true
  }
];

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Real Estate Investment Fundamentals',
    description: 'Learn the basics of real estate investing, from market analysis to property valuation.',
    image_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
    duration: '4 hours',
    students_count: 2847,
    rating: 4.8,
    difficulty: 'Beginner',
    topics: ['Market Analysis', 'Property Valuation', 'Investment Strategies', 'Risk Management'],
    is_featured: true
  },
  {
    id: '2',
    title: 'Blockchain and Tokenization',
    description: 'Understand how blockchain technology is revolutionizing real estate investment.',
    image_url: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg',
    duration: '3 hours',
    students_count: 1923,
    rating: 4.7,
    difficulty: 'Intermediate',
    topics: ['Blockchain Basics', 'Smart Contracts', 'Tokenization Process', 'DeFi Integration'],
    is_featured: false
  },
  {
    id: '3',
    title: 'Portfolio Diversification Strategies',
    description: 'Advanced techniques for building a diversified real estate investment portfolio.',
    image_url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
    duration: '5 hours',
    students_count: 1456,
    rating: 4.9,
    difficulty: 'Advanced',
    topics: ['Asset Allocation', 'Geographic Diversification', 'Property Types', 'Risk Assessment'],
    is_featured: false
  }
];

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'The Future of Real Estate Investment: Tokenization Explained',
    excerpt: 'Discover how blockchain technology is making real estate investment more accessible than ever before.',
    content: 'Real estate tokenization represents a paradigm shift in how we think about property investment...',
    image_url: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
    category: 'Technology',
    author: 'Sarah Johnson',
    read_time: '8 min read',
    published_date: '2024-01-15',
    is_featured: true
  },
  {
    id: '2',
    title: 'Market Analysis: Top 5 Cities for Real Estate Investment in 2024',
    excerpt: 'Our comprehensive analysis reveals the most promising markets for real estate investment this year.',
    content: 'After analyzing market trends, population growth, and economic indicators...',
    image_url: 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg',
    category: 'Market Analysis',
    author: 'Michael Chen',
    read_time: '12 min read',
    published_date: '2024-01-10',
    is_featured: true
  },
  {
    id: '3',
    title: 'Understanding Rental Yields: A Beginner\'s Guide',
    excerpt: 'Learn how to calculate and interpret rental yields to make informed investment decisions.',
    content: 'Rental yield is one of the most important metrics for real estate investors...',
    category: 'Education',
    author: 'Emma Davis',
    read_time: '6 min read',
    published_date: '2024-01-05',
    is_featured: false
  }
];

export const mockUserProfile: UserProfile = {
  id: '1',
  email: 'demo@blockestate.com',
  full_name: 'Demo User',
  block_balance: 2340,
  total_portfolio_value: 19525
};

export const mockInvestments: Investment[] = [
  {
    id: '1',
    user_id: '1',
    property_id: '1',
    tokens_owned: 150,
    purchase_price: 15000,
    current_value: 7050,
    monthly_income: 47.25,
    total_return: 8.5,
    purchase_date: '2023-08-15',
    property: mockProperties[0]
  },
  {
    id: '2',
    user_id: '1',
    property_id: '4',
    tokens_owned: 75,
    purchase_price: 5625,
    current_value: 4875,
    monthly_income: 29.25,
    total_return: 7.2,
    purchase_date: '2023-09-20',
    property: mockProperties[3]
  },
  {
    id: '3',
    user_id: '1',
    property_id: '5',
    tokens_owned: 200,
    purchase_price: 24000,
    current_value: 7600,
    monthly_income: 57.67,
    total_return: 8.1,
    purchase_date: '2023-10-10',
    property: mockProperties[4]
  }
];

// Mock API functions
export const mockApi = {
  // Properties
  getProperties: async (): Promise<Property[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return mockProperties.filter(p => p.status === 'active');
  },

  // Staking
  getStakingPools: async (): Promise<StakingPool[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStakingPools.filter(p => p.is_active);
  },

  // Education
  getCourses: async (): Promise<Course[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockCourses;
  },

  getArticles: async (): Promise<Article[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockArticles;
  },

  // User data
  getUserProfile: async (): Promise<UserProfile> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockUserProfile;
  },

  getInvestments: async (): Promise<Investment[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockInvestments;
  },

  // Auth simulation
  signIn: async (email: string, password: string): Promise<{ user: any; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === 'demo@blockestate.com' && password === 'demo123') {
      return { user: { id: '1', email, user_metadata: { full_name: 'Demo User' } } };
    }
    return { user: null, error: 'Invalid credentials' };
  },

  signUp: async (email: string, password: string, fullName: string): Promise<{ user: any; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { user: { id: '2', email, user_metadata: { full_name: fullName } } };
  },

  signOut: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
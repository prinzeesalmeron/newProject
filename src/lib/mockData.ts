import type { Course, Article } from './supabase';

// Mock data arrays
export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Real Estate Investment Fundamentals',
    description: 'Learn the basics of real estate investing, from property analysis to financing strategies.',
    image_url: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
    duration: '4 hours',
    students_count: 1250,
    rating: 4.8,
    difficulty: 'Beginner',
    topics: [
      'Property valuation methods',
      'Cash flow analysis',
      'Financing options',
      'Market research techniques',
      'Risk assessment'
    ],
    content: 'Comprehensive course covering all aspects of real estate investment fundamentals.',
    is_featured: true
  },
  {
    id: '2',
    title: 'Blockchain and Real Estate',
    description: 'Understand how blockchain technology is revolutionizing real estate investment.',
    image_url: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg',
    duration: '3 hours',
    students_count: 890,
    rating: 4.6,
    difficulty: 'Intermediate',
    topics: [
      'Tokenization basics',
      'Smart contracts',
      'DeFi in real estate',
      'Fractional ownership',
      'Regulatory considerations'
    ],
    content: 'Deep dive into blockchain applications in real estate.',
    is_featured: false
  },
  {
    id: '3',
    title: 'Portfolio Diversification Strategies',
    description: 'Master the art of building a diversified real estate investment portfolio.',
    image_url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
    duration: '2.5 hours',
    students_count: 675,
    rating: 4.7,
    difficulty: 'Advanced',
    topics: [
      'Geographic diversification',
      'Property type mixing',
      'Risk-return optimization',
      'Market cycle timing',
      'Exit strategies'
    ],
    content: 'Advanced strategies for portfolio optimization.',
    is_featured: false
  }
];

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'The Future of Real Estate Investment: Tokenization Trends',
    excerpt: 'Explore how blockchain technology is making real estate investment more accessible and liquid than ever before.',
    content: 'Full article content about tokenization trends in real estate...',
    image_url: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
    category: 'Technology',
    author: 'Sarah Johnson',
    read_time: '5 min read',
    published_date: '2024-01-15T10:00:00Z',
    is_featured: true
  },
  {
    id: '2',
    title: 'Market Analysis: Q1 2024 Real Estate Performance',
    excerpt: 'Comprehensive analysis of real estate market performance in the first quarter of 2024.',
    content: 'Detailed market analysis content...',
    image_url: 'https://images.pexels.com/photos/210607/pexels-photo-210607.jpeg',
    category: 'Market Analysis',
    author: 'Michael Chen',
    read_time: '8 min read',
    published_date: '2024-01-10T14:30:00Z',
    is_featured: true
  },
  {
    id: '3',
    title: 'Understanding Rental Yields in Different Markets',
    excerpt: 'A guide to calculating and comparing rental yields across various real estate markets.',
    content: 'Educational content about rental yield calculations...',
    image_url: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
    category: 'Education',
    author: 'Emily Rodriguez',
    read_time: '6 min read',
    published_date: '2024-01-05T09:15:00Z',
    is_featured: false
  },
  {
    id: '4',
    title: 'Risk Management in Real Estate Investment',
    excerpt: 'Essential strategies for identifying and mitigating risks in your real estate portfolio.',
    content: 'Risk management strategies and best practices...',
    image_url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
    category: 'Risk Management',
    author: 'David Thompson',
    read_time: '7 min read',
    published_date: '2023-12-28T16:45:00Z',
    is_featured: false
  }
];

export const mockProperties: any[] = [
  {
    id: 'prop1',
    title: 'The Metropolitan - Downtown Austin',
    description: 'Luxury 24-story apartment complex featuring 180 units with premium amenities including rooftop pool, fitness center, and concierge services. Located in the heart of Austin\'s central business district with walking access to major employers and entertainment.',
    image_url: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
    location: 'Austin, TX',
    property_type: 'Multi Family',
    price_per_token: 125,
    total_tokens: 3600, // $450,000 property / $125 per token
    available_tokens: 2700,
    rental_yield: 7.8,
    projected_return: 11.5,
    rating: 4.8,
    features: ['Rooftop Pool', 'Fitness Center', 'Concierge', 'Valet Parking', '24/7 Security', 'Business Center'],
    is_yield_property: true,
    yield_percentage: '7.8%',
    status: 'active',
    mls_data: {
      mls_id: 'ATX2024001',
      listing_agent: 'Sarah Johnson - Keller Williams',
      listing_date: '2024-01-15',
      square_feet: 850,
      year_built: 2019
    },
    market_data: {
      zestimate: 475000,
      rent_estimate: 2850,
      neighborhood_score: 92,
      walk_score: 95,
      transit_score: 88
    },
    verification_status: 'completed',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prop2',
    title: 'Cedar Park Family Homes - Portfolio A',
    description: 'Professionally managed portfolio of 12 single-family homes in Cedar Park\'s highly-rated school district. Each home features 3-4 bedrooms, modern updates, and attracts quality long-term tenants. Average occupancy rate of 97% over the past 3 years.',
    image_url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
    location: 'Cedar Park, TX',
    property_type: 'Single Family',
    price_per_token: 85,
    total_tokens: 4000, // $340,000 average per home * 12 homes / $85 per token
    available_tokens: 1600,
    rental_yield: 8.2,
    projected_return: 12.8,
    rating: 4.6,
    features: ['Top-Rated Schools', '2-Car Garage', 'Modern Kitchens', 'Fenced Yards', 'Professional Management'],
    is_yield_property: true,
    yield_percentage: '8.2%',
    status: 'active',
    mls_data: {
      mls_id: 'ATX2024002',
      listing_agent: 'Michael Chen - RE/MAX',
      listing_date: '2024-01-10',
      square_feet: 1850,
      year_built: 2016
    },
    market_data: {
      zestimate: 340000,
      rent_estimate: 2300,
      neighborhood_score: 89,
      walk_score: 65,
      transit_score: 45
    },
    verification_status: 'completed',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: 'prop3',
    title: 'Domain Corporate Center',
    description: 'Class A office building in Austin\'s premier Domain district. 85,000 sq ft across 8 floors with anchor tenants including tech companies and financial services firms. Triple-net lease structure with 7-year average lease terms and built-in annual rent escalations.',
    image_url: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg',
    location: 'Austin, TX - Domain',
    property_type: 'Commercial',
    price_per_token: 200,
    total_tokens: 8500, // $1.7M property / $200 per token
    available_tokens: 3400,
    rental_yield: 6.2,
    projected_return: 9.8,
    rating: 4.9,
    features: ['Class A Office', 'Tech Tenants', '500-Car Garage', 'Conference Centers', 'Fiber Internet', 'LEED Certified'],
    is_yield_property: true,
    yield_percentage: '6.2%',
    status: 'active',
    mls_data: {
      mls_id: 'ATX2024003',
      listing_agent: 'Emily Rodriguez - CBRE',
      listing_date: '2024-01-05',
      square_feet: 85000,
      year_built: 2018
    },
    market_data: {
      zestimate: 1700000,
      rent_estimate: 8800,
      neighborhood_score: 95,
      walk_score: 78,
      transit_score: 82
    },
    verification_status: 'completed',
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z'
  },
  {
    id: 'prop4',
    title: 'Lake Travis Luxury Retreat',
    description: 'Stunning 6-bedroom lakefront estate on Lake Travis with private dock and panoramic water views. Professionally managed as a luxury vacation rental with 85% average occupancy. Popular for corporate retreats, weddings, and family vacations with premium nightly rates.',
    image_url: 'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg',
    location: 'Lake Travis, TX',
    property_type: 'Vacation Rentals',
    price_per_token: 180,
    total_tokens: 5000, // $900,000 property / $180 per token
    available_tokens: 2000,
    rental_yield: 14.2,
    projected_return: 19.5,
    rating: 4.7,
    features: ['Lakefront', 'Private Dock', 'Infinity Pool', 'Hot Tub', 'Game Room', 'Chef Kitchen', 'Wine Cellar'],
    is_yield_property: true,
    yield_percentage: '14.2%',
    status: 'active',
    mls_data: {
      mls_id: 'ATX2024004',
      listing_agent: 'David Thompson - Kuper Sotheby\'s',
      listing_date: '2023-12-28',
      square_feet: 4500,
      year_built: 2020
    },
    market_data: {
      zestimate: 925000,
      rent_estimate: 1200, // Per night
      neighborhood_score: 88,
      walk_score: 25,
      transit_score: 15
    },
    verification_status: 'completed',
    created_at: '2023-12-28T16:45:00Z',
    updated_at: '2023-12-28T16:45:00Z'
  },
  {
    id: 'prop5',
    title: 'East Austin Cash Flow Duplex',
    description: 'Fully renovated duplex in rapidly appreciating East Austin neighborhood. Both units feature 2BR/2BA with modern finishes and separate entrances. Current tenants on long-term leases with below-market rents, providing immediate positive cash flow and future rent growth potential.',
    image_url: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg',
    location: 'East Austin, TX',
    property_type: 'Cash Flowing',
    price_per_token: 75,
    total_tokens: 4000, // $300,000 property / $75 per token
    available_tokens: 1600,
    rental_yield: 11.2,
    projected_return: 16.8,
    rating: 4.4,
    features: ['Fully Renovated', 'Separate Entrances', 'Long-term Tenants', 'Below Market Rents', 'Appreciation Zone'],
    is_yield_property: true,
    yield_percentage: '11.2%',
    status: 'active',
    mls_data: {
      mls_id: 'ATX2024005',
      listing_agent: 'Lisa Wang - Compass',
      listing_date: '2023-12-20',
      square_feet: 2400,
      year_built: 1985
    },
    market_data: {
      zestimate: 315000,
      rent_estimate: 2950, // Combined both units
      neighborhood_score: 78,
      walk_score: 82,
      transit_score: 65
    },
    verification_status: 'completed',
    created_at: '2023-12-20T11:20:00Z',
    updated_at: '2023-12-20T11:20:00Z'
  },
  {
    id: 'prop6',
    title: 'Austin Logistics Hub - Building C',
    description: 'State-of-the-art 125,000 sq ft distribution facility strategically located near Austin-Bergstrom International Airport. Fully leased to Amazon with 10-year triple-net lease including 3% annual escalations. Features 32-foot clear heights, 54 dock doors, and ESFR sprinkler system.',
    image_url: 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg',
    location: 'Austin, TX - Airport Area',
    property_type: 'Commercial',
    price_per_token: 250,
    total_tokens: 12000, // $3M property / $250 per token
    available_tokens: 4800,
    rental_yield: 5.8,
    projected_return: 8.5,
    rating: 4.5,
    features: ['Amazon Tenant', 'Airport Location', '32ft Ceilings', '54 Dock Doors', 'Triple Net Lease', 'Annual Escalations'],
    is_yield_property: true,
    yield_percentage: '5.8%',
    status: 'active',
    mls_data: {
      mls_id: 'ATX2024006',
      listing_agent: 'Robert Kim - JLL',
      listing_date: '2023-12-15',
      square_feet: 125000,
      year_built: 2021
    },
    market_data: {
      zestimate: 3100000,
      rent_estimate: 15000,
      neighborhood_score: 75,
      walk_score: 35,
      transit_score: 45
    },
    verification_status: 'completed',
    created_at: '2023-12-15T13:10:00Z',
    updated_at: '2023-12-15T13:10:00Z'
  }
];

export const mockStakingPools: any[] = [
  {
    id: 'pool1',
    name: 'Flexible Staking',
    description: 'No lock period, withdraw anytime with competitive rewards',
    apy: 5.0,
    lock_period: 0,
    min_stake: 100,
    max_stake: null,
    total_staked: 1250000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'pool2',
    name: '30-Day Lock',
    description: 'Higher rewards for 30-day commitment',
    apy: 8.0,
    lock_period: 30,
    min_stake: 500,
    max_stake: null,
    total_staked: 890000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'pool3',
    name: '90-Day Lock',
    description: 'Maximum rewards for long-term stakers',
    apy: 12.0,
    lock_period: 90,
    min_stake: 1000,
    max_stake: null,
    total_staked: 2100000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock API service for educational content
export class MockAPI {
  static async getCourses(): Promise<Course[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockCourses;
  }

  static async getArticles(): Promise<Article[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockArticles;
  }
}

// Export the mock API instance
export const mockApi = MockAPI;

// Re-export types for convenience
export type { Course, Article } from './supabase';
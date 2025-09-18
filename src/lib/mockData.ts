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
    title: 'Downtown Luxury Apartment Complex',
    description: 'Premium apartment complex in the heart of downtown with modern amenities and high rental demand.',
    image_url: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
    location: 'New York, NY',
    property_type: 'Multi Family',
    price_per_token: 100,
    total_tokens: 1000,
    available_tokens: 750,
    rental_yield: 8.5,
    projected_return: 12.3,
    rating: 4.8,
    features: ['Pool', 'Gym', 'Concierge', 'Parking', 'Security'],
    is_yield_property: true,
    yield_percentage: '8.5%',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prop2',
    title: 'Suburban Family Home Portfolio',
    description: 'Collection of single-family homes in growing suburban markets with stable rental income.',
    image_url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
    location: 'Austin, TX',
    property_type: 'Single Family',
    price_per_token: 75,
    total_tokens: 800,
    available_tokens: 320,
    rental_yield: 7.2,
    projected_return: 10.8,
    rating: 4.6,
    features: ['Garden', 'Garage', 'Modern Kitchen', 'Fireplace'],
    is_yield_property: true,
    yield_percentage: '7.2%',
    status: 'active',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: 'prop3',
    title: 'Commercial Office Building',
    description: 'Class A office building with long-term corporate tenants and stable cash flow.',
    image_url: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg',
    location: 'San Francisco, CA',
    property_type: 'Commercial',
    price_per_token: 150,
    total_tokens: 1200,
    available_tokens: 480,
    rental_yield: 6.8,
    projected_return: 9.5,
    rating: 4.9,
    features: ['Prime Location', 'Corporate Tenants', 'Parking Garage', 'Modern Facilities'],
    is_yield_property: true,
    yield_percentage: '6.8%',
    status: 'active',
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z'
  },
  {
    id: 'prop4',
    title: 'Vacation Rental Resort',
    description: 'Luxury vacation rental property in a popular tourist destination with high seasonal demand.',
    image_url: 'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg',
    location: 'Miami, FL',
    property_type: 'Vacation Rentals',
    price_per_token: 120,
    total_tokens: 600,
    available_tokens: 180,
    rental_yield: 12.5,
    projected_return: 18.2,
    rating: 4.7,
    features: ['Ocean View', 'Pool', 'Beach Access', 'Luxury Amenities'],
    is_yield_property: true,
    yield_percentage: '12.5%',
    status: 'active',
    created_at: '2023-12-28T16:45:00Z',
    updated_at: '2023-12-28T16:45:00Z'
  },
  {
    id: 'prop5',
    title: 'Cash Flowing Duplex',
    description: 'Well-maintained duplex with reliable tenants and positive cash flow from day one.',
    image_url: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg',
    location: 'Denver, CO',
    property_type: 'Cash Flowing',
    price_per_token: 50,
    total_tokens: 400,
    available_tokens: 120,
    rental_yield: 9.8,
    projected_return: 14.5,
    rating: 4.4,
    features: ['Duplex', 'Reliable Tenants', 'Low Maintenance', 'Positive Cash Flow'],
    is_yield_property: true,
    yield_percentage: '9.8%',
    status: 'active',
    created_at: '2023-12-20T11:20:00Z',
    updated_at: '2023-12-20T11:20:00Z'
  },
  {
    id: 'prop6',
    title: 'Industrial Warehouse Complex',
    description: 'Modern warehouse facility with e-commerce and logistics tenants in a strategic location.',
    image_url: 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg',
    location: 'Phoenix, AZ',
    property_type: 'Commercial',
    price_per_token: 200,
    total_tokens: 2000,
    available_tokens: 1200,
    rental_yield: 5.5,
    projected_return: 8.2,
    rating: 4.5,
    features: ['Strategic Location', 'E-commerce Tenants', 'Modern Facilities', 'Expansion Potential'],
    is_yield_property: true,
    yield_percentage: '5.5%',
    status: 'active',
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
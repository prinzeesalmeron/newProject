import type { Course, Article } from './supabase';

// Mock API service for educational content
export class MockAPI {
  static async getCourses(): Promise<Course[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
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
  }

  static async getArticles(): Promise<Article[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
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
  }
}

// Export the mock API instance
export const mockApi = MockAPI;

// Re-export types for convenience
export type { Course, Article } from './supabase';
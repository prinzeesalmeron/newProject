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

// Empty arrays - will be populated by user input
export const mockProperties: Property[] = [];

export const mockStakingPools: StakingPool[] = [];

export const mockCourses: Course[] = [];

export const mockArticles: Article[] = [];

export const mockUserProfile: UserProfile | null = null;

export const mockInvestments: Investment[] = [];

// Mock API functions
export const mockApi = {
  // Properties
  getProperties: async (): Promise<Property[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return mockProperties.filter(p => p.status === 'active');
  },

  addProperty: async (property: Omit<Property, 'id'>): Promise<Property> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newProperty = {
      ...property,
      id: Date.now().toString()
    };
    mockProperties.push(newProperty);
    return newProperty;
  },

  // Staking
  getStakingPools: async (): Promise<StakingPool[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStakingPools.filter(p => p.is_active);
  },

  addStakingPool: async (pool: Omit<StakingPool, 'id'>): Promise<StakingPool> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newPool = {
      ...pool,
      id: Date.now().toString()
    };
    mockStakingPools.push(newPool);
    return newPool;
  },

  // Education
  getCourses: async (): Promise<Course[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockCourses;
  },

  addCourse: async (course: Omit<Course, 'id'>): Promise<Course> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newCourse = {
      ...course,
      id: Date.now().toString()
    };
    mockCourses.push(newCourse);
    return newCourse;
  },

  getArticles: async (): Promise<Article[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockArticles;
  },

  addArticle: async (article: Omit<Article, 'id'>): Promise<Article> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newArticle = {
      ...article,
      id: Date.now().toString()
    };
    mockArticles.push(newArticle);
    return newArticle;
  },

  // User data
  getUserProfile: async (): Promise<UserProfile> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockUserProfile || {
      id: '1',
      email: 'user@example.com',
      full_name: 'User',
      block_balance: 0,
      total_portfolio_value: 0
    };
  },

  getInvestments: async (): Promise<Investment[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockInvestments;
  }
};
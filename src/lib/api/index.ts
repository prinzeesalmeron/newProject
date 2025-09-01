// Centralized API exports for backend core development
export { PropertyAPI } from './propertyAPI';
export { TransactionAPI } from './transactionAPI';
export { AuthAPI } from './authAPI';
export { NotificationAPI } from './notificationAPI';

// Legacy exports for backward compatibility
export { PropertyAPI as PropertyAPI } from '../api';
export { StakingAPI } from '../api';
export { LearningAPI } from '../api';
export { InvestmentAPI } from '../api';
export { PortfolioAPI } from '../api';

// Re-export types
export type { Property, StakingPool, Course, Article, UserProfile, Investment } from '../supabase';
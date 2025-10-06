import { supabase, Property, StakingPool, Course, Article, Investment } from './supabase';
import { DatabaseService } from './database';
import { mockProperties, mockStakingPools, mockCourses, mockArticles } from './mockData';
import { PropertyAPI as EnhancedPropertyAPI } from './api/propertyAPI';
import { TransactionAPI as EnhancedTransactionAPI } from './api/transactionAPI';
import { NotificationAPI as EnhancedNotificationAPI } from './api/notificationAPI';

export class PropertyAPI {
  static async getAllProperties(): Promise<Property[]> {
    if (!supabase) {
      console.log('Supabase not configured, using mock data');
      return mockProperties;
    }

    try {
      // Simple, fast query without complex joins
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50); // Limit results for faster loading

      if (error) {
        console.error('Supabase properties query error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching properties from Supabase:', error);
      console.log('Falling back to mock data');
      return mockProperties;
    }
  }

  static async getPropertyById(id: string): Promise<Property | null> {
    if (!supabase) {
      return mockProperties.find(p => p.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching property:', error);
      return mockProperties.find(p => p.id === id) || null;
    }
  }

  static async createProperty(property: Omit<Property, 'id'>): Promise<Property> {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      const newProperty: Property = {
        ...property,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockProperties.push(newProperty);
      return newProperty;
    }

    try {
      return await EnhancedPropertyAPI.createProperty(property);
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  static async investInProperty(propertyId: string, tokenAmount: number, totalCost: number): Promise<void> {
    if (!supabase) {
      console.log(`Mock investment: ${tokenAmount} tokens in property ${propertyId} for $${totalCost}`);
      // Update mock data
      const property = mockProperties.find(p => p.id === propertyId);
      if (property) {
        property.available_tokens = Math.max(0, property.available_tokens - tokenAmount);
      }
      return;
    }

    try {
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be signed in to invest in properties');
      }

      // Validate investment parameters
      if (tokenAmount <= 0) {
        throw new Error('Investment amount must be greater than 0');
      }

      if (totalCost <= 0) {
        throw new Error('Investment cost must be greater than 0');
      }

      // Verify property exists and has available tokens
      const property = await this.getPropertyById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      if (property.available_tokens < tokenAmount) {
        throw new Error(`Only ${property.available_tokens} tokens available for this property`);
      }

      // Use enhanced transaction engine
      const { TransactionEngine } = await import('./services/transactionEngine');
      await TransactionEngine.processInvestment({
        userId: user.id,
        propertyId,
        tokenAmount,
        totalCost
      });
    } catch (error) {
      console.error('Error investing in property:', error);
      throw error;
    }
  }
}

export class StakingAPI {
  static async getAllPools(): Promise<StakingPool[]> {
    if (!supabase) {
      console.log('Supabase not configured, using mock staking pools');
      return mockStakingPools;
    }

    try {
      const { data, error } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Supabase staking pools query error:', error);
        throw error;
      }

      // If no data from Supabase, return mock data
      if (!data || data.length === 0) {
        console.log('No staking pools in Supabase, using mock data');
        return mockStakingPools;
      }

      return data;
    } catch (error) {
      console.error('Error fetching staking pools:', error);
      console.log('Falling back to mock staking pools');
      return mockStakingPools;
    }
  }

  static async stakeTokens(poolId: string, amount: number): Promise<void> {
    if (!supabase) {
      console.log(`Mock staking: ${amount} tokens in pool ${poolId}`);
      return;
    }

    try {
      const { error } = await supabase.rpc('stake_tokens', {
        pool_id: poolId,
        stake_amount: amount
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error staking tokens:', error);
      throw error;
    }
  }
}

export class LearningAPI {
  static async getAllCourses(): Promise<Course[]> {
    if (!supabase) {
      return mockCourses;
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return mockCourses;
    }
  }

  static async getAllArticles(): Promise<Article[]> {
    if (!supabase) {
      return mockArticles;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      return mockArticles;
    }
  }
}

export class InvestmentAPI {
  static async getUserInvestments(userId: string): Promise<Investment[]> {
    if (!supabase) {
      // Return mock investments for demo
      return [
        {
          id: '1',
          user_id: userId,
          property_id: 'prop1',
          tokens_owned: 50,
          purchase_price: 5000,
          current_value: 5250,
          monthly_income: 125,
          total_return: 375,
          purchase_date: '2024-01-15',
          property: mockProperties[0]
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user investments:', error);
      return [];
    }
  }
}

export class NotificationAPI {
  static async getUserNotifications(userId: string) {
    if (!supabase) {
      // Return mock notifications when Supabase is not configured
      return [];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      return await DatabaseService.getUserNotifications(user.id);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }
}

export class PortfolioAPI {
  static async getUserPortfolio() {
    if (!supabase) {
      // Return mock portfolio when Supabase is not configured
      return {
        summary: {
          current_value: 0,
          total_rental_income: 0,
          properties_count: 0,
          total_return: 0
        }
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      return await DatabaseService.getUserPortfolioSummary(user.id);
    } catch (error) {
      console.error('Error fetching user portfolio:', error);
      return {
        summary: {
          current_value: 0,
          total_rental_income: 0,
          properties_count: 0,
          total_return: 0
        }
      };
    }
  }
}

export class TransactionAPI {
  static async getUserTransactions() {
    if (!supabase) {
      // Return mock transactions when Supabase is not configured
      return [];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      return await DatabaseService.getUserTransactions(user.id);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }
}
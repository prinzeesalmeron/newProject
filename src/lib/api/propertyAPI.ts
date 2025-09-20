import { supabase } from '../supabase';
import { DatabaseService } from '../database';
import type { Property } from '../supabase';

export class PropertyAPI {
  /**
   * Get all active properties with pagination
   */
  static async getAllProperties(
    page: number = 1,
    limit: number = 50, // Increase limit to reduce number of requests
    filters?: {
      property_type?: string;
      location?: string;
      min_price?: number;
      max_price?: number;
      min_yield?: number;
    }
  ): Promise<{ properties: Property[]; total: number; page: number; limit: number }> {
    if (!supabase) {
      console.log('Supabase not configured, using mock data');
      return {
        properties: [],
        total: 0,
        page,
        limit
      };
    }

    try {
      let query = supabase
        .from('properties')
        .select('*') // Remove count for faster queries
        .eq('status', 'active');

      // Apply filters
      if (filters) {
        if (filters.property_type) {
          query = query.eq('property_type', filters.property_type);
        }
        if (filters.location) {
          query = query.ilike('location', `%${filters.location}%`);
        }
        if (filters.min_price) {
          query = query.gte('price_per_token', filters.min_price);
        }
        if (filters.max_price) {
          query = query.lte('price_per_token', filters.max_price);
        }
        if (filters.min_yield) {
          query = query.gte('rental_yield', filters.min_yield);
        }
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        properties: data || [],
        total: data?.length || 0, // Use data length instead of count
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  /**
   * Get property by ID with detailed information
   */
  static async getPropertyById(id: string): Promise<Property & {
    valuations?: any[];
    rental_agreements?: any[];
    documents?: any[];
  } | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_valuations(*),
          rental_agreements(*),
          property_documents(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return property;
    } catch (error) {
      console.error('Error fetching property:', error);
      return null;
    }
  }

  /**
   * Create new property with validation
   */
  static async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    // Validate required fields
    if (!propertyData.title || !propertyData.location || !propertyData.image_url) {
      throw new Error('Title, location, and image URL are required');
    }
    
    if (propertyData.price_per_token <= 0 || propertyData.total_tokens <= 0) {
      throw new Error('Price per token and total tokens must be greater than 0');
    }
    
    if (propertyData.available_tokens > propertyData.total_tokens) {
      throw new Error('Available tokens cannot exceed total tokens');
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'property_created',
        resource_type: 'property',
        resource_id: data.id,
        new_values: propertyData
      });

      return data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  /**
   * Update property with audit trail
   */
  static async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Get current property for audit trail
      const { data: currentProperty } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('properties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'property_updated',
        resource_type: 'property',
        resource_id: id,
        old_values: currentProperty,
        new_values: updates
      });

      return data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  /**
   * Get property performance metrics
   */
  static async getPropertyPerformance(propertyId: string) {
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('rentals')
        .select('*')
        .eq('property_id', propertyId)
        .order('month_year', { ascending: true });

      if (error) throw error;

      const performance = {
        total_income: data?.reduce((sum, rental) => sum + rental.total_income, 0) || 0,
        total_expenses: data?.reduce((sum, rental) => sum + (rental.expenses || 0), 0) || 0,
        average_occupancy: data?.length > 0 
          ? data.reduce((sum, rental) => sum + (rental.occupancy_rate || 100), 0) / data.length 
          : 0,
        months_tracked: data?.length || 0
      };

      return {
        rentals: data || [],
        performance
      };
    } catch (error) {
      console.error('Error fetching property performance:', error);
      return null;
    }
  }

  /**
   * Add property valuation
   */
  static async addPropertyValuation(valuationData: {
    property_id: string;
    valuation_amount: number;
    valuation_method: string;
    valuator_name?: string;
    notes?: string;
    is_official?: boolean;
  }) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { data, error } = await supabase
        .from('property_valuations')
        .insert([{
          ...valuationData,
          valuation_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;

      // Update property current valuation if this is official
      if (valuationData.is_official) {
        await supabase
          .from('properties')
          .update({
            current_valuation: valuationData.valuation_amount,
            last_valuation_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', valuationData.property_id);
      }

      return data;
    } catch (error) {
      console.error('Error adding property valuation:', error);
      throw error;
    }
  }
}
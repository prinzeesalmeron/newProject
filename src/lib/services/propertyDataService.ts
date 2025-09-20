import { supabase } from '../supabase';
import { DatabaseService } from '../database';

export interface MLSProperty {
  mls_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  lot_size: number;
  year_built: number;
  property_type: string;
  listing_date: string;
  photos: string[];
  description: string;
  agent_info: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface ZillowData {
  zpid: string;
  address: string;
  zestimate: number;
  rent_zestimate: number;
  price_history: Array<{
    date: string;
    price: number;
    event: string;
  }>;
  comparable_sales: Array<{
    address: string;
    price: number;
    date: string;
    distance: number;
  }>;
  neighborhood_data: {
    walk_score: number;
    transit_score: number;
    bike_score: number;
    crime_rate: string;
    school_ratings: number[];
  };
}

export interface PropertyVerification {
  property_id: string;
  verification_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  title_search: {
    status: 'clear' | 'issues' | 'pending';
    report_url?: string;
    issues?: string[];
  };
  inspection: {
    status: 'scheduled' | 'completed' | 'issues';
    report_url?: string;
    inspector_name?: string;
    inspection_date?: string;
    issues?: string[];
  };
  appraisal: {
    status: 'ordered' | 'completed';
    appraised_value?: number;
    appraiser_name?: string;
    appraisal_date?: string;
    report_url?: string;
  };
  environmental: {
    status: 'clear' | 'issues' | 'pending';
    report_url?: string;
    issues?: string[];
  };
  legal_review: {
    status: 'clear' | 'issues' | 'pending';
    attorney_name?: string;
    review_date?: string;
    issues?: string[];
  };
}

/**
 * Property Data Service - Integrates with real estate APIs and manages property verification
 */
export class PropertyDataService {
  private static readonly MLS_API_KEY = import.meta.env.VITE_MLS_API_KEY;
  private static readonly ZILLOW_API_KEY = import.meta.env.VITE_ZILLOW_API_KEY;
  private static readonly RENTSPREE_API_KEY = import.meta.env.VITE_RENTSPREE_API_KEY;

  /**
   * Search MLS for properties
   */
  static async searchMLSProperties(criteria: {
    city?: string;
    state?: string;
    min_price?: number;
    max_price?: number;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
  }): Promise<MLSProperty[]> {
    try {
      if (!this.MLS_API_KEY) {
        console.warn('MLS API not configured, returning mock data');
        return this.getMockMLSData(criteria);
      }

      // In production, integrate with real MLS API
      const response = await fetch('/api/mls/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.MLS_API_KEY}`
        },
        body: JSON.stringify(criteria)
      });

      if (!response.ok) {
        throw new Error('MLS API request failed');
      }

      const data = await response.json();
      return data.properties || [];

    } catch (error) {
      console.error('MLS search failed:', error);
      return this.getMockMLSData(criteria);
    }
  }

  /**
   * Get Zillow property data
   */
  static async getZillowData(address: string): Promise<ZillowData | null> {
    try {
      if (!this.ZILLOW_API_KEY) {
        console.warn('Zillow API not configured, returning mock data');
        return this.getMockZillowData(address);
      }

      // In production, integrate with Zillow API
      const response = await fetch(`/api/zillow/property?address=${encodeURIComponent(address)}`, {
        headers: {
          'Authorization': `Bearer ${this.ZILLOW_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('Zillow API request failed');
      }

      return await response.json();

    } catch (error) {
      console.error('Zillow data fetch failed:', error);
      return this.getMockZillowData(address);
    }
  }

  /**
   * Import property from MLS
   */
  static async importPropertyFromMLS(mlsId: string): Promise<any> {
    try {
      // Get MLS property data
      const mlsData = await this.getMLSPropertyById(mlsId);
      if (!mlsData) {
        throw new Error('Property not found in MLS');
      }

      // Get additional market data
      const zillowData = await this.getZillowData(mlsData.address);
      
      // Calculate tokenization parameters
      const tokenizationData = await this.calculateTokenizationParameters(mlsData, zillowData);

      // Create property in database
      const property = await DatabaseService.createProperty({
        title: `${mlsData.address} - ${mlsData.city}, ${mlsData.state}`,
        description: mlsData.description,
        image_url: mlsData.photos[0] || 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
        location: `${mlsData.city}, ${mlsData.state}`,
        property_type: this.mapMLSPropertyType(mlsData.property_type),
        price_per_token: tokenizationData.price_per_token,
        total_tokens: tokenizationData.total_tokens,
        available_tokens: tokenizationData.total_tokens,
        rental_yield: tokenizationData.estimated_yield,
        projected_return: tokenizationData.projected_return,
        rating: 0, // Will be updated after verification
        features: this.extractFeatures(mlsData),
        is_yield_property: true,
        yield_percentage: `${tokenizationData.estimated_yield}%`,
        status: 'coming_soon' // Pending verification
      });

      // Store MLS data
      await this.storeMLS Data(property.id, mlsData);
      
      // Store Zillow data
      if (zillowData) {
        await this.storeZillowData(property.id, zillowData);
      }

      // Initialize verification process
      await this.initializePropertyVerification(property.id);

      return property;

    } catch (error) {
      console.error('Property import failed:', error);
      throw error;
    }
  }

  /**
   * Start property verification process
   */
  static async initializePropertyVerification(propertyId: string): Promise<PropertyVerification> {
    try {
      const verification: PropertyVerification = {
        property_id: propertyId,
        verification_status: 'pending',
        title_search: { status: 'pending' },
        inspection: { status: 'scheduled' },
        appraisal: { status: 'ordered' },
        environmental: { status: 'pending' },
        legal_review: { status: 'pending' }
      };

      // Store verification record
      if (supabase) {
        await supabase
          .from('property_verifications')
          .insert([verification]);
      }

      // Schedule verification tasks
      await this.scheduleVerificationTasks(propertyId);

      return verification;

    } catch (error) {
      console.error('Verification initialization failed:', error);
      throw error;
    }
  }

  /**
   * Update verification status
   */
  static async updateVerificationStatus(
    propertyId: string,
    verificationType: keyof Omit<PropertyVerification, 'property_id' | 'verification_status'>,
    status: any,
    additionalData?: any
  ): Promise<void> {
    try {
      if (!supabase) return;

      const updates = {
        [verificationType]: { ...status, ...additionalData },
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('property_verifications')
        .update(updates)
        .eq('property_id', propertyId);

      // Check if all verifications are complete
      await this.checkVerificationCompletion(propertyId);

    } catch (error) {
      console.error('Verification update failed:', error);
      throw error;
    }
  }

  /**
   * Get property market analysis
   */
  static async getMarketAnalysis(propertyId: string): Promise<any> {
    try {
      const property = await DatabaseService.getProperty(propertyId);
      const zillowData = await this.getZillowData(property.location);
      
      if (!zillowData) {
        return this.getMockMarketAnalysis(property);
      }

      return {
        current_value: zillowData.zestimate,
        rental_estimate: zillowData.rent_zestimate,
        price_history: zillowData.price_history,
        comparable_sales: zillowData.comparable_sales,
        neighborhood_score: {
          walkability: zillowData.neighborhood_data.walk_score,
          transit: zillowData.neighborhood_data.transit_score,
          bike_friendly: zillowData.neighborhood_data.bike_score,
          safety: zillowData.neighborhood_data.crime_rate,
          schools: zillowData.neighborhood_data.school_ratings
        },
        investment_metrics: {
          cap_rate: this.calculateCapRate(zillowData.zestimate, zillowData.rent_zestimate),
          cash_on_cash: this.calculateCashOnCash(property, zillowData),
          roi_projection: this.calculateROIProjection(property, zillowData)
        }
      };

    } catch (error) {
      console.error('Market analysis failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async getMockMLSData(criteria: any): Promise<MLSProperty[]> {
    // Mock MLS data for demonstration
    return [
      {
        mls_id: 'MLS123456',
        address: '123 Main Street',
        city: criteria.city || 'Austin',
        state: criteria.state || 'TX',
        zip_code: '78701',
        price: 450000,
        bedrooms: 3,
        bathrooms: 2,
        square_feet: 1800,
        lot_size: 0.25,
        year_built: 2018,
        property_type: 'Single Family',
        listing_date: new Date().toISOString(),
        photos: [
          'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
          'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
          'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg'
        ],
        description: 'Beautiful modern home in desirable neighborhood with updated kitchen and bathrooms.',
        agent_info: {
          name: 'Sarah Johnson',
          phone: '(555) 123-4567',
          email: 'sarah@realestate.com'
        }
      }
    ];
  }

  private static getMockZillowData(address: string): ZillowData {
    return {
      zpid: 'Z123456789',
      address,
      zestimate: 475000,
      rent_zestimate: 2800,
      price_history: [
        { date: '2023-01-01', price: 420000, event: 'Listed' },
        { date: '2023-02-15', price: 450000, event: 'Sold' }
      ],
      comparable_sales: [
        { address: '125 Main Street', price: 465000, date: '2023-12-01', distance: 0.1 },
        { address: '127 Main Street', price: 485000, date: '2023-11-15', distance: 0.2 }
      ],
      neighborhood_data: {
        walk_score: 85,
        transit_score: 70,
        bike_score: 75,
        crime_rate: 'Low',
        school_ratings: [8, 9, 7]
      }
    };
  }

  private static async getMLSPropertyById(mlsId: string): Promise<MLSProperty | null> {
    // Mock implementation - in production, query actual MLS API
    const mockData = await this.getMockMLSData({});
    return mockData.find(p => p.mls_id === mlsId) || null;
  }

  private static async calculateTokenizationParameters(mlsData: MLSProperty, zillowData: ZillowData | null) {
    const propertyValue = zillowData?.zestimate || mlsData.price;
    const monthlyRent = zillowData?.rent_zestimate || (propertyValue * 0.01); // 1% rule fallback
    
    // Calculate optimal token structure
    const totalTokens = Math.floor(propertyValue / 100); // $100 per token
    const annualRent = monthlyRent * 12;
    const estimatedYield = (annualRent / propertyValue) * 100;
    const projectedReturn = estimatedYield + 3; // Add appreciation estimate

    return {
      price_per_token: 100,
      total_tokens: totalTokens,
      estimated_yield: Math.round(estimatedYield * 10) / 10,
      projected_return: Math.round(projectedReturn * 10) / 10,
      monthly_rent: monthlyRent,
      annual_rent: annualRent
    };
  }

  private static mapMLSPropertyType(mlsType: string): string {
    const typeMap: Record<string, string> = {
      'Single Family Residential': 'Single Family',
      'Condominium': 'Multi Family',
      'Townhouse': 'Multi Family',
      'Multi-Family': 'Multi Family',
      'Commercial': 'Commercial',
      'Vacant Land': 'Commercial'
    };
    
    return typeMap[mlsType] || 'Single Family';
  }

  private static extractFeatures(mlsData: MLSProperty): string[] {
    const features: string[] = [];
    
    if (mlsData.bedrooms >= 3) features.push('Spacious Bedrooms');
    if (mlsData.bathrooms >= 2) features.push('Multiple Bathrooms');
    if (mlsData.square_feet >= 2000) features.push('Large Living Space');
    if (mlsData.lot_size >= 0.25) features.push('Large Lot');
    if (mlsData.year_built >= 2010) features.push('Modern Construction');
    
    return features;
  }

  private static async storeMLSData(propertyId: string, mlsData: MLSProperty): Promise<void> {
    if (!supabase) return;

    await supabase
      .from('property_mls_data')
      .insert([{
        property_id: propertyId,
        mls_id: mlsData.mls_id,
        raw_data: mlsData,
        last_updated: new Date().toISOString()
      }]);
  }

  private static async storeZillowData(propertyId: string, zillowData: ZillowData): Promise<void> {
    if (!supabase) return;

    await supabase
      .from('property_market_data')
      .insert([{
        property_id: propertyId,
        data_source: 'zillow',
        zpid: zillowData.zpid,
        zestimate: zillowData.zestimate,
        rent_zestimate: zillowData.rent_zestimate,
        raw_data: zillowData,
        last_updated: new Date().toISOString()
      }]);
  }

  private static async scheduleVerificationTasks(propertyId: string): Promise<void> {
    // In production, integrate with verification service providers
    console.log(`Scheduling verification tasks for property ${propertyId}`);
    
    // Mock scheduling
    setTimeout(async () => {
      await this.updateVerificationStatus(propertyId, 'title_search', { status: 'clear' });
    }, 2000);

    setTimeout(async () => {
      await this.updateVerificationStatus(propertyId, 'inspection', { 
        status: 'completed',
        inspector_name: 'John Smith',
        inspection_date: new Date().toISOString()
      });
    }, 5000);
  }

  private static async checkVerificationCompletion(propertyId: string): Promise<void> {
    if (!supabase) return;

    const { data: verification } = await supabase
      .from('property_verifications')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (!verification) return;

    // Check if all verifications are complete
    const allComplete = 
      verification.title_search?.status === 'clear' &&
      verification.inspection?.status === 'completed' &&
      verification.appraisal?.status === 'completed' &&
      verification.environmental?.status === 'clear' &&
      verification.legal_review?.status === 'clear';

    if (allComplete) {
      // Update property status to active
      await DatabaseService.updateProperty(propertyId, {
        status: 'active',
        rating: 4.5 // Set based on verification results
      });

      // Update verification status
      await supabase
        .from('property_verifications')
        .update({ verification_status: 'completed' })
        .eq('property_id', propertyId);
    }
  }

  private static calculateCapRate(propertyValue: number, monthlyRent: number): number {
    const annualRent = monthlyRent * 12;
    return (annualRent / propertyValue) * 100;
  }

  private static calculateCashOnCash(property: any, zillowData: ZillowData): number {
    // Simplified cash-on-cash calculation
    const annualRent = zillowData.rent_zestimate * 12;
    const downPayment = property.price_per_token * property.total_tokens * 0.25; // 25% down
    return (annualRent / downPayment) * 100;
  }

  private static calculateROIProjection(property: any, zillowData: ZillowData): number {
    const capRate = this.calculateCapRate(zillowData.zestimate, zillowData.rent_zestimate);
    const appreciationRate = 3; // 3% annual appreciation estimate
    return capRate + appreciationRate;
  }

  private static getMockMarketAnalysis(property: any) {
    return {
      current_value: property.price_per_token * property.total_tokens,
      rental_estimate: 2500,
      price_history: [
        { date: '2023-01-01', price: 420000, event: 'Listed' },
        { date: '2023-02-15', price: 450000, event: 'Sold' }
      ],
      comparable_sales: [
        { address: 'Nearby Property 1', price: 465000, date: '2023-12-01', distance: 0.1 },
        { address: 'Nearby Property 2', price: 485000, date: '2023-11-15', distance: 0.2 }
      ],
      neighborhood_score: {
        walkability: 85,
        transit: 70,
        bike_friendly: 75,
        safety: 'Low Crime',
        schools: [8, 9, 7]
      },
      investment_metrics: {
        cap_rate: 6.5,
        cash_on_cash: 8.2,
        roi_projection: 12.5
      }
    };
  }
}
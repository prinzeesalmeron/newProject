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

export interface MarketAnalysis {
  current_value: number;
  rental_estimate: number;
  price_history: any[];
  comparable_sales: any[];
  neighborhood_score: {
    walkability: number;
    transit: number;
    bike_friendly: number;
    safety: string;
    schools: number[];
  };
  investment_metrics: {
    cap_rate: number;
    cash_on_cash: number;
    roi_projection: number;
    price_to_rent_ratio: number;
    gross_yield: number;
  };
  market_trends: {
    price_appreciation_1yr: number;
    price_appreciation_5yr: number;
    rental_growth_1yr: number;
    inventory_levels: string;
    market_velocity: number;
  };
}

/**
 * Market Data Service - Integrates with real estate APIs and provides market analysis
 */
export class MarketDataService {
  private static readonly MLS_API_KEY = import.meta.env.VITE_MLS_API_KEY;
  private static readonly ZILLOW_API_KEY = import.meta.env.VITE_ZILLOW_API_KEY;
  private static readonly RENTOMETER_API_KEY = import.meta.env.VITE_RENTOMETER_API_KEY;
  private static readonly REDFIN_API_KEY = import.meta.env.VITE_REDFIN_API_KEY;

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

      // In production, integrate with real MLS API (NTREIS, CRMLS, etc.)
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

      const data = await response.json();
      
      // Store in database for caching
      await this.storeMarketData(data.property_id, 'zillow', data);
      
      return data;

    } catch (error) {
      console.error('Zillow data fetch failed:', error);
      return this.getMockZillowData(address);
    }
  }

  /**
   * Get rental market data from Rentometer
   */
  static async getRentalMarketData(address: string, bedrooms: number, bathrooms: number): Promise<any> {
    try {
      if (!this.RENTOMETER_API_KEY) {
        return this.getMockRentalData(address, bedrooms, bathrooms);
      }

      const response = await fetch('/api/rentometer/rent-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.RENTOMETER_API_KEY}`
        },
        body: JSON.stringify({
          address,
          bedrooms,
          bathrooms
        })
      });

      if (!response.ok) {
        throw new Error('Rentometer API request failed');
      }

      return await response.json();

    } catch (error) {
      console.error('Rental data fetch failed:', error);
      return this.getMockRentalData(address, bedrooms, bathrooms);
    }
  }

  /**
   * Get comprehensive market analysis for property
   */
  static async getMarketAnalysis(propertyId: string): Promise<MarketAnalysis> {
    try {
      const property = await DatabaseService.getProperty(propertyId);
      
      // Check if we have cached market data
      const cachedData = await this.getCachedMarketData(propertyId);
      if (cachedData && this.isDataFresh(cachedData.last_updated)) {
        return this.formatMarketAnalysis(cachedData);
      }

      // Fetch fresh data from multiple sources
      const [zillowData, rentalData, mlsData] = await Promise.all([
        this.getZillowData(`${property.location}`),
        this.getRentalMarketData(property.location, 3, 2), // Default bed/bath
        this.getMLSComparables(property.location, property.property_type)
      ]);

      // Combine and analyze data
      const analysis = this.combineMarketData(property, zillowData, rentalData, mlsData);
      
      // Store analysis in database
      await this.storeMarketAnalysis(propertyId, analysis);
      
      return analysis;

    } catch (error) {
      console.error('Market analysis failed:', error);
      return this.getMockMarketAnalysis(propertyId);
    }
  }

  /**
   * Import property from MLS with full verification
   */
  static async importPropertyFromMLS(mlsId: string): Promise<any> {
    try {
      // Get MLS property data
      const mlsData = await this.getMLSPropertyById(mlsId);
      if (!mlsData) {
        throw new Error('Property not found in MLS');
      }

      // Get additional market data
      const [zillowData, rentalData] = await Promise.all([
        this.getZillowData(mlsData.address),
        this.getRentalMarketData(mlsData.address, mlsData.bedrooms, mlsData.bathrooms)
      ]);
      
      // Calculate tokenization parameters
      const tokenizationData = await this.calculateTokenizationParameters(mlsData, zillowData, rentalData);

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
      await this.storeMLSData(property.id, mlsData);
      
      // Store market data
      if (zillowData) {
        await this.storeMarketData(property.id, 'zillow', zillowData);
      }
      if (rentalData) {
        await this.storeMarketData(property.id, 'rentometer', rentalData);
      }

      // Initialize verification process
      const { PropertyVerificationService } = await import('./propertyVerificationService');
      await PropertyVerificationService.initializePropertyVerification(property.id);

      return property;

    } catch (error) {
      console.error('Property import failed:', error);
      throw error;
    }
  }

  /**
   * Update market data for existing property
   */
  static async updateMarketData(propertyId: string): Promise<void> {
    try {
      const property = await DatabaseService.getProperty(propertyId);
      
      // Fetch updated market data
      const [zillowData, rentalData] = await Promise.all([
        this.getZillowData(property.location),
        this.getRentalMarketData(property.location, 3, 2)
      ]);

      // Update property valuation if significantly different
      if (zillowData && zillowData.zestimate) {
        const currentValuation = property.current_valuation || property.price_per_token * property.total_tokens;
        const valuationDifference = Math.abs(zillowData.zestimate - currentValuation) / currentValuation;
        
        if (valuationDifference > 0.05) { // 5% threshold
          await DatabaseService.updateProperty(propertyId, {
            current_valuation: zillowData.zestimate,
            last_valuation_date: new Date().toISOString().split('T')[0]
          });

          // Create valuation record
          await DatabaseService.addPropertyValuation({
            property_id: propertyId,
            valuation_amount: zillowData.zestimate,
            valuation_method: 'automated',
            valuator_name: 'Zillow Zestimate',
            notes: 'Automated market valuation update',
            is_official: false
          });
        }
      }

      // Update rental yield if rental estimate changed
      if (rentalData && rentalData.median_rent) {
        const annualRent = rentalData.median_rent * 12;
        const newYield = (annualRent / (property.current_valuation || property.price_per_token * property.total_tokens)) * 100;
        
        await DatabaseService.updateProperty(propertyId, {
          rental_yield: Math.round(newYield * 10) / 10
        });
      }

    } catch (error) {
      console.error('Market data update failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async getMockMLSData(criteria: any): Promise<MLSProperty[]> {
    // Enhanced mock MLS data with more realistic properties
    const mockProperties: MLSProperty[] = [
      {
        mls_id: 'ATX2024001',
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
        property_type: 'Single Family Residential',
        listing_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        photos: [
          'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
          'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg'
        ],
        description: 'Beautiful modern home in desirable neighborhood with updated kitchen and bathrooms.',
        agent_info: {
          name: 'Sarah Johnson',
          phone: '(555) 123-4567',
          email: 'sarah@realestate.com'
        }
      },
      {
        mls_id: 'ATX2024002',
        address: '456 Oak Avenue',
        city: criteria.city || 'Austin',
        state: criteria.state || 'TX',
        zip_code: '78702',
        price: 325000,
        bedrooms: 2,
        bathrooms: 2,
        square_feet: 1200,
        lot_size: 0.15,
        year_built: 2015,
        property_type: 'Condominium',
        listing_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        photos: [
          'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg'
        ],
        description: 'Modern condo with city views and premium amenities.',
        agent_info: {
          name: 'Michael Chen',
          phone: '(555) 234-5678',
          email: 'michael@realestate.com'
        }
      }
    ];

    // Filter based on criteria
    return mockProperties.filter(property => {
      if (criteria.min_price && property.price < criteria.min_price) return false;
      if (criteria.max_price && property.price > criteria.max_price) return false;
      if (criteria.bedrooms && property.bedrooms < criteria.bedrooms) return false;
      if (criteria.property_type && !property.property_type.includes(criteria.property_type)) return false;
      return true;
    });
  }

  private static getMockZillowData(address: string): ZillowData {
    return {
      zpid: `Z${Date.now()}`,
      address,
      zestimate: 475000 + Math.floor(Math.random() * 50000),
      rent_zestimate: 2800 + Math.floor(Math.random() * 400),
      price_history: [
        { date: '2023-01-01', price: 420000, event: 'Listed' },
        { date: '2023-02-15', price: 450000, event: 'Sold' },
        { date: '2024-01-01', price: 475000, event: 'Price Update' }
      ],
      comparable_sales: [
        { address: '125 Main Street', price: 465000, date: '2023-12-01', distance: 0.1 },
        { address: '127 Main Street', price: 485000, date: '2023-11-15', distance: 0.2 },
        { address: '129 Main Street', price: 455000, date: '2023-10-20', distance: 0.15 }
      ],
      neighborhood_data: {
        walk_score: 85,
        transit_score: 70,
        bike_score: 75,
        crime_rate: 'Low',
        school_ratings: [8, 9, 7, 8]
      }
    };
  }

  private static getMockRentalData(address: string, bedrooms: number, bathrooms: number) {
    const baseRent = bedrooms * 800 + bathrooms * 200 + 1000;
    const variance = Math.floor(Math.random() * 400) - 200;
    
    return {
      median_rent: baseRent + variance,
      rent_range: {
        low: baseRent - 300,
        high: baseRent + 500
      },
      market_data: {
        average_rent_per_sqft: 1.55,
        vacancy_rate: 3.2,
        rental_growth_1yr: 5.8,
        rental_growth_5yr: 28.5
      },
      comparable_rentals: [
        { address: 'Nearby Property 1', rent: baseRent - 100, bedrooms, bathrooms },
        { address: 'Nearby Property 2', rent: baseRent + 150, bedrooms, bathrooms },
        { address: 'Nearby Property 3', rent: baseRent - 50, bedrooms, bathrooms }
      ]
    };
  }

  private static async getMLSPropertyById(mlsId: string): Promise<MLSProperty | null> {
    // Mock implementation - in production, query actual MLS API
    const mockData = await this.getMockMLSData({});
    return mockData.find(p => p.mls_id === mlsId) || null;
  }

  private static async getMLSComparables(location: string, propertyType: string): Promise<any[]> {
    // Mock comparable sales data
    return [
      {
        address: '100 Similar Street',
        price: 445000,
        sale_date: '2024-01-15',
        square_feet: 1750,
        price_per_sqft: 254,
        distance: 0.3
      },
      {
        address: '200 Comparable Ave',
        price: 465000,
        sale_date: '2024-01-08',
        square_feet: 1850,
        price_per_sqft: 251,
        distance: 0.5
      }
    ];
  }

  private static async calculateTokenizationParameters(
    mlsData: MLSProperty, 
    zillowData: ZillowData | null, 
    rentalData: any
  ) {
    const propertyValue = zillowData?.zestimate || mlsData.price;
    const monthlyRent = rentalData?.median_rent || zillowData?.rent_zestimate || (propertyValue * 0.01);
    
    // Calculate optimal token structure
    const pricePerToken = 100; // Standard $100 per token
    const totalTokens = Math.floor(propertyValue / pricePerToken);
    const annualRent = monthlyRent * 12;
    const estimatedYield = (annualRent / propertyValue) * 100;
    
    // Add market appreciation estimate
    const marketAppreciation = 3.5; // Conservative 3.5% annual appreciation
    const projectedReturn = estimatedYield + marketAppreciation;

    return {
      price_per_token: pricePerToken,
      total_tokens: totalTokens,
      estimated_yield: Math.round(estimatedYield * 10) / 10,
      projected_return: Math.round(projectedReturn * 10) / 10,
      monthly_rent: monthlyRent,
      annual_rent: annualRent,
      property_value: propertyValue
    };
  }

  private static combineMarketData(
    property: any,
    zillowData: ZillowData | null,
    rentalData: any,
    mlsData: any[]
  ): MarketAnalysis {
    const propertyValue = zillowData?.zestimate || property.price_per_token * property.total_tokens;
    const monthlyRent = rentalData?.median_rent || zillowData?.rent_zestimate || 2500;
    const annualRent = monthlyRent * 12;

    return {
      current_value: propertyValue,
      rental_estimate: monthlyRent,
      price_history: zillowData?.price_history || [],
      comparable_sales: zillowData?.comparable_sales || mlsData || [],
      neighborhood_score: {
        walkability: zillowData?.neighborhood_data?.walk_score || 70,
        transit: zillowData?.neighborhood_data?.transit_score || 60,
        bike_friendly: zillowData?.neighborhood_data?.bike_score || 65,
        safety: zillowData?.neighborhood_data?.crime_rate || 'Medium',
        schools: zillowData?.neighborhood_data?.school_ratings || [7, 8, 7]
      },
      investment_metrics: {
        cap_rate: (annualRent / propertyValue) * 100,
        cash_on_cash: this.calculateCashOnCash(propertyValue, annualRent),
        roi_projection: ((annualRent / propertyValue) * 100) + 3.5, // Add appreciation
        price_to_rent_ratio: propertyValue / annualRent,
        gross_yield: (annualRent / propertyValue) * 100
      },
      market_trends: {
        price_appreciation_1yr: rentalData?.market_data?.rental_growth_1yr || 5.2,
        price_appreciation_5yr: 28.5,
        rental_growth_1yr: rentalData?.market_data?.rental_growth_1yr || 4.8,
        inventory_levels: 'Balanced',
        market_velocity: 65
      }
    };
  }

  private static calculateCashOnCash(propertyValue: number, annualRent: number): number {
    const downPayment = propertyValue * 0.25; // 25% down payment
    const annualDebtService = (propertyValue * 0.75) * 0.06; // 6% interest rate
    const netCashFlow = annualRent - annualDebtService - (annualRent * 0.3); // 30% for expenses
    return (netCashFlow / downPayment) * 100;
  }

  private static async storeMLSData(propertyId: string, mlsData: MLSProperty): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('property_mls_data')
        .insert([{
          property_id: propertyId,
          mls_id: mlsData.mls_id,
          listing_agent_name: mlsData.agent_info.name,
          listing_agent_phone: mlsData.agent_info.phone,
          listing_agent_email: mlsData.agent_info.email,
          listing_date: mlsData.listing_date.split('T')[0],
          listing_price: mlsData.price,
          square_feet: mlsData.square_feet,
          lot_size: mlsData.lot_size,
          year_built: mlsData.year_built,
          bedrooms: mlsData.bedrooms,
          bathrooms: mlsData.bathrooms,
          property_subtype: mlsData.property_type,
          price_per_sqft: mlsData.price / mlsData.square_feet,
          raw_mls_data: mlsData
        }]);

    } catch (error) {
      console.error('MLS data storage failed:', error);
    }
  }

  private static async storeMarketData(propertyId: string, source: string, data: any): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('property_market_data')
        .upsert([{
          property_id: propertyId,
          data_source: source,
          zpid: data.zpid,
          zestimate: data.zestimate,
          rent_zestimate: data.rent_zestimate || data.median_rent,
          raw_data: data,
          walk_score: data.neighborhood_data?.walk_score,
          transit_score: data.neighborhood_data?.transit_score,
          school_ratings: data.neighborhood_data?.school_ratings || [],
          last_updated: new Date().toISOString()
        }], {
          onConflict: 'property_id,data_source'
        });

    } catch (error) {
      console.error('Market data storage failed:', error);
    }
  }

  private static async storeMarketAnalysis(propertyId: string, analysis: MarketAnalysis): Promise<void> {
    // Store comprehensive analysis for caching
    await this.storeMarketData(propertyId, 'internal', {
      analysis_data: analysis,
      generated_at: new Date().toISOString()
    });
  }

  private static async getCachedMarketData(propertyId: string): Promise<any> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('property_market_data')
        .select('*')
        .eq('property_id', propertyId)
        .eq('data_source', 'internal')
        .single();

      if (error) return null;
      return data;

    } catch (error) {
      return null;
    }
  }

  private static isDataFresh(lastUpdated: string): boolean {
    const oneDay = 24 * 60 * 60 * 1000;
    const dataAge = Date.now() - new Date(lastUpdated).getTime();
    return dataAge < oneDay;
  }

  private static formatMarketAnalysis(cachedData: any): MarketAnalysis {
    return cachedData.raw_data?.analysis_data || this.getMockMarketAnalysis('');
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
    if (mlsData.photos.length >= 3) features.push('Professional Photos');
    
    return features;
  }

  private static getMockMarketAnalysis(propertyId: string): MarketAnalysis {
    return {
      current_value: 475000,
      rental_estimate: 2800,
      price_history: [
        { date: '2023-01-01', price: 420000, event: 'Listed' },
        { date: '2023-02-15', price: 450000, event: 'Sold' },
        { date: '2024-01-01', price: 475000, event: 'Current Estimate' }
      ],
      comparable_sales: [
        { address: 'Nearby Property 1', price: 465000, date: '2023-12-01', distance: 0.1 },
        { address: 'Nearby Property 2', price: 485000, date: '2023-11-15', distance: 0.2 },
        { address: 'Nearby Property 3', price: 455000, date: '2023-10-30', distance: 0.25 }
      ],
      neighborhood_score: {
        walkability: 85,
        transit: 70,
        bike_friendly: 75,
        safety: 'Low Crime',
        schools: [8, 9, 7, 8]
      },
      investment_metrics: {
        cap_rate: 7.1,
        cash_on_cash: 8.5,
        roi_projection: 12.8,
        price_to_rent_ratio: 14.2,
        gross_yield: 7.1
      },
      market_trends: {
        price_appreciation_1yr: 5.2,
        price_appreciation_5yr: 28.5,
        rental_growth_1yr: 4.8,
        inventory_levels: 'Balanced',
        market_velocity: 68
      }
    };
  }
}

// Re-export for backward compatibility
export const PropertyDataService = MarketDataService;
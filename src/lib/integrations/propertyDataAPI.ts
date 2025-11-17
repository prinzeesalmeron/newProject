import { supabase } from '../supabase';

/**
 * Property Data API Integration - Real estate data aggregation
 * Integrates: Zillow API, Realtor.com, Redfin, Rentometer
 */

export interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  propertyType: 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  zestimate?: number;
  redfin_estimate?: number;
  realtor_estimate?: number;
  averageEstimate?: number;
  rentEstimate?: number;
  priceHistory?: Array<{
    date: string;
    price: number;
    event: string;
  }>;
  taxAssessment?: number;
  propertyTaxes?: number;
  hoaFees?: number;
  images?: string[];
  description?: string;
  features?: string[];
  schoolRatings?: Array<{
    name: string;
    rating: number;
    distance: number;
  }>;
  lastUpdated: string;
}

export interface RentalMarketData {
  medianRent: number;
  rentRange: { min: number; max: number };
  vacancyRate: number;
  rentalYield: number;
  marketTrend: 'increasing' | 'stable' | 'decreasing';
  comparableRentals: Array<{
    address: string;
    rent: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
  }>;
}

export class PropertyDataService {
  private static readonly ZILLOW_API_KEY = import.meta.env.VITE_ZILLOW_API_KEY;
  private static readonly REDFIN_API_KEY = import.meta.env.VITE_REDFIN_API_KEY;
  private static readonly REALTOR_API_KEY = import.meta.env.VITE_REALTOR_API_KEY;
  private static readonly RENTOMETER_API_KEY = import.meta.env.VITE_RENTOMETER_API_KEY;

  /**
   * Get comprehensive property data from multiple sources
   */
  static async getPropertyData(address: string): Promise<PropertyDetails> {
    try {
      const [zillowData, redfinData, realtorData] = await Promise.allSettled([
        this.getZillowData(address),
        this.getRedfinData(address),
        this.getRealtorData(address)
      ]);

      const merged = this.mergePropertyData(
        zillowData.status === 'fulfilled' ? zillowData.value : null,
        redfinData.status === 'fulfilled' ? redfinData.value : null,
        realtorData.status === 'fulfilled' ? realtorData.value : null
      );

      await this.cachePropertyData(address, merged);

      return merged;
    } catch (error) {
      console.error('Property data fetch failed:', error);

      const cached = await this.getCachedPropertyData(address);
      if (cached) return cached;

      throw error;
    }
  }

  /**
   * Get rental market analysis
   */
  static async getRentalMarketData(
    address: string,
    bedrooms: number,
    bathrooms: number,
    squareFeet: number
  ): Promise<RentalMarketData> {
    try {
      if (!this.RENTOMETER_API_KEY) {
        return this.mockRentalData();
      }

      const response = await fetch('https://api.rentometer.com/v1/summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RENTOMETER_API_KEY}`,
          'Content-Type': 'application/json'
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

      const data = await response.json();

      return {
        medianRent: data.median_rent,
        rentRange: {
          min: data.percentile_25,
          max: data.percentile_75
        },
        vacancyRate: data.vacancy_rate || 5.0,
        rentalYield: this.calculateRentalYield(data.median_rent, squareFeet),
        marketTrend: data.trend || 'stable',
        comparableRentals: data.comparables || []
      };
    } catch (error) {
      console.error('Rental market data fetch failed:', error);
      return this.mockRentalData();
    }
  }

  /**
   * Zillow API integration
   */
  private static async getZillowData(address: string): Promise<Partial<PropertyDetails>> {
    if (!this.ZILLOW_API_KEY) {
      return this.mockZillowData(address);
    }

    try {
      const response = await fetch(`https://api.bridgedataoutput.com/api/v2/zestimates_v2/zestimates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.ZILLOW_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Zillow API request failed');
      }

      const data = await response.json();

      return {
        address: data.address?.streetAddress,
        city: data.address?.city,
        state: data.address?.state,
        zipCode: data.address?.zipcode,
        latitude: data.latitude,
        longitude: data.longitude,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        squareFeet: data.livingArea,
        yearBuilt: data.yearBuilt,
        zestimate: data.zestimate,
        priceHistory: data.priceHistory,
        images: data.images,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Zillow API error:', error);
      return this.mockZillowData(address);
    }
  }

  /**
   * Redfin API integration
   */
  private static async getRedfinData(address: string): Promise<Partial<PropertyDetails>> {
    if (!this.REDFIN_API_KEY) {
      return this.mockRedfinData(address);
    }

    try {
      // Redfin API integration
      // Note: Redfin doesn't have a public API, this would use their partner API
      const response = await fetch(`https://api.redfin.com/v1/properties/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.REDFIN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error('Redfin API request failed');
      }

      const data = await response.json();

      return {
        redfin_estimate: data.estimate,
        taxAssessment: data.taxAssessment,
        propertyTaxes: data.propertyTaxes,
        hoaFees: data.hoaFees,
        features: data.features,
        schoolRatings: data.schools
      };
    } catch (error) {
      console.error('Redfin API error:', error);
      return this.mockRedfinData(address);
    }
  }

  /**
   * Realtor.com API integration
   */
  private static async getRealtorData(address: string): Promise<Partial<PropertyDetails>> {
    if (!this.REALTOR_API_KEY) {
      return this.mockRealtorData(address);
    }

    try {
      const response = await fetch('https://realtor-com4.p.rapidapi.com/properties/v3/detail', {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.REALTOR_API_KEY,
          'X-RapidAPI-Host': 'realtor-com4.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error('Realtor API request failed');
      }

      const data = await response.json();

      return {
        realtor_estimate: data.estimate,
        description: data.description,
        lotSize: data.lot_size,
        propertyType: this.normalizePropertyType(data.property_type)
      };
    } catch (error) {
      console.error('Realtor API error:', error);
      return this.mockRealtorData(address);
    }
  }

  /**
   * Merge data from multiple sources
   */
  private static mergePropertyData(
    zillow: Partial<PropertyDetails> | null,
    redfin: Partial<PropertyDetails> | null,
    realtor: Partial<PropertyDetails> | null
  ): PropertyDetails {
    const estimates = [
      zillow?.zestimate,
      redfin?.redfin_estimate,
      realtor?.realtor_estimate
    ].filter(Boolean) as number[];

    const averageEstimate = estimates.length > 0
      ? estimates.reduce((a, b) => a + b, 0) / estimates.length
      : undefined;

    return {
      address: zillow?.address || redfin?.address || realtor?.address || '',
      city: zillow?.city || redfin?.city || realtor?.city || '',
      state: zillow?.state || redfin?.state || realtor?.state || '',
      zipCode: zillow?.zipCode || redfin?.zipCode || realtor?.zipCode || '',
      latitude: zillow?.latitude,
      longitude: zillow?.longitude,
      propertyType: zillow?.propertyType || realtor?.propertyType || 'single_family',
      bedrooms: zillow?.bedrooms,
      bathrooms: zillow?.bathrooms,
      squareFeet: zillow?.squareFeet,
      lotSize: redfin?.lotSize || realtor?.lotSize,
      yearBuilt: zillow?.yearBuilt,
      zestimate: zillow?.zestimate,
      redfin_estimate: redfin?.redfin_estimate,
      realtor_estimate: realtor?.realtor_estimate,
      averageEstimate,
      priceHistory: zillow?.priceHistory,
      taxAssessment: redfin?.taxAssessment,
      propertyTaxes: redfin?.propertyTaxes,
      hoaFees: redfin?.hoaFees,
      images: zillow?.images,
      description: realtor?.description,
      features: redfin?.features,
      schoolRatings: redfin?.schoolRatings,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Cache property data in database
   */
  private static async cachePropertyData(address: string, data: PropertyDetails): Promise<void> {
    try {
      await supabase
        .from('property_data_cache')
        .upsert({
          address: address.toLowerCase(),
          data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'address'
        });
    } catch (error) {
      console.error('Failed to cache property data:', error);
    }
  }

  /**
   * Get cached property data
   */
  private static async getCachedPropertyData(address: string): Promise<PropertyDetails | null> {
    try {
      const { data, error } = await supabase
        .from('property_data_cache')
        .select('data')
        .eq('address', address.toLowerCase())
        .single();

      if (error || !data) return null;

      const cached = data.data as PropertyDetails;
      const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

      if (cacheAge > ONE_WEEK) return null;

      return cached;
    } catch (error) {
      return null;
    }
  }

  // Helper methods

  private static normalizePropertyType(type: string): PropertyDetails['propertyType'] {
    const normalized = type.toLowerCase();
    if (normalized.includes('single')) return 'single_family';
    if (normalized.includes('multi')) return 'multi_family';
    if (normalized.includes('condo')) return 'condo';
    if (normalized.includes('town')) return 'townhouse';
    if (normalized.includes('commercial')) return 'commercial';
    return 'single_family';
  }

  private static calculateRentalYield(monthlyRent: number, squareFeet: number): number {
    const annualRent = monthlyRent * 12;
    const estimatedValue = squareFeet * 200; // Rough estimate $200/sqft
    return (annualRent / estimatedValue) * 100;
  }

  // Mock data methods for development

  private static mockZillowData(address: string): Partial<PropertyDetails> {
    return {
      address,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      yearBuilt: 2015,
      zestimate: 450000,
      images: ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg']
    };
  }

  private static mockRedfinData(address: string): Partial<PropertyDetails> {
    return {
      redfin_estimate: 455000,
      taxAssessment: 420000,
      propertyTaxes: 5600,
      hoaFees: 250,
      features: ['Hardwood Floors', 'Updated Kitchen', 'Central AC']
    };
  }

  private static mockRealtorData(address: string): Partial<PropertyDetails> {
    return {
      realtor_estimate: 448000,
      description: 'Beautiful single family home in excellent condition',
      propertyType: 'single_family'
    };
  }

  private static mockRentalData(): RentalMarketData {
    return {
      medianRent: 2400,
      rentRange: { min: 2100, max: 2700 },
      vacancyRate: 4.5,
      rentalYield: 6.4,
      marketTrend: 'increasing',
      comparableRentals: []
    };
  }
}

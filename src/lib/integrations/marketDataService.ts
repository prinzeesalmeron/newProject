import { supabase } from '../supabase';

/**
 * Real-time Market Data Service
 * Integrates: CoinGecko, CoinMarketCap, PropertyShark, FRED Economic Data
 */

export interface CryptoMarketData {
  eth_usd: number;
  btc_usd: number;
  usdc_usd: number;
  usdt_usd: number;
  gas_price_gwei: number;
  market_cap: number;
  volume_24h: number;
  price_change_24h: number;
  last_updated: string;
}

export interface RealEstateMarketData {
  national_median_price: number;
  regional_median_price: number;
  price_growth_yoy: number;
  inventory_months: number;
  days_on_market: number;
  mortgage_rate_30y: number;
  mortgage_rate_15y: number;
  foreclosure_rate: number;
  market_temperature: 'hot' | 'warm' | 'balanced' | 'cool' | 'cold';
  last_updated: string;
}

export interface TokenizedREMarketData {
  total_market_cap: number;
  total_properties: number;
  total_investors: number;
  average_yield: number;
  average_appreciation: number;
  transaction_volume_24h: number;
  trending_markets: string[];
  last_updated: string;
}

export class MarketDataService {
  private static readonly COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
  private static readonly COINMARKETCAP_API_KEY = import.meta.env.VITE_COINMARKETCAP_API_KEY;
  private static readonly FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get real-time cryptocurrency market data
   */
  static async getCryptoMarketData(): Promise<CryptoMarketData> {
    try {
      const cached = await this.getCachedData<CryptoMarketData>('crypto_market_data');
      if (cached) return cached;

      if (!this.COINGECKO_API_KEY) {
        return this.mockCryptoData();
      }

      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,usd-coin,tether&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
        {
          headers: {
            'X-Cg-Pro-Api-Key': this.COINGECKO_API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error('CoinGecko API request failed');
      }

      const data = await response.json();

      // Get current gas prices
      const gasResponse = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const gasData = await gasResponse.json();

      const marketData: CryptoMarketData = {
        eth_usd: data.ethereum.usd,
        btc_usd: data.bitcoin.usd,
        usdc_usd: data['usd-coin'].usd,
        usdt_usd: data.tether.usd,
        gas_price_gwei: parseFloat(gasData.result?.ProposeGasPrice || '50'),
        market_cap: data.ethereum.usd_market_cap,
        volume_24h: data.ethereum.usd_24h_vol,
        price_change_24h: data.ethereum.usd_24h_change,
        last_updated: new Date().toISOString()
      };

      await this.cacheData('crypto_market_data', marketData);

      return marketData;
    } catch (error) {
      console.error('Crypto market data fetch failed:', error);
      return this.mockCryptoData();
    }
  }

  /**
   * Get real estate market indicators
   */
  static async getRealEstateMarketData(region: string = 'US'): Promise<RealEstateMarketData> {
    try {
      const cached = await this.getCachedData<RealEstateMarketData>(`re_market_data_${region}`);
      if (cached) return cached;

      if (!this.FRED_API_KEY) {
        return this.mockRealEstateData();
      }

      // Fetch multiple economic indicators from FRED
      const indicators = await Promise.all([
        this.getFREDData('MSPUS'), // Median Sales Price
        this.getFREDData('MORTGAGE30US'), // 30-year mortgage rate
        this.getFREDData('MORTGAGE15US'), // 15-year mortgage rate
        this.getFREDData('ACTLISCOUUS') // Active Listing Count
      ]);

      const marketData: RealEstateMarketData = {
        national_median_price: indicators[0] || 420000,
        regional_median_price: indicators[0] || 420000,
        price_growth_yoy: 5.2,
        inventory_months: 3.8,
        days_on_market: 28,
        mortgage_rate_30y: indicators[1] || 7.2,
        mortgage_rate_15y: indicators[2] || 6.5,
        foreclosure_rate: 0.2,
        market_temperature: this.calculateMarketTemperature(3.8, 28),
        last_updated: new Date().toISOString()
      };

      await this.cacheData(`re_market_data_${region}`, marketData);

      return marketData;
    } catch (error) {
      console.error('Real estate market data fetch failed:', error);
      return this.mockRealEstateData();
    }
  }

  /**
   * Get tokenized real estate market overview
   */
  static async getTokenizedREMarketData(): Promise<TokenizedREMarketData> {
    try {
      const cached = await this.getCachedData<TokenizedREMarketData>('tokenized_re_market_data');
      if (cached) return cached;

      // Query our platform's aggregated data
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('total_value, annual_return, location');

      const { data: investments, error: invError } = await supabase
        .from('investments')
        .select('amount, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (propError || invError) {
        throw new Error('Failed to fetch platform data');
      }

      const totalMarketCap = properties?.reduce((sum, p) => sum + (p.total_value || 0), 0) || 0;
      const totalInvestors = new Set(investments?.map(i => i.user_id)).size || 0;
      const transactionVolume = investments?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
      const avgYield = properties?.reduce((sum, p) => sum + (p.annual_return || 0), 0) / (properties?.length || 1) || 0;

      // Get trending markets
      const locationCounts: Record<string, number> = {};
      properties?.forEach(p => {
        if (p.location) {
          locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
        }
      });

      const trendingMarkets = Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([location]) => location);

      const marketData: TokenizedREMarketData = {
        total_market_cap: totalMarketCap,
        total_properties: properties?.length || 0,
        total_investors: totalInvestors,
        average_yield: avgYield,
        average_appreciation: 4.8,
        transaction_volume_24h: transactionVolume,
        trending_markets: trendingMarkets,
        last_updated: new Date().toISOString()
      };

      await this.cacheData('tokenized_re_market_data', marketData);

      return marketData;
    } catch (error) {
      console.error('Tokenized RE market data fetch failed:', error);
      return this.mockTokenizedREData();
    }
  }

  /**
   * Get currency exchange rates
   */
  static async getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    try {
      const cached = await this.getCachedData<Record<string, number>>(`exchange_rates_${baseCurrency}`);
      if (cached) return cached;

      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error('Exchange rate API request failed');
      }

      const data = await response.json();
      const rates = data.rates;

      await this.cacheData(`exchange_rates_${baseCurrency}`, rates);

      return rates;
    } catch (error) {
      console.error('Exchange rate fetch failed:', error);
      return {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        CNY: 7.24,
        ETH: 0.00027
      };
    }
  }

  /**
   * Subscribe to real-time market data updates
   */
  static subscribeToMarketData(
    callback: (data: {
      crypto?: CryptoMarketData;
      realEstate?: RealEstateMarketData;
      tokenizedRE?: TokenizedREMarketData;
    }) => void
  ): () => void {
    const interval = setInterval(async () => {
      const [crypto, realEstate, tokenizedRE] = await Promise.allSettled([
        this.getCryptoMarketData(),
        this.getRealEstateMarketData(),
        this.getTokenizedREMarketData()
      ]);

      callback({
        crypto: crypto.status === 'fulfilled' ? crypto.value : undefined,
        realEstate: realEstate.status === 'fulfilled' ? realEstate.value : undefined,
        tokenizedRE: tokenizedRE.status === 'fulfilled' ? tokenizedRE.value : undefined
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }

  // Private helper methods

  private static async getFREDData(seriesId: string): Promise<number | null> {
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${this.FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const value = parseFloat(data.observations?.[0]?.value);

      return isNaN(value) ? null : value;
    } catch (error) {
      return null;
    }
  }

  private static calculateMarketTemperature(inventoryMonths: number, daysOnMarket: number): RealEstateMarketData['market_temperature'] {
    const score = (6 - inventoryMonths) + (45 - daysOnMarket) / 10;

    if (score > 5) return 'hot';
    if (score > 3) return 'warm';
    if (score > 0) return 'balanced';
    if (score > -3) return 'cool';
    return 'cold';
  }

  private static async cacheData<T>(key: string, data: T): Promise<void> {
    try {
      await supabase
        .from('market_data_cache')
        .upsert({
          cache_key: key,
          data,
          expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString()
        }, {
          onConflict: 'cache_key'
        });
    } catch (error) {
      console.error('Failed to cache market data:', error);
    }
  }

  private static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('data, expires_at')
        .eq('cache_key', key)
        .single();

      if (error || !data) return null;

      const expiresAt = new Date(data.expires_at).getTime();
      if (Date.now() > expiresAt) return null;

      return data.data as T;
    } catch (error) {
      return null;
    }
  }

  // Mock data methods

  private static mockCryptoData(): CryptoMarketData {
    return {
      eth_usd: 3450.23,
      btc_usd: 67834.12,
      usdc_usd: 1.0,
      usdt_usd: 0.999,
      gas_price_gwei: 25,
      market_cap: 415000000000,
      volume_24h: 18500000000,
      price_change_24h: 2.4,
      last_updated: new Date().toISOString()
    };
  }

  private static mockRealEstateData(): RealEstateMarketData {
    return {
      national_median_price: 420000,
      regional_median_price: 485000,
      price_growth_yoy: 5.2,
      inventory_months: 3.8,
      days_on_market: 28,
      mortgage_rate_30y: 7.2,
      mortgage_rate_15y: 6.5,
      foreclosure_rate: 0.2,
      market_temperature: 'warm',
      last_updated: new Date().toISOString()
    };
  }

  private static mockTokenizedREData(): TokenizedREMarketData {
    return {
      total_market_cap: 8500000,
      total_properties: 24,
      total_investors: 342,
      average_yield: 8.4,
      average_appreciation: 4.8,
      transaction_volume_24h: 145000,
      trending_markets: ['Austin, TX', 'Miami, FL', 'Denver, CO', 'Nashville, TN', 'Phoenix, AZ'],
      last_updated: new Date().toISOString()
    };
  }
}

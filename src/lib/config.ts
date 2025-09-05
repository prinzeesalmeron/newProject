// Centralized configuration management
interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  supabase: {
    url: string | null;
    anonKey: string | null;
    configured: boolean;
  };
  features: {
    [key: string]: boolean;
  };
  limits: {
    investment: {
      min: number;
      max: number;
    };
    staking: {
      min: number;
      max: number;
    };
    pagination: {
      default: number;
      max: number;
    };
  };
}

const createConfig = (): AppConfig => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    app: {
      name: 'BlockEstate',
      version: '1.0.0',
      environment: (import.meta.env.MODE as any) || 'development'
    },
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      retryAttempts: 3
    },
    supabase: {
      url: supabaseUrl || null,
      anonKey: supabaseAnonKey || null,
      configured: !!(supabaseUrl && supabaseAnonKey)
    },
    features: {
      darkMode: true,
      notifications: true,
      analytics: true,
      governance: true,
      staking: true,
      walletConnect: true,
      mockMode: !supabaseUrl || !supabaseAnonKey
    },
    limits: {
      investment: {
        min: 10,
        max: 100000
      },
      staking: {
        min: 100,
        max: 1000000
      },
      pagination: {
        default: 20,
        max: 100
      }
    }
  };
};

export const config = createConfig();

// Helper functions
export const isFeatureEnabled = (feature: string): boolean => {
  return config.features[feature] ?? false;
};

export const isMockMode = (): boolean => {
  return config.features.mockMode;
};

export const isDevelopment = (): boolean => {
  return config.app.environment === 'development';
};

export const isProduction = (): boolean => {
  return config.app.environment === 'production';
};
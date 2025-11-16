const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    stripe: ServiceHealth;
    supabase: ServiceHealth;
  };
  uptime: number;
  version: string;
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

const startTime = Date.now();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkStripe(),
      checkSupabase(),
    ]);

    const [dbCheck, stripeCheck, supabaseCheck] = checks;

    const services = {
      database: getServiceHealth(dbCheck),
      stripe: getServiceHealth(stripeCheck),
      supabase: getServiceHealth(supabaseCheck),
    };

    const overallStatus = determineOverallStatus(services);

    const health: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: Deno.env.get('APP_VERSION') || '1.0.0',
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Simple query to check database connectivity
    const { error } = await supabase
      .from('audit_logs')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'down',
        responseTime,
        error: error.message,
      };
    }

    return {
      status: responseTime < 1000 ? 'up' : 'degraded',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function checkStripe(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) {
      return {
        status: 'down',
        error: 'Stripe key not configured',
      };
    }

    // Just check if key is valid format
    const isValid = stripeKey.startsWith('sk_');

    return {
      status: isValid ? 'up' : 'down',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function checkSupabase(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!supabaseUrl) {
      return {
        status: 'down',
        error: 'Supabase URL not configured',
      };
    }

    // Check if Supabase is reachable
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
      },
    });

    const responseTime = Date.now() - startTime;

    return {
      status: response.ok ? 'up' : 'degraded',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

function getServiceHealth(
  result: PromiseSettledResult<ServiceHealth>
): ServiceHealth {
  if (result.status === 'fulfilled') {
    return result.value;
  }

  return {
    status: 'down',
    error: result.reason?.message || 'Unknown error',
  };
}

function determineOverallStatus(services: {
  [key: string]: ServiceHealth;
}): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map((s) => s.status);

  if (statuses.every((s) => s === 'up')) {
    return 'healthy';
  }

  if (statuses.some((s) => s === 'down')) {
    return 'unhealthy';
  }

  return 'degraded';
}

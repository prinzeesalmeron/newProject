import { createClient } from 'npm:@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
  endpoint: string;
}

export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get identifier (user ID or IP address)
    const authHeader = request.headers.get('authorization');
    let identifier: string;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      identifier = user?.id || getClientIp(request);
    } else {
      identifier = getClientIp(request);
    }

    // Check rate limit using database function
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: config.endpoint,
      p_max_tokens: config.maxTokens,
      p_refill_rate: config.refillRate
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true }; // Fail open to avoid blocking legitimate requests
    }

    if (!data) {
      // Log security event for rate limit exceeded
      await logSecurityEvent(
        supabase,
        'rate_limit_exceeded',
        'warning',
        identifier,
        getClientIp(request),
        `Rate limit exceeded for endpoint: ${config.endpoint}`
      );

      return {
        allowed: false,
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // Fail open on errors
    return { allowed: true };
  }
}

function getClientIp(request: Request): string {
  // Try multiple headers in order of preference
  const headers = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip', // Nginx
    'x-forwarded-for', // Standard
    'x-client-ip'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can be a comma-separated list
      return value.split(',')[0].trim();
    }
  }

  return 'unknown';
}

async function logSecurityEvent(
  supabase: any,
  eventType: string,
  severity: 'info' | 'warning' | 'critical',
  userId: string | null,
  ipAddress: string,
  description: string
) {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_severity: severity,
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_description: description,
      p_metadata: {}
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

export function createRateLimitResponse(error: string): Response {
  return new Response(
    JSON.stringify({
      error,
      retry_after: 60 // seconds
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    console.log('API Request:', { method, path, url: req.url })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase configuration missing',
          debug: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceKey: !!supabaseServiceKey
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    // Import Supabase client
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Remove the /functions/v1 prefix if present for routing
    const cleanPath = path.replace('/functions/v1/api', '').replace('/api', '') || '/'

    console.log('Clean path:', cleanPath)

    // Health check endpoint
    if (cleanPath === '/health' || cleanPath === '/' || cleanPath === '') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'BlockEstate API is running',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          endpoints: [
            'GET /properties - Get all properties',
            'GET /properties/{id} - Get specific property',
            'GET /users - Get all users',
            'GET /transactions?user_id={id} - Get transactions',
            'GET /staking-pools - Get staking pools',
            'GET /shares?user_id={id} - Get user shares',
            'GET /analytics/overview - Get platform analytics'
          ]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Properties endpoints
    if (cleanPath === '/properties' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Properties query error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0,
          endpoint: '/properties'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (cleanPath.startsWith('/properties/') && method === 'GET') {
      const propertyId = cleanPath.split('/')[2]
      
      const { data, error } = await supabaseClient
        .from('properties')
        .select(`
          *,
          property_valuations(*),
          rental_agreements(*),
          property_documents(*)
        `)
        .eq('id', propertyId)
        .single()

      if (error) {
        console.error('Property query error:', error)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Property not found',
            property_id: propertyId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          },
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data,
          endpoint: `/properties/${propertyId}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Users endpoint
    if (cleanPath === '/users' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, email, full_name, role, kyc_status, created_at, total_portfolio_value, block_balance')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Users query error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0,
          endpoint: '/users'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Transactions endpoint
    if (cleanPath === '/transactions' && method === 'GET') {
      const userId = url.searchParams.get('user_id')
      
      let query = supabaseClient
        .from('transactions')
        .select(`
          *,
          properties(title, location)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Transactions query error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0,
          endpoint: '/transactions',
          filters: userId ? { user_id: userId } : null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Staking pools endpoint
    if (cleanPath === '/staking-pools' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('staking_pools')
        .select('*')
        .eq('is_active', true)
        .order('apy', { ascending: false })

      if (error) {
        console.error('Staking pools query error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0,
          endpoint: '/staking-pools'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Shares endpoint
    if (cleanPath === '/shares' && method === 'GET') {
      const userId = url.searchParams.get('user_id')
      
      let query = supabaseClient
        .from('shares')
        .select(`
          *,
          properties(title, location, image_url, property_type),
          users(email, full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Shares query error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0,
          endpoint: '/shares',
          filters: userId ? { user_id: userId } : null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Analytics endpoint
    if (cleanPath === '/analytics/overview' && method === 'GET') {
      const [
        { data: properties, count: propertiesCount },
        { data: users, count: usersCount },
        { data: transactions, count: transactionsCount },
        { data: shares, count: sharesCount }
      ] = await Promise.all([
        supabaseClient.from('properties').select('*', { count: 'exact' }),
        supabaseClient.from('users').select('*', { count: 'exact' }).eq('is_active', true),
        supabaseClient.from('transactions').select('*', { count: 'exact' }).eq('status', 'completed'),
        supabaseClient.from('shares').select('*', { count: 'exact' }).eq('is_active', true)
      ])

      const totalInvestment = transactions?.reduce((sum, tx) => 
        tx.transaction_type === 'purchase' ? sum + tx.amount : sum, 0) || 0

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            total_properties: propertiesCount || 0,
            total_users: usersCount || 0,
            total_transactions: transactionsCount || 0,
            total_shares: sharesCount || 0,
            total_investment_volume: totalInvestment,
            platform_stats: {
              active_properties: properties?.filter(p => p.status === 'active').length || 0,
              verified_users: users?.filter(u => u.kyc_status === 'verified').length || 0,
              completed_transactions: transactionsCount || 0
            }
          },
          endpoint: '/analytics/overview'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // 404 for unknown routes
    console.log('Unknown endpoint:', cleanPath)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Endpoint not found',
        requested_path: cleanPath,
        available_endpoints: [
          'GET /health - API health check',
          'GET /properties - Get all properties',
          'GET /properties/{id} - Get specific property',
          'GET /users - Get all users',
          'GET /transactions?user_id={id} - Get transactions',
          'GET /staking-pools - Get staking pools',
          'GET /shares?user_id={id} - Get user shares',
          'GET /analytics/overview - Get platform analytics'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      },
    )

  } catch (error) {
    console.error('API Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        debug: {
          name: error.name,
          stack: error.stack
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
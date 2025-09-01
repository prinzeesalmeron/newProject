import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/api', '')
    const method = req.method

    // Route handling
    if (path === '/properties' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (path.startsWith('/properties/') && method === 'GET') {
      const propertyId = path.split('/')[2]
      
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

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (path === '/users' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, email, full_name, role, kyc_status, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (path === '/transactions' && method === 'GET') {
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

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (path === '/staking-pools' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('staking_pools')
        .select('*')
        .eq('is_active', true)
        .order('apy', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (path === '/shares' && method === 'GET') {
      const userId = url.searchParams.get('user_id')
      
      let query = supabaseClient
        .from('shares')
        .select(`
          *,
          properties(title, location, image_url),
          users(email, full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (path === '/analytics/overview' && method === 'GET') {
      const [
        { data: properties },
        { data: users },
        { data: transactions },
        { data: shares }
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
            total_properties: properties?.length || 0,
            total_users: users?.length || 0,
            total_transactions: transactions?.length || 0,
            total_shares: shares?.length || 0,
            total_investment_volume: totalInvestment,
            platform_stats: {
              active_properties: properties?.filter(p => p.status === 'active').length || 0,
              verified_users: users?.filter(u => u.kyc_status === 'verified').length || 0,
              completed_transactions: transactions?.length || 0
            }
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
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
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
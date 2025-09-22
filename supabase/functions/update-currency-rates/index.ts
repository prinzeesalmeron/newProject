const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch rates from multiple providers
    const [coinbaseRates, coingeckoRates] = await Promise.all([
      fetchCoinbaseRates(),
      fetchCoingeckoRates()
    ])

    // Combine and validate rates
    const rates = [
      ...coinbaseRates,
      ...coingeckoRates
    ]

    // Update database with new rates
    for (const rate of rates) {
      await supabase
        .from('currency_rates')
        .upsert([{
          from_currency: rate.from_currency,
          to_currency: rate.to_currency,
          rate: rate.rate,
          provider: rate.provider,
          last_updated: new Date().toISOString(),
          is_active: true
        }], {
          onConflict: 'from_currency,to_currency,provider'
        })
    }

    // Deactivate old rates (older than 1 hour)
    await supabase
      .from('currency_rates')
      .update({ is_active: false })
      .lt('last_updated', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    return new Response(
      JSON.stringify({
        success: true,
        rates_updated: rates.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Currency rate update failed:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Currency rate update failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchCoinbaseRates() {
  try {
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD')
    const data = await response.json()
    
    const rates = []
    if (data.data?.rates?.ETH) {
      rates.push({
        from_currency: 'USD',
        to_currency: 'ETH',
        rate: 1 / parseFloat(data.data.rates.ETH),
        provider: 'coinbase'
      })
      rates.push({
        from_currency: 'ETH',
        to_currency: 'USD',
        rate: parseFloat(data.data.rates.ETH),
        provider: 'coinbase'
      })
    }

    return rates
  } catch (error) {
    console.error('Coinbase rate fetch failed:', error)
    return []
  }
}

async function fetchCoingeckoRates() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const data = await response.json()
    
    const rates = []
    if (data.ethereum?.usd) {
      const ethPrice = data.ethereum.usd
      rates.push({
        from_currency: 'ETH',
        to_currency: 'USD',
        rate: ethPrice,
        provider: 'coingecko'
      })
      rates.push({
        from_currency: 'USD',
        to_currency: 'ETH',
        rate: 1 / ethPrice,
        provider: 'coingecko'
      })
    }

    // Add BLOCK token rates (internal pricing)
    rates.push({
      from_currency: 'USD',
      to_currency: 'BLOCK',
      rate: 1.2, // 1 USD = 1.2 BLOCK
      provider: 'internal'
    })
    rates.push({
      from_currency: 'BLOCK',
      to_currency: 'USD',
      rate: 0.83, // 1 BLOCK = 0.83 USD
      provider: 'internal'
    })

    return rates
  } catch (error) {
    console.error('CoinGecko rate fetch failed:', error)
    return []
  }
}
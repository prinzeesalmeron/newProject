const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, payment_method_id, metadata } = await req.json()

    // Validate request
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe
    const stripe = await import('npm:stripe@14')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate fees
    const platformFeeRate = 0.025 // 2.5%
    const processingFeeRate = 0.029 // 2.9%
    const processingFixedFee = 30 // $0.30 in cents

    const platformFee = Math.round(amount * platformFeeRate)
    const processingFee = Math.round(amount * processingFeeRate) + processingFixedFee
    const totalAmount = amount + platformFee + processingFee

    // Create Stripe Payment Intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: totalAmount, // Amount in cents
      currency: currency.toLowerCase(),
      payment_method: payment_method_id,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${req.headers.get('origin')}/payments/success`,
      metadata: {
        user_id: user.id,
        property_id: metadata?.property_id || '',
        token_amount: metadata?.token_amount || '0',
        platform_fee: platformFee.toString(),
        processing_fee: processingFee.toString()
      }
    })

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert([{
        user_id: user.id,
        property_id: metadata?.property_id || null,
        payment_intent_id: paymentIntent.id,
        amount: amount / 100, // Convert cents to dollars
        currency: currency.toUpperCase(),
        payment_method_id,
        transaction_type: metadata?.transaction_type || 'investment',
        status: 'pending',
        provider: 'stripe',
        provider_fee: processingFee / 100,
        platform_fee: platformFee / 100,
        metadata: {
          stripe_payment_intent: paymentIntent.id,
          token_amount: metadata?.token_amount,
          property_title: metadata?.property_title
        }
      }])
      .select()
      .single()

    if (transactionError) throw transactionError

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status
        },
        transaction_id: transaction.id,
        fees: {
          platform_fee: platformFee / 100,
          processing_fee: processingFee / 100,
          total_fees: (platformFee + processingFee) / 100
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment intent creation failed:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Payment intent creation failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
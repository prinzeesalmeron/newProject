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
    const { payment_transaction_id, refund_amount, reason } = await req.json()

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const stripe = await import('npm:stripe@14')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

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

    // Get original payment transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', payment_transaction_id)
      .eq('user_id', user.id) // Ensure user owns this transaction
      .single()

    if (transactionError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Payment transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (transaction.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: 'Can only refund successful payments' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create refund request
    const { data: refundRequest, error: refundError } = await supabase
      .from('refund_requests')
      .insert([{
        payment_transaction_id: payment_transaction_id,
        user_id: user.id,
        refund_amount: refund_amount,
        refund_reason: reason,
        requested_by: user.id,
        status: 'pending'
      }])
      .select()
      .single()

    if (refundError) throw refundError

    // Process refund with Stripe
    const refund = await stripeClient.refunds.create({
      payment_intent: transaction.payment_intent_id,
      amount: Math.round(refund_amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        refund_request_id: refundRequest.id,
        user_id: user.id
      }
    })

    // Update refund request with Stripe refund ID
    await supabase
      .from('refund_requests')
      .update({
        status: 'processed',
        provider_refund_id: refund.id,
        processed_at: new Date().toISOString(),
        processed_by: user.id
      })
      .eq('id', refundRequest.id)

    // Create refund transaction record
    await supabase
      .from('payment_transactions')
      .insert([{
        user_id: user.id,
        property_id: transaction.property_id,
        amount: -refund_amount, // Negative for refund
        currency: transaction.currency,
        transaction_type: 'refund',
        status: 'succeeded',
        provider: 'stripe',
        provider_transaction_id: refund.id,
        metadata: {
          original_transaction_id: payment_transaction_id,
          refund_request_id: refundRequest.id,
          refund_reason: reason
        },
        processed_at: new Date().toISOString()
      }])

    // Notify user
    await supabase
      .from('notifications')
      .insert([{
        user_id: user.id,
        title: 'Refund Processed',
        message: `Your refund of $${refund_amount} has been processed and will appear in your account within 3-5 business days.`,
        type: 'success'
      }])

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        refund_request_id: refundRequest.id,
        amount: refund_amount,
        estimated_arrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Refund processing failed:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Refund processing failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
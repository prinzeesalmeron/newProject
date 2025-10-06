const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify Stripe webhook signature
    const stripe = await import('npm:stripe@14')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    let event
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log webhook event
    await supabase
      .from('payment_webhooks')
      .insert([{
        provider: 'stripe',
        webhook_id: event.id,
        event_type: event.type,
        event_data: event.data,
        processed: false
      }])

    console.log('Processing webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event.data.object)
        break
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(supabase, event.data.object)
        break
      
      case 'charge.dispute.created':
        await handleChargeDispute(supabase, event.data.object)
        break
      
      default:
        console.log('Unhandled event type:', event.type)
    }

    // Mark webhook as processed
    await supabase
      .from('payment_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('webhook_id', event.id)

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handlePaymentSucceeded(supabase: any, paymentIntent: any) {
  try {
    // Update payment transaction status
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .update({
        status: 'succeeded',
        provider_transaction_id: paymentIntent.id,
        processed_at: new Date().toISOString(),
        metadata: { ...paymentIntent.metadata, stripe_payment_intent: paymentIntent }
      })
      .eq('payment_intent_id', paymentIntent.id)
      .select()
      .single()

    if (error) throw error

    // If this is an investment, process the property purchase
    if (transaction.transaction_type === 'investment') {
      await processPropertyInvestment(supabase, transaction)
    }

    // If this is funding an escrow, update escrow status
    if (transaction.metadata?.escrow_id) {
      await supabase
        .from('escrow_transactions')
        .update({ status: 'funded' })
        .eq('id', transaction.metadata.escrow_id)
    }

    console.log('Payment succeeded processed:', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(supabase: any, paymentIntent: any) {
  try {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        processed_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntent.id)

    console.log('Payment failed processed:', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function handlePaymentCanceled(supabase: any, paymentIntent: any) {
  try {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'cancelled',
        processed_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntent.id)

    console.log('Payment canceled processed:', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment cancellation:', error)
    throw error
  }
}

async function handleChargeDispute(supabase: any, dispute: any) {
  try {
    // Find the related payment transaction
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('provider_transaction_id', dispute.charge)
      .single()

    if (transaction) {
      // Create notification for admin
      await supabase
        .from('notifications')
        .insert([{
          user_id: transaction.user_id,
          title: 'Payment Dispute Created',
          message: `A dispute has been created for your payment of ${dispute.amount / 100} ${dispute.currency.toUpperCase()}`,
          type: 'warning',
          metadata: { dispute_id: dispute.id, charge_id: dispute.charge }
        }])
    }

    console.log('Charge dispute processed:', dispute.id)

  } catch (error) {
    console.error('Error handling charge dispute:', error)
    throw error
  }
}

async function processPropertyInvestment(supabase: any, transaction: any) {
  try {
    // Create or update user shares
    const { data: existingShare } = await supabase
      .from('shares')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('property_id', transaction.property_id)
      .maybeSingle()

    if (existingShare) {
      // Update existing share
      await supabase
        .from('shares')
        .update({
          tokens_owned: existingShare.tokens_owned + (transaction.metadata?.token_amount || 0),
          current_value: existingShare.current_value + transaction.net_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingShare.id)
    } else {
      // Create new share
      await supabase
        .from('shares')
        .insert([{
          user_id: transaction.user_id,
          property_id: transaction.property_id,
          tokens_owned: transaction.metadata?.token_amount || 0,
          purchase_price: transaction.net_amount,
          current_value: transaction.net_amount
        }])
    }

    // Update property available tokens
    const tokenAmount = transaction.metadata?.token_amount || 0
    if (tokenAmount > 0) {
      const { data: property } = await supabase
        .from('properties')
        .select('available_tokens')
        .eq('id', transaction.property_id)
        .single()

      if (property && property.available_tokens >= tokenAmount) {
        await supabase
          .from('properties')
          .update({
            available_tokens: property.available_tokens - tokenAmount
          })
          .eq('id', transaction.property_id)
      }
    }

    // Create success notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: transaction.user_id,
        title: 'Investment Successful!',
        message: `Your investment of $${transaction.amount} has been processed successfully.`,
        type: 'success',
        action_url: '/dashboard'
      }])

    console.log('Property investment processed:', transaction.id)

  } catch (error) {
    console.error('Error processing property investment:', error)
    throw error
  }
}
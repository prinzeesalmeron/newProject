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

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const stripe = await import('npm:stripe@14')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Verify webhook signature
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

    console.log('Processing Stripe webhook:', event.type)

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

      case 'invoice.payment_succeeded':
        await handleInvoicePayment(supabase, event.data.object)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(supabase, event.data.object)
        break
      
      default:
        console.log('Unhandled event type:', event.type)
    }

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
    // Update payment transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        blockchain_tx_hash: paymentIntent.id,
        metadata: { stripe_payment_intent: paymentIntent },
        updated_at: new Date().toISOString()
      })
      .eq('reference_id', paymentIntent.metadata?.transaction_id)
      .select()
      .single()

    if (error) throw error

    // Process property investment
    if (transaction.transaction_type === 'purchase') {
      await processPropertyInvestment(supabase, transaction)
    }

    // Send success notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: transaction.user_id,
        title: 'Payment Successful',
        message: `Your payment of $${transaction.amount} has been processed successfully.`,
        type: 'success'
      }])

    console.log('Payment succeeded:', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(supabase: any, paymentIntent: any) {
  try {
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        metadata: { 
          stripe_error: paymentIntent.last_payment_error,
          failure_reason: paymentIntent.last_payment_error?.message 
        },
        updated_at: new Date().toISOString()
      })
      .eq('reference_id', paymentIntent.metadata?.transaction_id)

    console.log('Payment failed:', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handlePaymentCanceled(supabase: any, paymentIntent: any) {
  try {
    await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('reference_id', paymentIntent.metadata?.transaction_id)

    console.log('Payment canceled:', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment cancellation:', error)
  }
}

async function handleChargeDispute(supabase: any, dispute: any) {
  try {
    // Create dispute record
    await supabase
      .from('payment_disputes')
      .insert([{
        stripe_dispute_id: dispute.id,
        charge_id: dispute.charge,
        amount: dispute.amount / 100,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        evidence_due_by: new Date(dispute.evidence_details.due_by * 1000).toISOString(),
        created_at: new Date().toISOString()
      }])

    console.log('Charge dispute created:', dispute.id)

  } catch (error) {
    console.error('Error handling charge dispute:', error)
  }
}

async function handleInvoicePayment(supabase: any, invoice: any) {
  try {
    console.log('Invoice payment succeeded:', invoice.id)
  } catch (error) {
    console.error('Error handling invoice payment:', error)
  }
}

async function handleSubscriptionCreated(supabase: any, subscription: any) {
  try {
    console.log('Subscription created:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription creation:', error)
  }
}

async function handleSubscriptionCanceled(supabase: any, subscription: any) {
  try {
    console.log('Subscription canceled:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

async function processPropertyInvestment(supabase: any, transaction: any) {
  try {
    const tokenAmount = transaction.token_amount || 0

    // Create or update user shares
    const { data: existingShare } = await supabase
      .from('shares')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('property_id', transaction.property_id)
      .maybeSingle()

    if (existingShare) {
      await supabase
        .from('shares')
        .update({
          tokens_owned: existingShare.tokens_owned + tokenAmount,
          current_value: existingShare.current_value + transaction.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingShare.id)
    } else {
      await supabase
        .from('shares')
        .insert([{
          user_id: transaction.user_id,
          property_id: transaction.property_id,
          tokens_owned: tokenAmount,
          purchase_price: transaction.amount,
          current_value: transaction.amount
        }])
    }

    // Update property available tokens
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

    console.log('Property investment processed:', transaction.id)

  } catch (error) {
    console.error('Error processing property investment:', error)
  }
}
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
    const webhookData = await req.json()
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Processing KYC webhook:', webhookData.eventType)

    // Handle different KYC providers
    if (webhookData.provider === 'jumio') {
      await handleJumioWebhook(supabase, webhookData)
    } else if (webhookData.provider === 'onfido') {
      await handleOnfidoWebhook(supabase, webhookData)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('KYC webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ error: 'KYC webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleJumioWebhook(supabase: any, webhookData: any) {
  try {
    const { transactionReference, verificationStatus, customerInternalReference } = webhookData

    // Update KYC verification record
    const kycStatus = verificationStatus === 'APPROVED_VERIFIED' ? 'approved' : 
                     verificationStatus === 'DENIED_FRAUD' ? 'rejected' : 'pending'

    await supabase
      .from('kyc_verifications')
      .update({
        verification_status: kycStatus,
        verification_data: webhookData,
        verified_at: new Date().toISOString()
      })
      .eq('verification_id', transactionReference)

    // Update user KYC status
    await supabase
      .from('users')
      .update({
        kyc_status: kycStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerInternalReference)

    // Send notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: customerInternalReference,
        title: `KYC Verification ${kycStatus === 'approved' ? 'Approved' : 'Update'}`,
        message: kycStatus === 'approved' 
          ? 'Your identity verification has been approved. You can now invest in properties.'
          : kycStatus === 'rejected'
          ? 'Your identity verification requires additional information. Please resubmit your documents.'
          : 'Your identity verification is being reviewed.',
        type: kycStatus === 'approved' ? 'success' : kycStatus === 'rejected' ? 'error' : 'info'
      }])

    console.log('Jumio KYC processed:', transactionReference)

  } catch (error) {
    console.error('Error handling Jumio webhook:', error)
  }
}

async function handleOnfidoWebhook(supabase: any, webhookData: any) {
  try {
    const { payload } = webhookData
    const { resource_type, action, object } = payload

    if (resource_type === 'check' && action === 'check.completed') {
      const checkId = object.id
      const status = object.status
      const result = object.result

      // Update verification record
      const kycStatus = result === 'clear' ? 'approved' : 
                       result === 'consider' ? 'review_required' : 'rejected'

      await supabase
        .from('kyc_verifications')
        .update({
          verification_status: kycStatus,
          verification_data: object,
          verified_at: new Date().toISOString()
        })
        .eq('verification_id', checkId)

      console.log('Onfido KYC processed:', checkId)
    }

  } catch (error) {
    console.error('Error handling Onfido webhook:', error)
  }
}
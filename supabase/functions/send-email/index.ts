import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  to: string;
  template: string;
  data: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, template, data }: EmailRequest = await req.json();

    // Validate request
    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get email HTML from template
    const emailHtml = getEmailTemplate(template, data);
    const subject = getEmailSubject(template, data);

    // Send email using Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RealEstate Platform <noreply@yourcompany.com>',
        to: [to],
        subject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    // Log email sent
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('email_logs').insert({
      recipient: to,
      template,
      subject,
      status: 'sent',
      email_id: result.id,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email sending failed:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getEmailSubject(template: string, data: Record<string, any>): string {
  const subjects: Record<string, string> = {
    welcome: 'Welcome to RealEstate Platform!',
    verification: 'Verify Your Email Address',
    investment_confirmation: `Investment Confirmation - ${data.property_title || 'Property'}`,
    payment_receipt: `Payment Receipt - $${data.amount || '0'}`,
    rental_income: `Rental Income Distribution - $${data.amount || '0'}`,
    kyc_approved: 'KYC Verification Approved',
    kyc_rejected: 'KYC Verification Status Update',
    password_reset: 'Reset Your Password',
    security_alert: 'Security Alert - Account Activity',
    transaction_complete: 'Transaction Completed Successfully',
  };

  return subjects[template] || 'Notification from RealEstate Platform';
}

function getEmailTemplate(template: string, data: Record<string, any>): string {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
      .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin: 15px 0; }
    </style>
  `;

  const templates: Record<string, string> = {
    welcome: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Welcome to RealEstate Platform!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name || 'there'},</p>
          <p>Thank you for joining RealEstate Platform, the future of property investment!</p>
          <p>You can now:</p>
          <ul>
            <li>Browse tokenized real estate properties</li>
            <li>Invest in fractional property ownership</li>
            <li>Earn rental income from your investments</li>
            <li>Trade property tokens 24/7</li>
          </ul>
          <a href="${data.dashboard_url || 'https://yourapp.com/dashboard'}" class="button">Explore Properties</a>
          <p>If you have any questions, our support team is here to help.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 RealEstate Platform. All rights reserved.</p>
          <p><a href="https://yourapp.com/unsubscribe">Unsubscribe</a> | <a href="https://yourapp.com/privacy">Privacy Policy</a></p>
        </div>
      </div>
    `,

    verification: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name || 'there'},</p>
          <p>Please verify your email address to complete your registration.</p>
          <a href="${data.verification_url}" class="button">Verify Email Address</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 RealEstate Platform. All rights reserved.</p>
        </div>
      </div>
    `,

    investment_confirmation: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Investment Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name || 'there'},</p>
          <p>Your investment has been successfully processed.</p>
          <h3>Investment Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Property:</strong></td>
              <td style="padding: 10px;">${data.property_title || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Tokens Purchased:</strong></td>
              <td style="padding: 10px;">${data.tokens || '0'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Amount:</strong></td>
              <td style="padding: 10px;">$${data.amount || '0'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Transaction ID:</strong></td>
              <td style="padding: 10px; font-family: monospace; font-size: 12px;">${data.transaction_id || 'N/A'}</td>
            </tr>
          </table>
          <a href="${data.portfolio_url || 'https://yourapp.com/portfolio'}" class="button">View Portfolio</a>
        </div>
        <div class="footer">
          <p>&copy; 2025 RealEstate Platform. All rights reserved.</p>
        </div>
      </div>
    `,

    payment_receipt: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Payment Receipt</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name || 'there'},</p>
          <p>Thank you for your payment. Here is your receipt:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Date:</strong></td>
              <td style="padding: 10px;">${data.date || new Date().toLocaleDateString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Amount:</strong></td>
              <td style="padding: 10px;">$${data.amount || '0'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Payment Method:</strong></td>
              <td style="padding: 10px;">${data.payment_method || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;"><strong>Receipt Number:</strong></td>
              <td style="padding: 10px; font-family: monospace;">${data.receipt_number || 'N/A'}</td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #666;">Keep this receipt for your records.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 RealEstate Platform. All rights reserved.</p>
        </div>
      </div>
    `,

    security_alert: `
      ${baseStyle}
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <h1>Security Alert</h1>
        </div>
        <div class="content">
          <div class="alert">
            <strong>⚠️ Important Security Notice</strong>
          </div>
          <p>Hi ${data.name || 'there'},</p>
          <p>We detected ${data.activity || 'unusual activity'} on your account.</p>
          <h3>Activity Details:</h3>
          <ul>
            <li><strong>Activity:</strong> ${data.activity || 'N/A'}</li>
            <li><strong>Time:</strong> ${data.time || new Date().toLocaleString()}</li>
            <li><strong>Location:</strong> ${data.location || 'Unknown'}</li>
            <li><strong>IP Address:</strong> ${data.ip_address || 'Unknown'}</li>
          </ul>
          <p><strong>If this was you:</strong> No action needed.</p>
          <p><strong>If this wasn't you:</strong> Please secure your account immediately.</p>
          <a href="${data.security_url || 'https://yourapp.com/security'}" class="button">Review Security Settings</a>
        </div>
        <div class="footer">
          <p>&copy; 2025 RealEstate Platform. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return templates[template] || `
    ${baseStyle}
    <div class="container">
      <div class="header">
        <h1>Notification</h1>
      </div>
      <div class="content">
        <p>You have a new notification from RealEstate Platform.</p>
        ${data.message || ''}
      </div>
      <div class="footer">
        <p>&copy; 2025 RealEstate Platform. All rights reserved.</p>
      </div>
    </div>
  `;
}

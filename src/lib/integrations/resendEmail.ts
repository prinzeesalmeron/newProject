import { supabase } from '../supabase';

/**
 * Resend Email Integration - Production email service
 * Docs: https://resend.com/docs
 */

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, any>;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export interface EmailResult {
  id: string;
  success: boolean;
  error?: string;
}

export class ResendEmailService {
  private static readonly API_KEY = import.meta.env.VITE_RESEND_API_KEY;
  private static readonly FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'BlockEstate <noreply@blockestate.com>';
  private static readonly API_BASE = 'https://api.resend.com';

  /**
   * Send email using Resend API
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.API_KEY) {
        console.warn('Resend API key not configured, using mock mode');
        return this.mockSendEmail(options);
      }

      let emailHtml = options.html;
      let emailText = options.text;

      // If template specified, render it
      if (options.template) {
        const rendered = await this.renderTemplate(options.template, options.variables || {});
        emailHtml = rendered.html;
        emailText = rendered.text;
      }

      const response = await fetch(`${this.API_BASE}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: options.from || this.FROM_EMAIL,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: emailHtml,
          text: emailText,
          reply_to: options.replyTo,
          cc: options.cc,
          bcc: options.bcc,
          attachments: options.attachments,
          tags: options.tags
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Email send failed');
      }

      const data = await response.json();

      await this.logEmail(options, data.id, 'sent');

      return {
        id: data.id,
        success: true
      };
    } catch (error: any) {
      console.error('Email send failed:', error);

      await this.logEmail(options, null, 'failed', error.message);

      return {
        id: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    email: string,
    name: string,
    verificationUrl?: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to BlockEstate - Get Started with Real Estate Investing',
      template: 'welcome',
      variables: {
        name,
        verification_url: verificationUrl,
        dashboard_url: `${window.location.origin}/dashboard`
      }
    });
  }

  /**
   * Send investment confirmation email
   */
  static async sendInvestmentConfirmation(
    email: string,
    name: string,
    propertyName: string,
    amount: number,
    tokens: number,
    receiptUrl: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Investment Confirmed - ${propertyName}`,
      template: 'investment_confirmation',
      variables: {
        name,
        property_name: propertyName,
        amount: amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        tokens,
        receipt_url: receiptUrl,
        portfolio_url: `${window.location.origin}/portfolio`
      }
    });
  }

  /**
   * Send KYC verification reminder
   */
  static async sendKYCReminder(
    email: string,
    name: string,
    verificationUrl: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Complete Your KYC Verification',
      template: 'kyc_reminder',
      variables: {
        name,
        verification_url: verificationUrl,
        support_email: 'support@blockestate.com'
      }
    });
  }

  /**
   * Send monthly dividend notification
   */
  static async sendDividendNotification(
    email: string,
    name: string,
    propertyName: string,
    amount: number,
    paymentDate: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Dividend Payment - ${propertyName}`,
      template: 'dividend_notification',
      variables: {
        name,
        property_name: propertyName,
        amount: amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        payment_date: paymentDate,
        portfolio_url: `${window.location.origin}/portfolio`
      }
    });
  }

  /**
   * Send security alert
   */
  static async sendSecurityAlert(
    email: string,
    name: string,
    alertType: string,
    alertDetails: string,
    actionUrl?: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Security Alert - ${alertType}`,
      template: 'security_alert',
      variables: {
        name,
        alert_type: alertType,
        alert_details: alertDetails,
        action_url: actionUrl,
        account_url: `${window.location.origin}/account/security`
      }
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    email: string,
    resetUrl: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - BlockEstate',
      template: 'password_reset',
      variables: {
        reset_url: resetUrl,
        support_email: 'support@blockestate.com'
      }
    });
  }

  /**
   * Send transaction receipt
   */
  static async sendTransactionReceipt(
    email: string,
    name: string,
    transactionId: string,
    amount: number,
    description: string,
    date: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Transaction Receipt - ${transactionId}`,
      template: 'transaction_receipt',
      variables: {
        name,
        transaction_id: transactionId,
        amount: amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        description,
        date,
        transactions_url: `${window.location.origin}/transactions`
      }
    });
  }

  /**
   * Batch send emails (for newsletters, announcements)
   */
  static async sendBatchEmails(
    recipients: Array<{ email: string; variables?: Record<string, any> }>,
    subject: string,
    template: string,
    globalVariables: Record<string, any> = {}
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      recipients.map(recipient =>
        this.sendEmail({
          to: recipient.email,
          subject,
          template,
          variables: { ...globalVariables, ...recipient.variables }
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'rejected' ? r.reason : (r as any).value.error);

    return { sent, failed, errors };
  }

  /**
   * Get email delivery status (webhook handler)
   */
  static async handleWebhook(payload: any): Promise<void> {
    try {
      const { type, data } = payload;

      switch (type) {
        case 'email.sent':
          await this.updateEmailStatus(data.email_id, 'sent');
          break;
        case 'email.delivered':
          await this.updateEmailStatus(data.email_id, 'delivered');
          break;
        case 'email.bounced':
          await this.updateEmailStatus(data.email_id, 'bounced', data.reason);
          break;
        case 'email.opened':
          await this.trackEmailOpen(data.email_id);
          break;
        case 'email.clicked':
          await this.trackEmailClick(data.email_id, data.link);
          break;
        default:
          console.log('Unhandled webhook event:', type);
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async renderTemplate(
    templateName: string,
    variables: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    // Get template from database or use built-in templates
    const template = this.getBuiltInTemplate(templateName);

    let html = template.html;
    let text = template.text || '';

    // Simple variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
      text = text.replace(regex, String(value));
    });

    return { html, text };
  }

  private static getBuiltInTemplate(name: string): EmailTemplate {
    const templates: Record<string, EmailTemplate> = {
      welcome: {
        name: 'welcome',
        subject: 'Welcome to BlockEstate',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to BlockEstate, {{name}}!</h1>
            <p>We're excited to have you join us on your real estate investment journey.</p>
            <p>Get started by exploring available properties and making your first investment.</p>
            <a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
          </div>
        `,
        text: 'Welcome to BlockEstate, {{name}}! Get started at {{dashboard_url}}'
      },
      investment_confirmation: {
        name: 'investment_confirmation',
        subject: 'Investment Confirmed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Investment Confirmed!</h1>
            <p>Hi {{name}},</p>
            <p>Your investment in {{property_name}} has been confirmed.</p>
            <ul>
              <li>Amount: {{amount}}</li>
              <li>Tokens: {{tokens}}</li>
            </ul>
            <a href="{{receipt_url}}" style="color: #2563eb;">View Receipt</a>
            <p><a href="{{portfolio_url}}">View Your Portfolio</a></p>
          </div>
        `,
        text: 'Investment Confirmed! {{amount}} in {{property_name}}. {{tokens}} tokens received.'
      },
      kyc_reminder: {
        name: 'kyc_reminder',
        subject: 'Complete Your KYC Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Complete Your Verification</h1>
            <p>Hi {{name}},</p>
            <p>To start investing, please complete your KYC verification.</p>
            <a href="{{verification_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Now</a>
          </div>
        `
      },
      dividend_notification: {
        name: 'dividend_notification',
        subject: 'Dividend Payment',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Dividend Payment Received</h1>
            <p>Hi {{name}},</p>
            <p>You've received a dividend payment from {{property_name}}.</p>
            <p><strong>Amount: {{amount}}</strong></p>
            <p>Payment Date: {{payment_date}}</p>
            <a href="{{portfolio_url}}">View Portfolio</a>
          </div>
        `
      },
      security_alert: {
        name: 'security_alert',
        subject: 'Security Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Security Alert</h1>
            <p>Hi {{name}},</p>
            <p><strong>{{alert_type}}</strong></p>
            <p>{{alert_details}}</p>
            {{#if action_url}}
            <a href="{{action_url}}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Take Action</a>
            {{/if}}
          </div>
        `
      },
      password_reset: {
        name: 'password_reset',
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Reset Your Password</h1>
            <p>Click the button below to reset your password.</p>
            <a href="{{reset_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      },
      transaction_receipt: {
        name: 'transaction_receipt',
        subject: 'Transaction Receipt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Transaction Receipt</h1>
            <p>Hi {{name}},</p>
            <p>Transaction ID: {{transaction_id}}</p>
            <p>Amount: {{amount}}</p>
            <p>Description: {{description}}</p>
            <p>Date: {{date}}</p>
            <a href="{{transactions_url}}">View All Transactions</a>
          </div>
        `
      }
    };

    return templates[name] || templates.welcome;
  }

  private static async logEmail(
    options: EmailOptions,
    emailId: string | null,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .insert({
          email_id: emailId,
          recipient: Array.isArray(options.to) ? options.to[0] : options.to,
          subject: options.subject,
          template: options.template,
          status,
          error,
          created_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Failed to log email:', err);
    }
  }

  private static async updateEmailStatus(
    emailId: string,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .update({
          status,
          error,
          updated_at: new Date().toISOString()
        })
        .eq('email_id', emailId);
    } catch (err) {
      console.error('Failed to update email status:', err);
    }
  }

  private static async trackEmailOpen(emailId: string): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .update({
          opened_at: new Date().toISOString()
        })
        .eq('email_id', emailId);
    } catch (err) {
      console.error('Failed to track email open:', err);
    }
  }

  private static async trackEmailClick(emailId: string, link: string): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .update({
          clicked_at: new Date().toISOString(),
          clicked_link: link
        })
        .eq('email_id', emailId);
    } catch (err) {
      console.error('Failed to track email click:', err);
    }
  }

  private static mockSendEmail(options: EmailOptions): EmailResult {
    console.log('[MOCK EMAIL]', {
      to: options.to,
      subject: options.subject,
      template: options.template
    });

    return {
      id: `mock_${Date.now()}`,
      success: true
    };
  }
}

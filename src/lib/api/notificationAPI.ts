import { supabase } from '../supabase';
import { DatabaseService } from '../database';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
  metadata?: any;
}

export interface EmailTemplate {
  template_id: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: Record<string, any>;
}

export class NotificationAPI {
  /**
   * Create in-app notification
   */
  static async createNotification(notificationData: NotificationData) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'notification_created',
        resource_type: 'notification',
        resource_id: data.id,
        new_values: notificationData
      });

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(
    userIds: string[],
    notificationData: Omit<NotificationData, 'user_id'>
  ) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const notifications = userIds.map(userId => ({
        ...notificationData,
        user_id: userId
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      unread_only?: boolean;
      type?: string;
    }
  ) {
    if (!supabase) {
      return { notifications: [], total: 0, page: 1, limit: 20 };
    }

    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (options?.unread_only) {
        query = query.eq('is_read', false);
      }

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        notifications: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], total: 0, page: 1, limit: 20 };
    }
  }

  /**
   * Send email notification (mock implementation)
   */
  static async sendEmail(
    to: string,
    template: EmailTemplate,
    variables: Record<string, any> = {}
  ) {
    // In production, integrate with SendGrid, AWS SES, or similar
    console.log('Sending email notification:', {
      to,
      subject: template.subject,
      template_id: template.template_id,
      variables
    });

    // Mock email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message_id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      provider: 'mock'
    };
  }

  /**
   * Send SMS notification (mock implementation)
   */
  static async sendSMS(to: string, message: string) {
    // In production, integrate with Twilio, AWS SNS, or similar
    console.log('Sending SMS notification:', { to, message });

    // Mock SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      message_id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      provider: 'mock'
    };
  }

  /**
   * Send push notification (mock implementation)
   */
  static async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ) {
    // In production, integrate with Firebase Cloud Messaging, OneSignal, etc.
    console.log('Sending push notification:', { userId, title, message, data });

    // Create in-app notification as well
    await this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'info',
      metadata: data
    });

    return {
      success: true,
      notification_id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      provider: 'mock'
    };
  }

  /**
   * Send investment confirmation notifications
   */
  static async sendInvestmentConfirmation(
    userId: string,
    userEmail: string,
    propertyTitle: string,
    amount: number,
    tokenAmount: number
  ) {
    try {
      // Send email
      await this.sendEmail(userEmail, {
        template_id: 'investment_confirmation',
        subject: 'Investment Confirmation - BlockEstate',
        html_content: `Your investment of $${amount} in ${propertyTitle} has been confirmed.`,
        text_content: `Your investment of $${amount} in ${propertyTitle} has been confirmed.`,
        variables: { propertyTitle, amount, tokenAmount }
      });

      // Create in-app notification
      await this.createNotification({
        user_id: userId,
        title: 'Investment Successful!',
        message: `You have successfully invested $${amount} in ${propertyTitle} and received ${tokenAmount} tokens.`,
        type: 'success',
        action_url: '/dashboard'
      });

      // Send push notification
      await this.sendPushNotification(
        userId,
        'Investment Confirmed',
        `Your investment of $${amount} in ${propertyTitle} has been processed.`,
        { property_title: propertyTitle, amount, token_amount: tokenAmount }
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending investment confirmation:', error);
      throw error;
    }
  }

  /**
   * Send rental income notifications
   */
  static async sendRentalIncomeNotification(
    userId: string,
    userEmail: string,
    amount: number,
    propertyTitle: string,
    monthYear: string
  ) {
    try {
      // Send email
      await this.sendEmail(userEmail, {
        template_id: 'rental_income',
        subject: 'Rental Income Received - BlockEstate',
        html_content: `You received $${amount.toFixed(2)} in rental income from ${propertyTitle}.`,
        text_content: `You received $${amount.toFixed(2)} in rental income from ${propertyTitle}.`,
        variables: { amount, propertyTitle, monthYear }
      });

      // Create in-app notification
      await this.createNotification({
        user_id: userId,
        title: 'Rental Income Received',
        message: `You received $${amount.toFixed(2)} in rental income from ${propertyTitle} for ${monthYear}.`,
        type: 'success',
        action_url: '/dashboard?tab=income'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending rental income notification:', error);
      throw error;
    }
  }

  /**
   * Send system alerts to all users
   */
  static async sendSystemAlert(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info',
    targetRoles?: string[]
  ) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Get target users
      let query = supabase.from('users').select('id, email');
      
      if (targetRoles && targetRoles.length > 0) {
        query = query.in('role', targetRoles);
      }

      const { data: users, error } = await query.eq('is_active', true);

      if (error) throw error;

      if (!users || users.length === 0) {
        return { success: true, sent_count: 0 };
      }

      // Send notifications to all target users
      const notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type
      }));

      await this.sendBulkNotifications(users.map(u => u.id), {
        title,
        message,
        type
      });

      return { success: true, sent_count: users.length };
    } catch (error) {
      console.error('Error sending system alert:', error);
      throw error;
    }
  }

  /**
   * Get notification analytics
   */
  static async getNotificationAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    if (!supabase) {
      return null;
    }

    try {
      const startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const analytics = {
        total_sent: data?.length || 0,
        total_read: data?.filter(n => n.is_read).length || 0,
        read_rate: data?.length > 0 ? (data.filter(n => n.is_read).length / data.length) * 100 : 0,
        by_type: data?.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };

      return analytics;
    } catch (error) {
      console.error('Error fetching notification analytics:', error);
      return null;
    }
  }
}
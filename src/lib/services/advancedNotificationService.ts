import { supabase } from '../supabase';
import { analyticsService } from './analyticsService';
import { ResendEmailService } from '../integrations/resendEmail';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  channels: {
    investments: boolean;
    rentals: boolean;
    governance: boolean;
    security: boolean;
    marketing: boolean;
    updates: boolean;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'investment' | 'rental' | 'governance' | 'security' | 'update' | 'marketing';
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastTriggered?: string;
}

class AdvancedNotificationService {
  private readonly TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  private readonly TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  private readonly TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

  async sendNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      const { data: user } = await supabase
        .from('profiles')
        .select('email, phone, name')
        .eq('id', userId)
        .single();

      if (!user) return;

      const channelsToUse = this.filterChannelsByPreferences(
        notification.channels,
        preferences,
        notification.type
      );

      const notificationId = await this.saveNotification(userId, notification);

      for (const channel of channelsToUse) {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(user.email, user.name, notification);
            break;
          case 'sms':
            if (user.phone) {
              await this.sendSMSNotification(user.phone, notification);
            }
            break;
          case 'push':
            await this.sendPushNotification(userId, notification);
            break;
          case 'in_app':
            break;
        }
      }

      await this.triggerWebhooks(userId, 'notification.sent', {
        notificationId,
        type: notification.type,
        title: notification.title
      });

      analyticsService.track('Notification Sent', {
        type: notification.type,
        channels: channelsToUse,
        priority: notification.priority
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async sendSMSNotification(phoneNumber: string, notification: Pick<Notification, 'title' | 'message'>): Promise<boolean> {
    if (!this.TWILIO_ACCOUNT_SID || !this.TWILIO_AUTH_TOKEN) {
      console.log('Twilio not configured, skipping SMS');
      return false;
    }

    try {
      const message = `${notification.title}\n\n${notification.message}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${this.TWILIO_ACCOUNT_SID}:${this.TWILIO_AUTH_TOKEN}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: this.TWILIO_PHONE_NUMBER || '',
            Body: message
          })
        }
      );

      if (!response.ok) {
        throw new Error('SMS send failed');
      }

      const data = await response.json();

      await supabase
        .from('sms_logs')
        .insert({
          phone_number: phoneNumber,
          message,
          status: data.status,
          sid: data.sid,
          sent_at: new Date().toISOString()
        });

      analyticsService.track('SMS Sent', { status: data.status });

      return true;
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }

  async sendPushNotification(
    userId: string,
    notification: Pick<Notification, 'title' | 'message' | 'data'>
  ): Promise<boolean> {
    try {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) {
        return false;
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: notification.data || {}
      });

      for (const subscription of subscriptions) {
        try {
          await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400'
            },
            body: payload
          });
        } catch (error) {
          console.error('Push notification failed for subscription:', error);
          await this.removePushSubscription(subscription.id);
        }
      }

      analyticsService.track('Push Notification Sent', {
        subscriptions: subscriptions.length
      });

      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  async sendEmailNotification(
    email: string,
    name: string,
    notification: Pick<Notification, 'title' | 'message' | 'type' | 'data'>
  ): Promise<boolean> {
    try {
      await ResendEmailService.sendEmail({
        to: email,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">${notification.title}</h1>
            <p>Hi ${name},</p>
            <p>${notification.message}</p>
            ${notification.data?.actionUrl ? `
              <a href="${notification.data.actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
            ` : ''}
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              You received this email because you're subscribed to ${notification.type} notifications.
              <a href="${window.location.origin}/settings/notifications">Update your preferences</a>
            </p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Email notification failed:', error);
      return false;
    }
  }

  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      analyticsService.track('Notification Read', { notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      analyticsService.track('All Notifications Read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      analyticsService.track('Notification Deleted', { notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return this.getDefaultPreferences();
      }

      return data.preferences as NotificationPreferences;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      analyticsService.track('Notification Preferences Updated', preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  async registerWebhook(userId: string, config: Omit<WebhookConfig, 'id' | 'userId'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: userId,
          url: config.url,
          events: config.events,
          secret: config.secret,
          active: config.active
        })
        .select()
        .single();

      if (error) throw error;

      analyticsService.track('Webhook Registered', {
        events: config.events,
        url: config.url
      });

      return data.id;
    } catch (error) {
      console.error('Failed to register webhook:', error);
      throw error;
    }
  }

  async getWebhooks(userId: string): Promise<WebhookConfig[]> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get webhooks:', error);
      return [];
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);

      analyticsService.track('Webhook Deleted', { webhookId });
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  }

  async triggerWebhooks(userId: string, event: string, data: any): Promise<void> {
    try {
      const { data: webhooks } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .contains('events', [event]);

      if (!webhooks || webhooks.length === 0) return;

      for (const webhook of webhooks) {
        try {
          const payload = {
            event,
            data,
            timestamp: new Date().toISOString()
          };

          const signature = await this.createWebhookSignature(payload, webhook.secret);

          await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': event
            },
            body: JSON.stringify(payload)
          });

          await supabase
            .from('webhooks')
            .update({ last_triggered: new Date().toISOString() })
            .eq('id', webhook.id);
        } catch (error) {
          console.error('Webhook trigger failed:', webhook.url, error);
        }
      }
    } catch (error) {
      console.error('Failed to trigger webhooks:', error);
    }
  }

  private async saveNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<string> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        channels: notification.channels,
        priority: notification.priority,
        read: false,
        expires_at: notification.expiresAt
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  private filterChannelsByPreferences(
    requestedChannels: ('email' | 'sms' | 'push' | 'in_app')[],
    preferences: NotificationPreferences,
    type: Notification['type']
  ): ('email' | 'sms' | 'push' | 'in_app')[] {
    const typeEnabled = preferences.channels[type + 's' as keyof typeof preferences.channels];

    if (!typeEnabled) return ['in_app'];

    return requestedChannels.filter(channel => {
      switch (channel) {
        case 'email':
          return preferences.email;
        case 'sms':
          return preferences.sms;
        case 'push':
          return preferences.push;
        case 'in_app':
          return preferences.inApp;
        default:
          return false;
      }
    });
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: true,
      sms: false,
      push: true,
      inApp: true,
      channels: {
        investments: true,
        rentals: true,
        governance: true,
        security: true,
        marketing: false,
        updates: true
      }
    };
  }

  private async removePushSubscription(subscriptionId: string): Promise<void> {
    try {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', subscriptionId);
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
    }
  }

  private async createWebhookSignature(payload: any, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = encoder.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const advancedNotificationService = new AdvancedNotificationService();

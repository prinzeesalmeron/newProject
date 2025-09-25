import { supabase } from '../supabase';
import { NotificationAPI } from '../api/notificationAPI';
import { config } from '../config';

export interface PushSubscription {
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_agent: string;
  created_at: string;
}

/**
 * Real-time Service - WebSocket connections, push notifications, and live updates
 */
export class RealTimeService {
  private static subscriptions = new Map<string, any>();
  private static pushSubscriptions = new Map<string, PushSubscription>();

  /**
   * Initialize real-time connections
   */
  static async initialize(): Promise<void> {
    try {
      // Initialize Supabase real-time
      if (supabase) {
        await this.initializeSupabaseRealtime();
      }

      // Initialize push notifications
      if (config.features.notifications && 'serviceWorker' in navigator && 'PushManager' in window) {
        await this.initializePushNotifications();
      }

      // Initialize WebSocket connections
      await this.initializeWebSockets();

      console.log('Real-time services initialized');

    } catch (error) {
      console.error('Real-time initialization failed:', error);
    }
  }

  /**
   * Subscribe to property updates
   */
  static subscribeToPropertyUpdates(
    propertyId: string,
    callback: (update: any) => void
  ): () => void {
    if (!supabase) {
      return () => {};
    }

    const subscription = supabase
      .channel(`property_${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `id=eq.${propertyId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`property_${propertyId}`, subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(`property_${propertyId}`);
    };
  }

  /**
   * Subscribe to user notifications
   */
  static subscribeToUserNotifications(
    userId: string,
    callback: (notification: any) => void
  ): () => void {
    if (!supabase) {
      return () => {};
    }

    const subscription = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`notifications_${userId}`, subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(`notifications_${userId}`);
    };
  }

  /**
   * Subscribe to transaction updates
   */
  static subscribeToTransactionUpdates(
    userId: string,
    callback: (transaction: any) => void
  ): () => void {
    if (!supabase) {
      return () => {};
    }

    const subscription = supabase
      .channel(`user_transactions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`transactions_${userId}`, subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(`transactions_${userId}`);
    };
  }

  /**
   * Store push notification subscription
   */
  static async storePushSubscription(
    userId: string,
    subscription: any
  ): Promise<void> {
    try {
      const pushSub: PushSubscription = {
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      this.pushSubscriptions.set(userId, pushSub);

      // Store in database
      if (supabase) {
        await supabase
          .from('push_subscriptions')
          .upsert([pushSub], { onConflict: 'user_id' });
      }

    } catch (error) {
      console.error('Push subscription storage failed:', error);
    }
  }

  /**
   * Send push notification
   */
  static async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      const subscription = this.pushSubscriptions.get(userId);
      if (!subscription) {
        console.warn(`No push subscription found for user ${userId}`);
        return;
      }

      // Send via service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body: message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          data: data,
          actions: [
            {
              action: 'view',
              title: 'View',
              icon: '/action-view.png'
            }
          ]
        });
      }

      // Also create in-app notification
      await NotificationAPI.createNotification({
        user_id: userId,
        title,
        message,
        type: 'info',
        metadata: data
      });

    } catch (error) {
      console.error('Push notification failed:', error);
    }
  }

  /**
   * Broadcast system-wide message
   */
  static async broadcastSystemMessage(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    if (!supabase) return;

    try {
      // Send to all connected clients via Supabase broadcast
      await supabase
        .channel('system_broadcasts')
        .send({
          type: 'broadcast',
          event: 'system_message',
          payload: { message, type, timestamp: Date.now() }
        });

    } catch (error) {
      console.error('System broadcast failed:', error);
    }
  }

  // Private initialization methods
  private static async initializeSupabaseRealtime(): Promise<void> {
    // Subscribe to system-wide broadcasts
    supabase!
      .channel('system_broadcasts')
      .on('broadcast', { event: 'system_message' }, (payload) => {
        this.handleSystemMessage(payload);
      })
      .subscribe();
  }

  private static async initializePushNotifications(): Promise<void> {
    // Skip Service Worker initialization in StackBlitz/WebContainer environments
    if (typeof window !== 'undefined' && 
        window.location.hostname.includes('webcontainer') || 
        window.location.hostname.includes('stackblitz')) {
      console.log('Service Workers not supported in this environment');
      return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered for push notifications');
      } catch (error) {
        console.log('Service Worker registration failed (environment limitation):', error.message);
      }
    }
  }

  private static async initializeWebSockets(): Promise<void> {
    // Initialize custom WebSocket connections if needed
    // This would be for real-time price feeds, market data, etc.
  }

  private static handleSystemMessage(payload: any): void {
    const { message, type } = payload.payload;
    
    // Show system message to user
    if (type === 'error') {
      alert(`System Alert: ${message}`);
    } else {
      console.log(`System Message: ${message}`);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  static cleanup(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }
}
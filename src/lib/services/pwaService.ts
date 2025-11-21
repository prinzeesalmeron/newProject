import { supabase } from '../supabase';

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class PWAService {
  private deferredPrompt: InstallPromptEvent | null = null;
  private isStandalone = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.trackEvent('install_prompt_shown');
    });

    window.addEventListener('appinstalled', () => {
      this.trackEvent('app_installed');
      this.deferredPrompt = null;
    });
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      this.trackEvent('install_prompt_response', { outcome });

      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isStandalone;
  }

  isInstalledApp(): boolean {
    return this.isStandalone;
  }

  async registerPushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      await this.savePushSubscription(subscription);
      this.trackEvent('push_notification_enabled');

      return true;
    } catch (error) {
      console.error('Push notification registration failed:', error);
      return false;
    }
  }

  async unregisterPushNotifications(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removePushSubscription(subscription.endpoint);
        this.trackEvent('push_notification_disabled');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Push notification unregister failed:', error);
      return false;
    }
  }

  getNotificationPermission(): NotificationPermissionState {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, prompt: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      prompt: permission === 'default'
    };
  }

  async sendLocalNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } catch (error) {
      console.error('Local notification failed:', error);
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      await registration.update();
      return registration.waiting !== null;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }

  async applyUpdate(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration || !registration.waiting) return;

      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Apply update failed:', error);
    }
  }

  async shareContent(data: ShareData): Promise<boolean> {
    if (!navigator.share) {
      console.log('Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      this.trackEvent('content_shared', { type: data.url ? 'url' : 'text' });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }

  async addToHomeScreen(): Promise<void> {
    const installed = await this.installApp();
    if (installed) {
      await this.sendLocalNotification(
        'BlockEstate Installed!',
        {
          body: 'Access BlockEstate anytime from your home screen',
          icon: '/icon-512x512.png'
        }
      );
    }
  }

  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;

    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }

  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  supportsNativeFeatures(): {
    pwa: boolean;
    push: boolean;
    share: boolean;
    camera: boolean;
    geolocation: boolean;
    offline: boolean;
  } {
    return {
      pwa: 'serviceWorker' in navigator,
      push: 'PushManager' in window && 'Notification' in window,
      share: 'share' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      geolocation: 'geolocation' in navigator,
      offline: 'onLine' in navigator
    };
  }

  async getStorageUsage(): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return { used: 0, quota: 0, percentage: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;

      return { used, quota, percentage };
    } catch (error) {
      console.error('Storage estimate failed:', error);
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  async clearCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      this.trackEvent('cache_cleared');
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          keys: JSON.stringify(subscription.toJSON().keys),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });
    } catch (error) {
      console.error('Save push subscription failed:', error);
    }
  }

  private async removePushSubscription(endpoint: string): Promise<void> {
    try {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    } catch (error) {
      console.error('Remove push subscription failed:', error);
    }
  }

  private trackEvent(event: string, data?: Record<string, any>): void {
    try {
      if (window.mixpanel) {
        window.mixpanel.track(`PWA: ${event}`, data);
      }
    } catch (error) {
      console.error('Track event failed:', error);
    }
  }
}

export const pwaService = new PWAService();

declare global {
  interface Window {
    mixpanel?: any;
  }
}

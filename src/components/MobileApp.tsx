import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Bell, Zap, Shield, TrendingUp } from 'lucide-react';
import { RealTimeService } from '../lib/services/realTimeService';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';

export const MobileApp = () => {
  const { user } = useAuth();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    checkPushSupport();
    checkInstallability();
  }, []);

  const checkPushSupport = () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      checkPushSubscription();
    }
  };

  const checkPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setPushSubscribed(!!subscription);
    } catch (error) {
      console.error('Push subscription check failed:', error);
    }
  };

  const checkInstallability = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    });
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;

    try {
      const result = await installPrompt.prompt();
      console.log('Install prompt result:', result);
      
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('App installation failed:', error);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!pushSupported || !user) return;

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'your-vapid-public-key' // Replace with actual VAPID key
        });

        // Store subscription in database
        await RealTimeService.storePushSubscription(user.id, subscription);
        
        setPushSubscribed(true);
        
        // Send test notification
        await RealTimeService.sendPushNotification(
          user.id,
          'Notifications Enabled!',
          'You\'ll now receive important updates about your investments.'
        );

      } else {
        alert('Push notifications permission denied');
      }

    } catch (error) {
      console.error('Push notification setup failed:', error);
      alert('Failed to enable push notifications');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Smartphone className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          BlockEstate Mobile Experience
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Get the full BlockEstate experience on your mobile device with our Progressive Web App
        </p>
      </div>

      {/* PWA Installation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Install BlockEstate App</h3>
            <p className="text-blue-100 mb-4">
              Add BlockEstate to your home screen for quick access and native app experience
            </p>
            <div className="flex items-center space-x-4 text-sm text-blue-100">
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4" />
                <span>Instant loading</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bell className="h-4 w-4" />
                <span>Push notifications</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Offline support</span>
              </div>
            </div>
          </div>
          <div>
            {isInstallable ? (
              <button
                onClick={handleInstallApp}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Install App</span>
              </button>
            ) : (
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-sm text-blue-100">App Installed</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Push Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stay updated with real-time investment alerts and property updates
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              pushSubscribed 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {pushSubscribed ? 'Enabled' : 'Disabled'}
            </div>
            
            {!pushSubscribed && pushSupported && (
              <button
                onClick={handleEnablePushNotifications}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>

        {pushSubscribed && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Investment Updates</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified when your investments perform well or need attention
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Rental Income</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive alerts when rental income is distributed to your wallet
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Market Opportunities</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Be first to know about new property listings and investment opportunities
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Mobile Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mobile-Optimized Features</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Touch-optimized interface</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Offline property browsing</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Quick investment actions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Biometric authentication</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Real-time portfolio updates</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Benefits</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">App Load Time</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">&lt; 2 seconds</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Data Usage</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">90% less</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Battery Usage</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">Optimized</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Offline Support</span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Available</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Installation Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Installation Instructions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">iOS (Safari)</h4>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. Open BlockEstate in Safari</li>
              <li>2. Tap the Share button</li>
              <li>3. Select "Add to Home Screen"</li>
              <li>4. Tap "Add" to confirm</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Android (Chrome)</h4>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. Open BlockEstate in Chrome</li>
              <li>2. Tap the menu (three dots)</li>
              <li>3. Select "Add to Home screen"</li>
              <li>4. Tap "Add" to confirm</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
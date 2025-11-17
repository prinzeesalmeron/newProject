import React, { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, can't be disabled
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('cookie_consent');
    if (!consentGiven) {
      // Show banner after 1 second delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(consentGiven);
        setPreferences(savedPrefs);
        applyCookieSettings(savedPrefs);
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
      }
    }
  }, []);

  const applyCookieSettings = (prefs: CookiePreferences) => {
    // Apply analytics cookies
    if (prefs.analytics) {
      // Initialize Google Analytics, Mixpanel, etc.
      if (window.mixpanel) {
        window.mixpanel.opt_in_tracking();
      }
    } else {
      // Disable analytics
      if (window.mixpanel) {
        window.mixpanel.opt_out_tracking();
      }
    }

    // Apply marketing cookies
    if (prefs.marketing) {
      // Initialize marketing pixels, ads, etc.
    } else {
      // Disable marketing cookies
    }
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    applyCookieSettings(prefs);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptSelected = () => {
    savePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const rejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false
    };
    setPreferences(essentialOnly);
    savePreferences(essentialOnly);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Main Banner */}
              {!showSettings && (
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Cookie className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        We Value Your Privacy
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
                        By clicking "Accept All," you consent to our use of cookies.
                        You can manage your preferences at any time.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Read our{' '}
                        <a href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
                          Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href="/terms-of-service" className="text-blue-600 dark:text-blue-400 hover:underline">
                          Terms of Service
                        </a>
                      </p>
                    </div>

                    <button
                      onClick={() => setShowBanner(false)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={acceptAll}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={rejectAll}
                      className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Customize</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              {showSettings && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Cookie Preferences
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Essential Cookies */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          Essential Cookies
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Required for the website to function properly. Cannot be disabled.
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Always On
                        </span>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          Analytics Cookies
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Help us understand how visitors interact with our website.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences.analytics ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          Marketing Cookies
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Used to deliver personalized advertisements and track campaign performance.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences.marketing ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={acceptSelected}
                      className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

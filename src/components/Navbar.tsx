import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AuthModal } from './AuthModal';
import { UserProfile } from './UserProfile';
import { ThemeToggle } from './ThemeToggle';
import { WalletButton } from './WalletButton';
import { NetworkSwitcher } from './NetworkSwitcher';

export const Navbar = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Listen for auth state changes
  useEffect(() => {
    // No need for manual event listeners since useAuth handles state automatically
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BE</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">BlockEstate</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/blockchain"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/blockchain')
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Blockchain
            </Link>
            <Link
              to="/learn"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/learn')
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Learn
            </Link>
            <Link
              to="/portfolio"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/portfolio')
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Portfolio
            </Link>
            <Link
              to="/payments"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/payments')
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Payments
            </Link>
            <Link
              to="/governance"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/governance')
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Governance
            </Link>
            <Link
              to="/staking"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/staking')
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Staking
            </Link>
            {user && (
              <Link
                to="/dashboard"
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          

          {/* User Authentication */}
          <div className="flex items-center space-x-4">
            {/* Network Switcher */}
            <NetworkSwitcher />

            {/* Wallet Button */}
            <WalletButton />

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden mobile-menu-button p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            {user ? (
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {profile?.full_name || user.email || 'Profile'}
                </span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ zIndex: 9999 }}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          {/* Mobile Menu Panel */}
          <div className="mobile-menu fixed top-0 right-0 h-full w-80 max-w-sm bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BE</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">BlockEstate</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col py-2">
              <Link
                to="/"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent'
                }`}
              >
                🏠 Marketplace
              </Link>
              <Link
                to="/blockchain"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/blockchain')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent'
                }`}
              >
                🔗 Blockchain
              </Link>
              <Link
                to="/learn"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/learn')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent'
                }`}
              >
                📚 Learn
              </Link>
              <Link
                to="/portfolio"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/portfolio')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent'
                }`}
              >
                📊 Portfolio
              </Link>
              <Link
                to="/payments"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/payments')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent'
                }`}
              >
                💳 Payments
              </Link>
              <Link
                to="/governance"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/governance')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent'
                }`}
              >
                🗳️ Governance
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                    isActive('/dashboard')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent'
                  }`}
                >
                  📊 Dashboard
                </Link>
              )}
            </div>

            {/* Mobile Menu Footer Info */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <strong>BlockEstate</strong> - Real Estate Investment Platform
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user ? 'Welcome back! Start investing in real estate' : 'Sign in to start investing in real estate'}
              </div>
            </div>

            {/* Mobile Auth Section */}
            <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {user ? 'Signed In' : 'Sign in to get started'}
                </p>
                <div className="flex justify-center">
                  {user ? (
                    <button
                      onClick={() => setShowProfile(true)}
                      className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setShowAuthModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('register');
                          setShowAuthModal(true);
                        }}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </nav>
  );
};
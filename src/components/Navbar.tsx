import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useWallet } from '../lib/wallet';
import { WalletButton } from './WalletButton';

export const Navbar = () => {
  const location = useLocation();
  const { isConnected } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <nav className="bg-white shadow-sm border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BE</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BlockEstate</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/staking"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/staking') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Staking
            </Link>
            <Link
              to="/learn"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/learn') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Learn
            </Link>
            {isConnected && (
              <Link
                to="/dashboard"
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden mobile-menu-button p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ zIndex: 9999 }}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          {/* Mobile Menu Panel */}
          <div className="mobile-menu fixed top-0 right-0 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BE</span>
                </div>
                <span className="text-xl font-bold text-gray-900">BlockEstate</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col py-2">
              <Link
                to="/"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/') 
                    ? 'text-blue-600 bg-blue-50 border-l-blue-600' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 border-l-transparent'
                }`}
              >
                🏠 Marketplace
              </Link>
              <Link
                to="/staking"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/staking') 
                    ? 'text-blue-600 bg-blue-50 border-l-blue-600' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 border-l-transparent'
                }`}
              >
                💰 Staking
              </Link>
              <Link
                to="/learn"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/learn') 
                    ? 'text-blue-600 bg-blue-50 border-l-blue-600' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 border-l-transparent'
                }`}
              >
                📚 Learn
              </Link>
              <Link
                to="/dashboard"
                className={`px-6 py-4 text-base font-medium transition-colors border-l-4 ${
                  isActive('/dashboard') 
                    ? 'text-blue-600 bg-blue-50 border-l-blue-600' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 border-l-transparent'
                }`}
              >
                📊 Dashboard {!isConnected && <span className="text-xs text-gray-500 ml-2">(Connect wallet)</span>}
              </Link>
            </div>

            {/* Mobile Menu Footer Info */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">
                <strong>BlockEstate</strong> - Real Estate Investment Platform
              </div>
              <div className="text-xs text-gray-500">
                Connect your wallet to start investing in tokenized real estate
              </div>
            </div>

            {/* Mobile Wallet Section */}
            <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white shadow-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  {isConnected ? 'Wallet Connected' : 'Connect your wallet to get started'}
                </p>
                <div className="flex justify-center">
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
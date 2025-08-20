import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BE</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">BlockEstate</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Democratizing real estate investment through blockchain technology. Start building wealth with fractional property ownership.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/staking" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Staking
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Learn
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  White Paper
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Security Audit
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Stay Updated */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Get the latest news and updates about new properties and platform features.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-r-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span>support@blockestate.us</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span>San Francisco, CA</span>
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Cookie Policy</a>
            </div>
          </div>

          <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 BlockEstate. All rights reserved.</p>
          </div>

          <div className="text-center mt-4 text-xs text-gray-400 dark:text-gray-500">
            <p>
              <strong>Disclaimer:</strong> This platform is operated by BlockEstate, Inc., which is not a registered broker-dealer or investment advisor. BlockEstate does not provide investment advice, endorsement or recommendations with respect to any properties listed on this platform. Nothing on this website should be construed as an offer to sell, solicitation of an offer to buy or a recommendation in respect of a security. You are solely responsible for determining whether any investment, investment strategy or related transaction is appropriate for you based on your personal investment objectives, financial circumstances and risk tolerance. All investments involve risk and may result in partial or total loss. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
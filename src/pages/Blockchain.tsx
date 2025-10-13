import React, { useState } from 'react';
import { Code, Zap, Shield, TrendingUp, ArrowUpDown, DollarSign } from 'lucide-react';
import { WalletConnector } from '../components/blockchain/WalletConnector';
import { useWalletConnector } from '../lib/blockchain/walletConnector';
import { motion } from 'framer-motion';

export const Blockchain = () => {
  const { isConnected } = useWalletConnector();
  const [activeSection, setActiveSection] = useState<'wallet'>('wallet');

  const sections = [
    { id: 'wallet', label: 'Wallet Connection', icon: Shield, description: 'Connect and manage your wallet' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Blockchain Integration
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the future of real estate investment with our fully integrated blockchain platform
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveSection(section.id as any)}
                className={`p-6 rounded-xl text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:shadow-md border border-gray-200 dark:border-gray-700'
                }`}
              >
                <section.icon className={`h-8 w-8 mb-3 ${
                  activeSection === section.id ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                }`} />
                <h3 className="font-semibold mb-2">{section.label}</h3>
                <p className={`text-sm ${
                  activeSection === section.id ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {section.description}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Active Section Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeSection === 'wallet' && <WalletConnector />}
        </div>
      </section>

      {/* Testnet Information */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Running on Sepolia Testnet</span>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Live Testnet Deployment
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              All smart contracts are deployed and audited on Sepolia testnet. Experience real blockchain interactions with test tokens.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Property Tokens</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">0x742d...Da5e</p>
                <a 
                  href="https://sepolia.etherscan.io/address/0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View on Etherscan
                </a>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Marketplace</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">0x8464...8bC</p>
                <a 
                  href="https://sepolia.etherscan.io/address/0x8464135c8F25Da09e49BC8782676a84730C318bC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View on Etherscan
                </a>
              </div>
              
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
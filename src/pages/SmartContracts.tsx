import React from 'react';
import { SmartContractInterface } from '../components/SmartContractInterface';
import { Code, Shield, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const SmartContracts = () => {
  const features = [
    {
      icon: <Code className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Property Tokenization",
      description: "Convert real estate into tradeable ERC-1155 tokens with fractional ownership capabilities."
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />,
      title: "Secure Staking",
      description: "Stake BLOCK tokens in various pools with different APY rates and lock periods."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
      title: "Instant Transactions",
      description: "Fast and efficient blockchain transactions with real-time status updates."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
      title: "Automated Rewards",
      description: "Automatic distribution of rental income and staking rewards to token holders."
    }
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
              Smart Contract Interface
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Interact directly with BlockEstate smart contracts. Stake tokens, transfer assets, and manage your blockchain investments.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Smart Contract Interface */}
          <SmartContractInterface />
        </div>
      </section>

      {/* Contract Information */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              BlockEstate uses a suite of smart contracts to enable decentralized real estate investment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Contract Architecture</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">BLOCK Token (ERC-20)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The native utility token used for staking, governance, and transaction fees within the ecosystem.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Property Tokens (ERC-1155)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Multi-token standard allowing fractional ownership of real estate properties with unique metadata.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Staking Contract</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manages token staking pools with different APY rates, lock periods, and reward distributions.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Marketplace Contract</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Handles property listings, token sales, and automated rental income distribution to investors.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Features</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Multi-Signature Wallets</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Critical operations require multiple signatures for enhanced security.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Audited Code</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All smart contracts undergo thorough security audits by leading firms.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Upgradeable Contracts</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Proxy pattern allows for secure upgrades while preserving user funds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Emergency Pause</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Circuit breaker mechanism to halt operations in case of emergencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
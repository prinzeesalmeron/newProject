import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowUpDown, Shield, TrendingUp, DollarSign, Zap, Banknote } from 'lucide-react';
import { PaymentMethodManager } from '../components/PaymentMethodManager';
import { CryptoConverter } from '../components/CryptoConverter';
import { EscrowManager } from '../components/EscrowManager';
import { FiatPaymentGateway } from '../components/FiatPaymentGateway';
import { PaymentService } from '../lib/services/paymentService';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';

export const Payments = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'fiat' | 'methods' | 'converter' | 'escrow' | 'analytics'>('fiat');

  const sections = [
    {
      id: 'fiat',
      label: 'Fiat Gateway',
      icon: Banknote,
      description: 'Add credit/debit cards & bank accounts'
    },
    {
      id: 'methods',
      label: 'Payment Methods',
      icon: CreditCard,
      description: 'Manage your payment methods'
    },
    {
      id: 'converter',
      label: 'Crypto Converter',
      icon: ArrowUpDown,
      description: 'Convert fiat to crypto'
    },
    {
      id: 'escrow',
      label: 'Escrow Manager',
      icon: Shield,
      description: 'Secure transaction management'
    },
    {
      id: 'analytics',
      label: 'Payment Analytics',
      icon: TrendingUp,
      description: 'Track your payment history'
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
              Payment Center
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Manage your payment methods, convert currencies, and track secure transactions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section Navigation */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
          {activeSection === 'fiat' && <FiatPaymentGateway />}
          {activeSection === 'methods' && <PaymentMethodManager />}
          {activeSection === 'converter' && <CryptoConverter />}
          {activeSection === 'escrow' && <EscrowManager />}
          {activeSection === 'analytics' && <PaymentAnalytics />}
        </div>
      </section>

      {/* Security Features */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Your payments are protected by industry-leading security measures
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                PCI Compliance
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All payment data is processed through PCI DSS Level 1 compliant systems
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Instant Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fast payment processing with real-time transaction updates
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Escrow Protection
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Funds are held securely until transaction conditions are met
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const PaymentAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      const data = await PaymentService.getPaymentAnalytics(timeframe);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading payment analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Analytics</h3>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              ${analytics.total_volume.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {analytics.total_transactions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              ${analytics.average_transaction.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Transaction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {analytics.success_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>No payment data available</p>
        </div>
      )}
    </div>
  );
};
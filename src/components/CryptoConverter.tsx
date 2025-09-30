import React, { useState, useEffect } from 'react';
import { ArrowUpDown, DollarSign, Zap, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { PaymentService } from '../lib/services/paymentService';
import { useAuth } from '../lib/auth';
import { toast } from './ui/Toast';
import { motion } from 'framer-motion';

export const CryptoConverter = () => {
  const { user } = useAuth();
  const [fromCurrency, setFromCurrency] = useState<'USD' | 'ETH'>('USD');
  const [toCurrency, setToCurrency] = useState<'ETH'>('ETH');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadExchangeRates();
    const interval = setInterval(loadExchangeRates, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fromAmount && exchangeRates[`${fromCurrency}_${toCurrency}`]) {
      calculateConversion();
    }
  }, [fromAmount, fromCurrency, toCurrency, exchangeRates]);

  const loadExchangeRates = async () => {
    try {
      const rates = await PaymentService.getExchangeRates();
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    }
  };

  const calculateConversion = () => {
    const rate = exchangeRates[`${fromCurrency}_${toCurrency}`];
    if (rate && fromAmount) {
      const amount = parseFloat(fromAmount);
      const feePercentage = 0.5; // 0.5% conversion fee
      const netAmount = amount * (1 - feePercentage / 100);
      const converted = netAmount * rate;
      setToAmount(converted.toFixed(6));
    }
  };

  const handleSwapCurrencies = () => {
    if (fromCurrency === 'USD' && toCurrency === 'ETH') {
      setFromCurrency('ETH');
      setToCurrency('ETH');
    } else if (fromCurrency === 'ETH' && toCurrency === 'ETH') {
      setFromCurrency('USD');
      setToCurrency('ETH');
    } else {
      setFromCurrency('USD');
      setToCurrency('ETH');
    }
    setFromAmount('');
    setToAmount('');
  };

  const handleConvert = async () => {
    if (!user || !fromAmount || !toAmount) return;

    try {
      setConverting(true);
      
      const conversion = await PaymentService.convertFiatToCrypto(
        user.id,
        parseFloat(fromAmount),
        fromCurrency as 'USD',
        toCurrency
      );

      toast.success(
        'Conversion Successful!',
        `Converted ${fromAmount} ${fromCurrency} to ${conversion.to_amount.toFixed(2)} ${toCurrency}`
      );

      // Reset form
      setFromAmount('');
      setToAmount('');

    } catch (error: any) {
      console.error('Conversion failed:', error);
      toast.error('Conversion Failed', error.message || 'Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const currentRate = exchangeRates[`${fromCurrency}_${toCurrency}`];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <ArrowUpDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crypto Converter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Convert fiat to crypto instantly</p>
          </div>
        </div>
        <button
          onClick={loadExchangeRates}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Exchange Rate Display */}
      {currentRate && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Rate:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              1 {fromCurrency} = {currentRate.toFixed(6)} {toCurrency}
            </span>
          </div>
        </div>
      )}

      {/* Conversion Form */}
      <div className="space-y-4">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            From
          </label>
          <div className="relative">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-4 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as 'USD' | 'ETH')}
                className="bg-transparent text-gray-700 dark:text-gray-300 font-medium focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapCurrencies}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To
          </label>
          <div className="relative">
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="w-full pl-4 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as 'BLOCK' | 'ETH')}
                className="bg-transparent text-gray-700 dark:text-gray-300 font-medium focus:outline-none"
              >
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conversion Details */}
        {fromAmount && toAmount && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Exchange Rate:</span>
              <span className="text-gray-900 dark:text-white">{currentRate?.toFixed(6)} {toCurrency}/{fromCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Conversion Fee (0.5%):</span>
              <span className="text-gray-900 dark:text-white">${(parseFloat(fromAmount) * 0.005).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 font-semibold">
              <span className="text-gray-900 dark:text-white">You'll receive:</span>
              <span className="text-gray-900 dark:text-white">{toAmount} {toCurrency}</span>
            </div>
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!user || !fromAmount || !toAmount || converting}
          className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {converting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Converting...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>{user ? 'Convert Now' : 'Sign In to Convert'}</span>
            </>
          )}
        </button>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Rates update every 30 seconds. Actual rate may vary slightly at execution.
        </div>
      </div>
    </motion.div>
  );
};
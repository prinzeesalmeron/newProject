import React, { useState } from 'react';
import { Code, Play, Database, Copy, Check } from 'lucide-react';
import { ApiDocumentation } from '../components/ApiDocumentation';
import { motion } from 'framer-motion';

export const ApiTesting = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/properties');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

  const testEndpoint = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const url = `${baseUrl}${selectedEndpoint}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">API Testing</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Test and explore the BlockEstate API endpoints to access your data programmatically.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* API Tester */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">API Tester</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Endpoint
                  </label>
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="/properties">GET /properties</option>
                    <option value="/users">GET /users</option>
                    <option value="/transactions">GET /transactions</option>
                    <option value="/staking-pools">GET /staking-pools</option>
                    <option value="/shares">GET /shares</option>
                    <option value="/analytics/overview">GET /analytics/overview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white">
                      {baseUrl}{selectedEndpoint}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${baseUrl}${selectedEndpoint}`);
                      }}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={testEndpoint}
                  disabled={loading}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>{loading ? 'Testing...' : 'Test Endpoint'}</span>
                </button>
              </div>

              {/* Response */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Response</h3>
                <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 min-h-[200px]">
                  {loading && (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="text-red-400 text-sm">
                      <div className="font-semibold mb-2">Error:</div>
                      <pre>{error}</pre>
                    </div>
                  )}
                  
                  {response && !loading && (
                    <pre className="text-green-400 text-sm overflow-auto">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  )}
                  
                  {!response && !loading && !error && (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Click "Test Endpoint" to see the API response
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Documentation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ApiDocumentation />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
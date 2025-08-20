import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Home, BarChart3, Download, MoreHorizontal, Plus, Code, Zap } from 'lucide-react';
import { Investment, UserProfile, mockApi } from '../lib/mockData';
import { useAuth } from '../lib/auth';
import { useWallet } from '../lib/wallet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

export const InvestmentDashboard = () => {
  const { user } = useAuth();
  const { isConnected, address, blockBalance } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');

  // Empty performance data - will be populated when user has investments
  const performanceData: any[] = [];

  // Empty allocation data - will be populated when user has investments
  const allocationData: any[] = [];

  const tabs = [
    { id: 'properties', label: 'My Properties' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'income', label: 'Income History' },
    { id: 'blockchain', label: 'Blockchain' }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const profileData = await mockApi.getUserProfile();
      setProfile(profileData);

      // Fetch investments with property details
      const investmentsData = await mockApi.getInvestments();
      setInvestments(investmentsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalValue: investments.reduce((sum, inv) => sum + inv.current_value, 0),
    monthlyIncome: investments.reduce((sum, inv) => sum + inv.monthly_income, 0),
    propertiesOwned: investments.length,
    averageYield: investments.length > 0 ? investments.reduce((sum, inv) => sum + inv.total_return, 0) / investments.length : 0,
    blockBalance: blockBalance || 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Sign in to your account to view your real estate investment portfolio and manage your properties.
            </p>
            <div className="bg-white rounded-xl p-8 shadow-lg max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Sign In?</h3>
              <ul className="text-left space-y-3 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  View your property investments
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Track your portfolio performance
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Monitor rental income
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Manage your account settings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-white dark:bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Investment Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your real estate portfolio performance and manage your investments</p>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Portfolio Value</div>
                <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalValue.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stats.totalValue > 0 ? '+0% from last month' : 'No investments yet'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Income</div>
                <TrendingUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${stats.monthlyIncome.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stats.monthlyIncome > 0 ? '+0% from last month' : 'No income yet'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Properties Owned</div>
                <Home className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.propertiesOwned}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stats.propertiesOwned > 0 ? `Across ${Math.min(stats.propertiesOwned, 3)} different markets` : 'Start investing today'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Yield</div>
                <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageYield.toFixed(1)}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Portfolio average</div>
            </motion.div>

            {/* BLOCK Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">BLOCK Balance</div>
                <Zap className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.blockBalance.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected ? 'Wallet connected' : 'Connect wallet'}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Portfolio Performance</h3>
                  <div className="flex items-center space-x-4">
                    <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">7d</button>
                    <button className="text-sm bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-md">30d</button>
                    <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">90d</button>
                    <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">1y</button>
                  </div>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                {performanceData.length === 0 ? (
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📈</div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No performance data yet</h4>
                    <p className="text-gray-600 dark:text-gray-400">Start investing to see your portfolio performance over time.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Portfolio Allocation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Portfolio Allocation</h3>
              <div className="h-64 flex items-center justify-center">
                {allocationData.length === 0 ? (
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">🥧</div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No allocation data yet</h4>
                    <p className="text-gray-600 dark:text-gray-400">Invest in different property types to see your portfolio allocation.</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-3">
                      {allocationData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Properties Table */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {activeTab === 'properties' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Properties</h3>
                  <button className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Add Investment</span>
                  </button>
                </div>
                {investments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏠</div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No investments yet</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Start building your real estate portfolio by investing in tokenized properties.</p>
                    <button className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                      Browse Properties
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {investments.map((investment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{investment.property?.title || 'Property'}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{investment.property?.location || 'Location'}</p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{investment.tokens_owned} tokens</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">${investment.current_value.toLocaleString()} value</p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{investment.total_return}% yield</p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">+${investment.monthly_income}/mo</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                        </div>
                        <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Transaction History</h3>
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💳</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions yet</h4>
                  <p className="text-gray-600 dark:text-gray-400">Your investment transactions will appear here once you start investing.</p>
                </div>
              </div>
            )}

            {activeTab === 'income' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Income History</h3>
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💰</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No income history yet</h4>
                  <p className="text-gray-600 dark:text-gray-400">Your rental income and dividend payments will be tracked here.</p>
                </div>
              </div>
            )}

            {activeTab === 'blockchain' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Blockchain Integration</h3>
                </div>
                
                {isConnected ? (
                  <div className="space-y-6">
                    {/* Wallet Status */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800 dark:text-green-400">Wallet Connected</span>
                        <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 font-mono break-all">
                        {address}
                      </div>
                    </div>

                    {/* Token Balances */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">BLOCK Tokens</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{blockBalance.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Available for staking</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Property Tokens</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{investments.reduce((sum, inv) => sum + inv.tokens_owned, 0)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Across {investments.length} properties</div>
                      </div>
                    </div>
                    {/* Quick Actions */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button className="flex items-center justify-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                          <Zap className="h-4 w-4" />
                          <span>Stake Tokens</span>
                        </button>
                        <button className="flex items-center justify-center space-x-2 bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
                          <TrendingUp className="h-4 w-4" />
                          <span>Buy Property</span>
                        </button>
                        <button className="flex items-center justify-center space-x-2 bg-purple-600 dark:bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors">
                          <Code className="h-4 w-4" />
                          <span>View Contracts</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔗</div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Connect your wallet to interact with smart contracts and view blockchain data.</p>
                    <button className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
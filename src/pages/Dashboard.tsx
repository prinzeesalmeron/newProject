import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Home, BarChart3, Download, MoreHorizontal } from 'lucide-react';
import { Investment, UserProfile, supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

export const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');

  // Mock data for charts
  const performanceData = [
    { date: '2024-01-01', value: 15000 },
    { date: '2024-01-15', value: 16200 },
    { date: '2024-02-01', value: 17500 },
    { date: '2024-02-15', value: 18300 },
    { date: '2024-03-01', value: 19100 },
    { date: '2024-03-15', value: 19800 },
    { date: '2024-04-01', value: 19525 }
  ];

  const allocationData = [
    { name: 'Single Family', value: 45, color: '#8B5CF6' },
    { name: 'Multi Family', value: 30, color: '#10B981' },
    { name: 'Commercial', value: 15, color: '#F59E0B' },
    { name: 'Vacation Rentals', value: 10, color: '#EF4444' }
  ];

  const tabs = [
    { id: 'properties', label: 'My Properties' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'income', label: 'Income History' }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      setUser(userData.user);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch investments with property details
      const { data: investmentsData } = await supabase
        .from('investments')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('user_id', userData.user.id);

      if (investmentsData) {
        setInvestments(investmentsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalValue: profile?.total_portfolio_value || 19525,
    monthlyIncome: 134.17,
    propertiesOwned: investments.length || 3,
    averageYield: 8.3
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Dashboard</h1>
              <p className="text-gray-600">Track your real estate portfolio performance and manage your investments</p>
            </motion.div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="font-semibold text-gray-900">
                {user.user_metadata?.full_name || user.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Total Portfolio Value</div>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</div>
              <div className="text-sm text-green-500">+15.2% from last month</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Monthly Income</div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">${stats.monthlyIncome}</div>
              <div className="text-sm text-blue-500">+8.2% from last month</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Properties Owned</div>
                <Home className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.propertiesOwned}</div>
              <div className="text-sm text-gray-500">Across 3 different markets</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Average Yield</div>
                <BarChart3 className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.averageYield}%</div>
              <div className="text-sm text-gray-500">Above market average</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="text-sm text-gray-500 hover:text-gray-700">7d</button>
                    <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded">30d</button>
                    <button className="text-sm text-gray-500 hover:text-gray-700">90d</button>
                    <button className="text-sm text-gray-500 hover:text-gray-700">1y</button>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Portfolio Allocation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Allocation</h3>
              <div className="h-64">
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
              </div>
              <div className="mt-4 space-y-2">
                {allocationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Properties Table */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex space-x-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {activeTab === 'properties' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Properties</h3>
                <div className="space-y-4">
                  {/* Sample property rows */}
                  {[
                    {
                      name: "Modern Luxury Villa",
                      location: "Miami, FL",
                      tokens: 150,
                      value: "$7,050",
                      yield: "8.5%",
                      income: "+$47.25/mo",
                      status: "Active"
                    },
                    {
                      name: "Contemporary Family Home",
                      location: "Austin, TX",
                      tokens: 75,
                      value: "$4,875",
                      yield: "7.2%",
                      income: "+$29.25/mo",
                      status: "Active"
                    },
                    {
                      name: "Investment Property Complex",
                      location: "Denver, CO",
                      tokens: 200,
                      value: "$7,600",
                      yield: "9.1%",
                      income: "+$57.67/mo",
                      status: "Active"
                    }
                  ].map((property, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{property.name}</h4>
                          <p className="text-sm text-gray-500">{property.location}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold">{property.tokens} tokens</p>
                        <p className="text-sm text-gray-500">{property.value} value</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold">{property.yield} yield</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-green-600">{property.income}</p>
                        <p className="text-sm text-gray-500">{property.status}</p>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
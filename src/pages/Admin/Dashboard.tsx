import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Home, TrendingUp, AlertTriangle, Activity, Shield, Mail, BookOpen, FileCheck, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link, Navigate } from 'react-router-dom';
import { adminService } from '../../lib/services/adminService';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  totalTransactions: number;
  totalVolume: number;
  pendingKYC: number;
  securityAlerts: number;
  systemHealth: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProperties: 0,
    totalTransactions: 0,
    totalVolume: 0,
    pendingKYC: 0,
    securityAlerts: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const isUserAdmin = await adminService.isAdmin(user.id);
      setIsAdmin(isUserAdmin);

      if (isUserAdmin) {
        loadDashboardStats();
      }
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAdmin(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        usersResult,
        propertiesResult,
        transactionsResult,
        securityEventsResult
      ] = await Promise.all([
        supabase.from('users').select('id, created_at', { count: 'exact' }),
        supabase.from('properties').select('id', { count: 'exact' }),
        supabase.from('transactions').select('amount', { count: 'exact' }),
        supabase.from('security_events').select('id', { count: 'exact' }).eq('resolved', false)
      ]);

      // Calculate active users (logged in within 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: activeCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Calculate total volume
      const totalVolume = transactionsResult.data?.reduce(
        (sum, t) => sum + (parseFloat(t.amount) || 0),
        0
      ) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        activeUsers: activeCount || 0,
        totalProperties: propertiesResult.count || 0,
        totalTransactions: transactionsResult.count || 0,
        totalVolume,
        pendingKYC: 0, // Would come from KYC table
        securityAlerts: securityEventsResult.count || 0,
        systemHealth: 'healthy'
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color, link }: any) => (
    <Link
      to={link}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {loading ? '...' : value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </Link>
  );

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of platform operations and metrics
          </p>
        </div>

        {/* System Health Banner */}
        {stats.securityAlerts > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-400">
                  {stats.securityAlerts} Unresolved Security Alerts
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Review and address security events immediately.
                </p>
              </div>
              <Link
                to="/admin/security"
                className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
              >
                Review
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend={12}
            color="bg-blue-600"
            link="/admin/users"
          />
          <StatCard
            title="Active Users (7d)"
            value={stats.activeUsers.toLocaleString()}
            icon={Activity}
            trend={8}
            color="bg-green-600"
            link="/admin/users"
          />
          <StatCard
            title="Total Properties"
            value={stats.totalProperties.toLocaleString()}
            icon={Home}
            trend={5}
            color="bg-purple-600"
            link="/admin/properties"
          />
          <StatCard
            title="Total Volume"
            value={`$${(stats.totalVolume / 1000000).toFixed(1)}M`}
            icon={DollarSign}
            trend={15}
            color="bg-emerald-600"
            link="/admin/transactions"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/admin/users"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-white">Manage Users</span>
              </Link>
              <Link
                to="/admin/properties"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Home className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-gray-900 dark:text-white">Manage Properties</span>
              </Link>
              <Link
                to="/admin/transactions"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-gray-900 dark:text-white">View Transactions</span>
              </Link>
              <Link
                to="/admin/security"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-gray-900 dark:text-white">Security Events</span>
              </Link>
              <Link
                to="/admin/emails"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-gray-900 dark:text-white">Email Logs</span>
              </Link>
              <Link
                to="/admin/learning-hub"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-gray-900 dark:text-white">Learning Hub</span>
              </Link>
              <Link
                to="/admin/compliance"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-gray-900 dark:text-white">Compliance</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-white">Settings</span>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Database</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">API</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Smart Contracts</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email Service</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                  Operational
                </span>
              </div>
            </div>
            <a
              href="/health-check"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              View Detailed Health Check
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Activity monitoring coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}

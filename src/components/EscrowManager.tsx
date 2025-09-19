import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertTriangle, DollarSign, User } from 'lucide-react';
import { PaymentService } from '../lib/services/paymentService';
import { useAuth } from '../lib/auth';
import { toast } from './ui/Toast';
import { motion } from 'framer-motion';

interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  property_id?: string;
  token_amount?: number;
  escrow_fee: number;
  created_at: string;
  expires_at: string;
}

export const EscrowManager = () => {
  const { user } = useAuth();
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');

  useEffect(() => {
    if (user) {
      loadEscrowTransactions();
    }
  }, [user]);

  const loadEscrowTransactions = async () => {
    try {
      // Mock escrow transactions - in production, fetch from database
      const mockTransactions: EscrowTransaction[] = [
        {
          id: 'escrow_1',
          buyer_id: user?.id || '',
          seller_id: 'platform',
          amount: 5000,
          currency: 'USD',
          status: 'funded',
          property_id: 'prop1',
          token_amount: 50,
          escrow_fee: 50,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          expires_at: new Date(Date.now() + 6 * 86400000).toISOString() // 6 days from now
        },
        {
          id: 'escrow_2',
          buyer_id: 'other_user',
          seller_id: user?.id || '',
          amount: 2500,
          currency: 'USD',
          status: 'pending',
          property_id: 'prop2',
          token_amount: 25,
          escrow_fee: 25,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          expires_at: new Date(Date.now() + 6.5 * 86400000).toISOString() // 6.5 days from now
        }
      ];

      setEscrowTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading escrow transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    if (!confirm('Are you sure you want to release the escrow funds?')) return;

    try {
      await PaymentService.releaseEscrowFunds(escrowId, user!.id, 'Manual release by seller');
      
      // Update local state
      setEscrowTransactions(prev => prev.map(tx => 
        tx.id === escrowId ? { ...tx, status: 'released' as const } : tx
      ));

      toast.success('Escrow Released', 'Funds have been released successfully.');
    } catch (error: any) {
      console.error('Error releasing escrow:', error);
      toast.error('Release Failed', error.message);
    }
  };

  const getStatusColor = (status: EscrowTransaction['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'funded': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'released': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'refunded': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
      case 'disputed': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: EscrowTransaction['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'funded': return <Shield className="h-4 w-4" />;
      case 'released': return <CheckCircle className="h-4 w-4" />;
      case 'refunded': return <DollarSign className="h-4 w-4" />;
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const buyerTransactions = escrowTransactions.filter(tx => tx.buyer_id === user?.id);
  const sellerTransactions = escrowTransactions.filter(tx => tx.seller_id === user?.id);

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Sign In Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to view your escrow transactions and manage payments
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Escrow Manager</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Secure transaction management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('buyer')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'buyer'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <User className="h-4 w-4" />
          <span>As Buyer ({buyerTransactions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('seller')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'seller'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>As Seller ({sellerTransactions.length})</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {(activeTab === 'buyer' ? buyerTransactions : sellerTransactions).map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Property Investment
                  </span>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusIcon(transaction.status)}
                    <span className="capitalize">{transaction.status}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Escrow ID: {transaction.id}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${transaction.amount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {transaction.token_amount} tokens
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {new Date(transaction.expires_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            {activeTab === 'seller' && transaction.status === 'funded' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReleaseEscrow(transaction.id)}
                  className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                >
                  Release Funds
                </button>
                <button className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm">
                  Dispute
                </button>
              </div>
            )}

            {activeTab === 'buyer' && transaction.status === 'pending' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Waiting for payment confirmation
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {(activeTab === 'buyer' ? buyerTransactions : sellerTransactions).length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-sm">
              No escrow transactions as {activeTab}
            </p>
            <p className="text-xs mt-1">
              {activeTab === 'buyer' 
                ? 'Your property investments will appear here' 
                : 'Property sales will appear here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
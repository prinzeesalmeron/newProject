import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';
import { adminService } from '../../lib/services/adminService';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface KYCVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_data: any;
  notes?: string;
  created_at: string;
  reviewed_at?: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export default function AdminCompliance() {
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);

  useEffect(() => {
    checkAdminAndLoadVerifications();
  }, [filter]);

  const checkAdminAndLoadVerifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const isUserAdmin = await adminService.isAdmin(user.id);
      setIsAdmin(isUserAdmin);

      if (isUserAdmin) {
        await loadVerifications();
      }
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAdmin(false);
    }
  };

  const loadVerifications = async () => {
    try {
      const statusFilter = filter === 'all' ? undefined : filter;
      const data = await adminService.getKYCVerifications(statusFilter);
      setVerifications(data);
    } catch (error) {
      console.error('Failed to load verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.updateKYCStatus(id, 'approved', 'Verification approved by admin');
      await loadVerifications();
      setSelectedVerification(null);
    } catch (error) {
      console.error('Failed to approve verification:', error);
      alert('Failed to approve verification. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    const notes = prompt('Please provide a reason for rejection:');
    if (!notes) return;

    try {
      await adminService.updateKYCStatus(id, 'rejected', notes);
      await loadVerifications();
      setSelectedVerification(null);
    } catch (error) {
      console.error('Failed to reject verification:', error);
      alert('Failed to reject verification. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-5 w-5" />;
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
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
            Compliance & KYC Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage user identity verifications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {verifications.filter(v => v.status === 'pending').length}
                </p>
              </div>
              <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {verifications.filter(v => v.status === 'approved').length}
                </p>
              </div>
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {verifications.filter(v => v.status === 'rejected').length}
                </p>
              </div>
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Verifications List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading verifications...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No verifications found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all'
                ? 'There are no KYC verifications in the system yet'
                : `No ${filter} verifications found`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div
                key={verification.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {verification.profiles?.name || 'Unknown User'}
                      </h3>
                      <span className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${getStatusBadge(verification.status)}`}>
                        {getStatusIcon(verification.status)}
                        <span className="ml-1">{verification.status}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {verification.profiles?.email}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Submitted: {new Date(verification.created_at).toLocaleDateString()}</span>
                      {verification.reviewed_at && (
                        <span>Reviewed: {new Date(verification.reviewed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    {verification.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Notes:</strong> {verification.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedVerification(verification)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {verification.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(verification.id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="Approve"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleReject(verification.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Reject"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              KYC Verification Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Name
                </label>
                <p className="text-gray-900 dark:text-white">{selectedVerification.profiles?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{selectedVerification.profiles?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center space-x-1 ${getStatusBadge(selectedVerification.status)}`}>
                  {getStatusIcon(selectedVerification.status)}
                  <span className="ml-1">{selectedVerification.status}</span>
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Submission Data
                </label>
                <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedVerification.submission_data, null, 2)}
                </pre>
              </div>

              {selectedVerification.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedVerification.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedVerification(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
              {selectedVerification.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(selectedVerification.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedVerification.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Wallet, Copy, Check, Edit2, Save, X } from 'lucide-react';
import { useWallet } from '../lib/wallet';
import { WalletButton } from './WalletButton';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { isConnected, address, balance, blockBalance, provider, disconnectWallet } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: ''
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      // Get user from localStorage (mock data)
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setEditForm({
          fullName: parsedUser.fullName || '',
          email: parsedUser.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('user');
      disconnectWallet();
      setUser(null);
      window.dispatchEvent(new CustomEvent('userSignedOut'));
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        fullName: editForm.fullName,
        email: editForm.email
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('userUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  placeholder="Full Name"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  placeholder="Email"
                />
                <div className="flex space-x-2 justify-center">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center space-x-1 bg-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.fullName || 'User'}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-2 flex items-center space-x-1 text-blue-600 hover:text-blue-700 mx-auto"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </>
            )}
          </div>

          {/* Wallet Connection */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              Wallet Connection
            </h4>
            
            {isConnected && address ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Connected</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-xs text-green-700 font-mono break-all mb-2">
                    {address}
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">
                      {provider === 'phantom' ? 'SOL' : 'ETH'} Balance
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {balance} {provider === 'phantom' ? 'SOL' : 'ETH'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">BLOCK Balance</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {blockBalance.toLocaleString()} BLOCK
                    </div>
                  </div>
                </div>

                <button
                  onClick={disconnectWallet}
                  className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Connect your wallet to start investing in real estate
                </p>
                <WalletButton />
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </h4>
            
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Change Password
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Notification Settings
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Privacy Settings
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
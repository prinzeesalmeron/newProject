import React, { useState, useEffect } from 'react';
import { Vote, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, MessageSquare, Coins, TrendingUp, Award, Wallet, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: 'parameter' | 'upgrade' | 'treasury' | 'general';
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  endDate: string;
  proposer: string;
  userVote?: 'for' | 'against' | null;
}

export const Governance = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock proposals data
  const mockProposals: Proposal[] = [
    {
      id: '1',
      title: 'Reduce Platform Fee from 2% to 1.5%',
      description: 'Proposal to reduce the platform fee charged on property investments to make the platform more competitive and attractive to investors.',
      type: 'parameter',
      status: 'active',
      votesFor: 15420,
      votesAgainst: 3280,
      totalVotes: 18700,
      quorum: 20000,
      endDate: '2024-02-15T23:59:59Z',
      proposer: '0x1234...5678',
      userVote: null
    },
    {
      id: '2',
      title: 'Add Support for Commercial Real Estate',
      description: 'Expand the platform to include commercial real estate properties such as office buildings, retail spaces, and warehouses.',
      type: 'upgrade',
      status: 'active',
      votesFor: 22100,
      votesAgainst: 8900,
      totalVotes: 31000,
      quorum: 25000,
      endDate: '2024-02-20T23:59:59Z',
      proposer: '0x5678...9012',
      userVote: 'for'
    },
    {
      id: '3',
      title: 'Allocate Treasury Funds for Marketing',
      description: 'Allocate $500,000 from the treasury for a comprehensive marketing campaign to attract more users to the platform.',
      type: 'treasury',
      status: 'passed',
      votesFor: 28500,
      votesAgainst: 12300,
      totalVotes: 40800,
      quorum: 30000,
      endDate: '2024-01-30T23:59:59Z',
      proposer: '0x9012...3456',
      userVote: 'for'
    },
    {
      id: '4',
      title: 'Implement Property Token Governance',
      description: 'Enable property token holders to vote on property-related decisions with voting power based on token holdings.',
      type: 'upgrade',
      status: 'rejected',
      votesFor: 8200,
      votesAgainst: 15800,
      totalVotes: 24000,
      quorum: 20000,
      endDate: '2024-01-15T23:59:59Z',
      proposer: '0x3456...7890',
      userVote: 'against'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setProposals(mockProposals);
      setLoading(false);
    }, 1000);
  }, []);

  const handleVote = (proposalId: string, vote: 'for' | 'against') => {
    if (!user) {
      alert('Please sign in to vote on proposals');
      return;
    }

    setProposals(prev => prev.map(proposal => {
      if (proposal.id === proposalId) {
        const updatedProposal = { ...proposal };
        
        // Remove previous vote if exists
        if (proposal.userVote === 'for') {
          updatedProposal.votesFor -= 1;
        } else if (proposal.userVote === 'against') {
          updatedProposal.votesAgainst -= 1;
        }
        
        // Add new vote
        if (vote === 'for') {
          updatedProposal.votesFor += 1;
        } else {
          updatedProposal.votesAgainst += 1;
        }
        
        updatedProposal.userVote = vote;
        updatedProposal.totalVotes = updatedProposal.votesFor + updatedProposal.votesAgainst;
        
        return updatedProposal;
      }
      return proposal;
    }));

    alert(`Vote "${vote}" recorded successfully!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'passed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'parameter': return <AlertCircle className="h-4 w-4" />;
      case 'upgrade': return <CheckCircle className="h-4 w-4" />;
      case 'treasury': return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === 'active') return proposal.status === 'active';
    if (activeTab === 'passed') return proposal.status === 'passed';
    if (activeTab === 'rejected') return proposal.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Governance</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Participate in BlockEstate's decentralized governance. Vote on proposals and help shape the future of the platform.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Proposal</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Governance Token Banner */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-xl p-8 text-white shadow-lg overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-lg">
                    <Coins className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">BLOCK Governance Token</h2>
                    <p className="text-blue-100 dark:text-purple-100">
                      Hold BLOCK tokens to participate in platform governance and earn rewards
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-right">
                  <div className="text-sm text-blue-100 dark:text-purple-100 mb-1">Your Balance</div>
                  <div className="text-3xl font-bold">2,340 BLOCK</div>
                  <div className="text-sm text-blue-100 dark:text-purple-100 mt-1">≈ $4,680 USD</div>
                  <div className="flex items-center justify-end space-x-1 mt-2 text-green-300">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">+5.2% (24h)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Vote className="h-4 w-4 text-blue-200" />
                    <div className="text-sm text-blue-100 dark:text-purple-100">Voting Power</div>
                  </div>
                  <div className="text-2xl font-bold">2,340</div>
                  <div className="text-xs text-blue-100 dark:text-purple-100 mt-1">1 BLOCK = 1 Vote</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-200" />
                    <div className="text-sm text-blue-100 dark:text-purple-100">Staking APY</div>
                  </div>
                  <div className="text-2xl font-bold">12.5%</div>
                  <div className="text-xs text-blue-100 dark:text-purple-100 mt-1">Earn rewards by staking</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-200" />
                    <div className="text-sm text-blue-100 dark:text-purple-100">Participation Rate</div>
                  </div>
                  <div className="text-2xl font-bold">68%</div>
                  <div className="text-xs text-blue-100 dark:text-purple-100 mt-1">Active voters in last 30d</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4 text-blue-200" />
                    <div className="text-sm text-blue-100 dark:text-purple-100">Rewards Earned</div>
                  </div>
                  <div className="text-2xl font-bold">142.8</div>
                  <div className="text-xs text-blue-100 dark:text-purple-100 mt-1">BLOCK this month</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Buy BLOCK Tokens</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Purchase BLOCK tokens to increase your voting power and earn staking rewards
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Delegate Voting</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Delegate your voting power to trusted community members
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">View History</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review your voting history and participation in governance decisions
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Proposals</div>
                <Vote className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{proposals.length}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Proposals</div>
                <Clock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposals.filter(p => p.status === 'active').length}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Passed Proposals</div>
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposals.filter(p => p.status === 'passed').length}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Voting Power</div>
                <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">2,340</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">voting power</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proposals */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-8">
                {[
                  { id: 'all', label: 'All Proposals' },
                  { id: 'active', label: 'Active' },
                  { id: 'passed', label: 'Passed' },
                  { id: 'rejected', label: 'Rejected' }
                ].map((tab) => (
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
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {filteredProposals.map((proposal, index) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-white dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                            {getTypeIcon(proposal.type)}
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{proposal.type}</span>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)}`}>
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </span>
                          {proposal.status === 'active' && (
                            <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">
                                {Math.ceil((new Date(proposal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                              </span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{proposal.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{proposal.description}</p>

                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>Proposed by {proposal.proposer}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>Ends {new Date(proposal.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Voting Progress */}
                    <div className="mb-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
                      <div className="flex justify-between items-center text-sm mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white">Voting Progress</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()}
                          </span>
                        </div>
                        <span className={`font-bold ${
                          proposal.totalVotes >= proposal.quorum
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {((proposal.totalVotes / proposal.quorum) * 100).toFixed(1)}% {proposal.totalVotes >= proposal.quorum && '✓ Quorum Reached'}
                        </span>
                      </div>

                      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min((proposal.totalVotes / proposal.quorum) * 100, 100)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-700 dark:text-green-300">For</span>
                            </div>
                            <span className="text-sm font-bold text-green-700 dark:text-green-300">
                              {((proposal.votesFor / proposal.totalVotes) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-lg font-bold text-green-900 dark:text-green-100">
                            {proposal.votesFor.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              <span className="text-xs font-medium text-red-700 dark:text-red-300">Against</span>
                            </div>
                            <span className="text-sm font-bold text-red-700 dark:text-red-300">
                              {((proposal.votesAgainst / proposal.totalVotes) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-lg font-bold text-red-900 dark:text-red-100">
                            {proposal.votesAgainst.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Voting Buttons */}
                    {proposal.status === 'active' && (
                      <div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleVote(proposal.id, 'for')}
                            disabled={!user}
                            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                              proposal.userVote === 'for'
                                ? 'bg-green-600 dark:bg-green-500 text-white shadow-lg scale-105'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:bg-green-500 hover:shadow-md'
                            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <CheckCircle className="h-5 w-5" />
                            <span>Vote For</span>
                            {proposal.userVote === 'for' && <span className="text-xs">(Voted)</span>}
                          </button>
                          <button
                            onClick={() => handleVote(proposal.id, 'against')}
                            disabled={!user}
                            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                              proposal.userVote === 'against'
                                ? 'bg-red-600 dark:bg-red-500 text-white shadow-lg scale-105'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 hover:shadow-md'
                            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <XCircle className="h-5 w-5" />
                            <span>Vote Against</span>
                            {proposal.userVote === 'against' && <span className="text-xs">(Voted)</span>}
                          </button>
                        </div>
                        {!user && (
                          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                              Sign in to participate in governance voting
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {filteredProposals.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🗳️</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No proposals found</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeTab === 'active' ? 'No active proposals at the moment.' : `No ${activeTab} proposals found.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Proposal</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🚧</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Proposal creation will be available once the governance system is fully deployed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
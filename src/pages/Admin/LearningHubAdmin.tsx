import React, { useState, useEffect } from 'react';
import { BookOpen, Edit2, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface CourseItem {
  id: string;
  title: string;
  description: string;
  moderation_status: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

interface ArticleItem {
  id: string;
  title: string;
  category: string;
  moderation_status: string;
  published_date: string;
  approved_by?: string;
  approved_at?: string;
}

export default function LearningHubAdmin() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'articles'>('courses');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    try {
      setLoading(true);
      if (activeTab === 'courses') {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data || []);
      } else {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('published_date', { ascending: false });

        if (error) throw error;
        setArticles(data || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      addToast({ type: 'error', message: 'Failed to load content' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: any) => {
    try {
      const table = activeTab === 'courses' ? 'courses' : 'articles';
      const session = await supabase.auth.getSession();

      const { error } = await supabase
        .from(table)
        .update({
          moderation_status: 'approved',
          approved_by: session.data.session?.user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      await logAdminAction('approve', table, item.id, feedback);
      addToast({ type: 'success', message: `${activeTab === 'courses' ? 'Course' : 'Article'} approved` });
      setSelectedItem(null);
      setFeedback('');
      loadContent();
    } catch (error) {
      console.error('Error approving content:', error);
      addToast({ type: 'error', message: 'Failed to approve content' });
    }
  };

  const handleReject = async (item: any) => {
    if (!feedback.trim()) {
      addToast({ type: 'error', message: 'Please provide feedback for rejection' });
      return;
    }

    try {
      const table = activeTab === 'courses' ? 'courses' : 'articles';
      const session = await supabase.auth.getSession();

      const { error } = await supabase
        .from(table)
        .update({
          moderation_status: 'rejected',
          approved_by: session.data.session?.user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      await logAdminAction('reject', table, item.id, feedback);
      addToast({ type: 'success', message: `${activeTab === 'courses' ? 'Course' : 'Article'} rejected` });
      setSelectedItem(null);
      setFeedback('');
      loadContent();
    } catch (error) {
      console.error('Error rejecting content:', error);
      addToast({ type: 'error', message: 'Failed to reject content' });
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const table = activeTab === 'courses' ? 'courses' : 'articles';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      await logAdminAction('delete', table, item.id);
      addToast({ type: 'success', message: 'Item deleted' });
      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      addToast({ type: 'error', message: 'Failed to delete item' });
    }
  };

  const logAdminAction = async (actionType: string, entityType: string, entityId: string, reason?: string) => {
    try {
      const session = await supabase.auth.getSession();
      const { error } = await supabase
        .from('learning_hub_admin_logs')
        .insert({
          admin_id: session.data.session?.user.id,
          action: actionType,
          entity_type: entityType,
          entity_id: entityId,
          reason,
          user_agent: navigator.userAgent,
          ip_address: 'client-side'
        });

      if (error) console.error('Error logging action:', error);
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  const getModerationBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: XCircle },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: Clock },
      changes_requested: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-400', icon: AlertCircle }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <div className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
        <Icon className="h-4 w-4" />
        {status}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Hub Admin</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage and moderate educational content</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'articles'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Articles
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'courses'
              ? courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{course.description}</p>
                        <div className="flex items-center gap-4">
                          {getModerationBadge(course.moderation_status)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Created: {new Date(course.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setSelectedItem(course)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Review"
                        >
                          <Edit2 className="h-5 w-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(course)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              : articles.map((article) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{article.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Category: {article.category}</p>
                        <div className="flex items-center gap-4">
                          {getModerationBadge(article.moderation_status)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Published: {new Date(article.published_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setSelectedItem(article)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Review"
                        >
                          <Edit2 className="h-5 w-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(article)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Review Content</h2>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300">{selectedItem.description || selectedItem.content || 'No description available'}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add your feedback or rejection reason..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setFeedback('');
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedItem)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedItem)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

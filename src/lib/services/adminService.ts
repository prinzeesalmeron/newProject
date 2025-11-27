import { supabase } from '../supabase';

export type UserRole = 'admin' | 'user' | 'moderator';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  createdAt: string;
}

class AdminService {
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) return false;
      return data?.role === 'admin';
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<AdminUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        role: profile?.role || 'user',
        name: profile?.name,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }

  async getLearningHubContent() {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get learning hub content:', error);
      return [];
    }
  }

  async createLearningContent(content: {
    title: string;
    description: string;
    content_type: string;
    difficulty: string;
    duration: number;
    content: string;
    category: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .insert(content)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create learning content:', error);
      throw error;
    }
  }

  async updateLearningContent(id: string, updates: any) {
    try {
      const { error } = await supabase
        .from('educational_content')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update learning content:', error);
      throw error;
    }
  }

  async deleteLearningContent(id: string) {
    try {
      const { error } = await supabase
        .from('educational_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete learning content:', error);
      throw error;
    }
  }

  async getComplianceReports() {
    try {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get compliance reports:', error);
      return [];
    }
  }

  async getKYCVerifications(status?: string) {
    try {
      let query = supabase
        .from('kyc_verifications')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get KYC verifications:', error);
      return [];
    }
  }

  async updateKYCStatus(id: string, status: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('kyc_verifications')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          notes
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update KYC status:', error);
      throw error;
    }
  }

  async getKnowledgeBaseArticles() {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get knowledge base articles:', error);
      return [];
    }
  }

  async createKnowledgeBaseArticle(article: {
    title: string;
    slug: string;
    category: string;
    content: string;
    excerpt: string;
    author: string;
    published: boolean;
  }) {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert(article)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create knowledge base article:', error);
      throw error;
    }
  }

  async updateKnowledgeBaseArticle(id: string, updates: any) {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update knowledge base article:', error);
      throw error;
    }
  }

  async deleteKnowledgeBaseArticle(id: string) {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete knowledge base article:', error);
      throw error;
    }
  }

  async getSystemMetrics() {
    try {
      const [users, properties, transactions, kycPending] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true }),
        supabase.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      return {
        totalUsers: users.count || 0,
        totalProperties: properties.count || 0,
        totalTransactions: transactions.count || 0,
        pendingKYC: kycPending.count || 0
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {
        totalUsers: 0,
        totalProperties: 0,
        totalTransactions: 0,
        pendingKYC: 0
      };
    }
  }
}

export const adminService = new AdminService();

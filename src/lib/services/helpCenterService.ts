import { supabase } from '../supabase';
import { analyticsService } from './analyticsService';

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful: number;
  notHelpful: number;
  tags: string[];
  order: number;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  author: string;
  views: number;
  helpful: number;
  readTime: number;
  tags: string[];
  relatedArticles: string[];
  lastUpdated: string;
  published: boolean;
}

export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category: string;
  views: number;
  likes: number;
  tags: string[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

class HelpCenterService {
  private readonly FAQ_DATA: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'Getting Started',
      question: 'What is BlockEstate?',
      answer: 'BlockEstate is a blockchain-powered real estate investment platform that allows you to invest in fractional property ownership. You can purchase tokens representing shares in real properties and earn rental income proportional to your investment.',
      helpful: 0,
      notHelpful: 0,
      tags: ['basics', 'platform', 'introduction'],
      order: 1
    },
    {
      id: 'faq-2',
      category: 'Getting Started',
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button in the top right corner, enter your email address, create a strong password, and verify your email. After registration, complete your profile and KYC verification to start investing.',
      helpful: 0,
      notHelpful: 0,
      tags: ['account', 'registration', 'signup'],
      order: 2
    },
    {
      id: 'faq-3',
      category: 'Investing',
      question: 'What is the minimum investment amount?',
      answer: 'The minimum investment varies by property but typically starts at $10. This low minimum allows investors to diversify across multiple properties without requiring large capital.',
      helpful: 0,
      notHelpful: 0,
      tags: ['investment', 'minimum', 'amount'],
      order: 1
    },
    {
      id: 'faq-4',
      category: 'Investing',
      question: 'How do I make my first investment?',
      answer: '1) Connect your wallet 2) Browse available properties 3) Select a property and review details 4) Click "Invest" and enter the amount 5) Confirm the transaction 6) Receive your property tokens',
      helpful: 0,
      notHelpful: 0,
      tags: ['investment', 'how-to', 'first-time'],
      order: 2
    },
    {
      id: 'faq-5',
      category: 'Wallet & Blockchain',
      question: 'Which wallets are supported?',
      answer: 'We support MetaMask, Coinbase Wallet, WalletConnect, Phantom, and Trust Wallet. Choose any compatible Ethereum or Lisk wallet to connect to BlockEstate.',
      helpful: 0,
      notHelpful: 0,
      tags: ['wallet', 'metamask', 'blockchain'],
      order: 1
    },
    {
      id: 'faq-6',
      category: 'Wallet & Blockchain',
      question: 'Is my wallet connection secure?',
      answer: 'Yes, wallet connections use industry-standard Web3 protocols. We never store your private keys or seed phrases. All transactions require your explicit approval in your wallet.',
      helpful: 0,
      notHelpful: 0,
      tags: ['security', 'wallet', 'safety'],
      order: 2
    },
    {
      id: 'faq-7',
      category: 'Earnings & Returns',
      question: 'How do I earn money?',
      answer: 'You earn through: 1) Rental Income - Monthly distributions from property rent 2) Property Appreciation - Value increases over time 3) Staking Rewards - Earn additional tokens by staking 4) Trading - Sell tokens on the secondary market',
      helpful: 0,
      notHelpful: 0,
      tags: ['earnings', 'income', 'returns'],
      order: 1
    },
    {
      id: 'faq-8',
      category: 'Earnings & Returns',
      question: 'When do I receive rental income?',
      answer: 'Rental income is distributed monthly, typically on the 1st of each month. Income is automatically credited to your wallet and can be withdrawn or reinvested.',
      helpful: 0,
      notHelpful: 0,
      tags: ['rental', 'income', 'payments'],
      order: 2
    },
    {
      id: 'faq-9',
      category: 'KYC & Verification',
      question: 'Why do I need to complete KYC?',
      answer: 'KYC (Know Your Customer) verification is required by law for real estate investments. It helps prevent fraud and money laundering while protecting all investors on the platform.',
      helpful: 0,
      notHelpful: 0,
      tags: ['kyc', 'verification', 'compliance'],
      order: 1
    },
    {
      id: 'faq-10',
      category: 'KYC & Verification',
      question: 'How long does KYC verification take?',
      answer: 'KYC verification typically takes 1-3 business days. You will receive an email notification once your verification is complete. In some cases, additional documentation may be required.',
      helpful: 0,
      notHelpful: 0,
      tags: ['kyc', 'time', 'verification'],
      order: 2
    },
    {
      id: 'faq-11',
      category: 'Properties',
      question: 'How are properties selected?',
      answer: 'Our team conducts thorough due diligence on each property including: location analysis, financial projections, property condition assessments, legal reviews, and market comparisons. Only properties meeting strict criteria are listed.',
      helpful: 0,
      notHelpful: 0,
      tags: ['properties', 'selection', 'quality'],
      order: 1
    },
    {
      id: 'faq-12',
      category: 'Properties',
      question: 'Can I sell my property tokens?',
      answer: 'Yes, you can sell your tokens on the secondary market at any time. List your tokens for sale and other investors can purchase them. Liquidity depends on demand for the specific property.',
      helpful: 0,
      notHelpful: 0,
      tags: ['selling', 'liquidity', 'trading'],
      order: 2
    },
    {
      id: 'faq-13',
      category: 'Fees',
      question: 'What fees does BlockEstate charge?',
      answer: 'Platform fees include: 1) Transaction Fee: 0.5% on property purchases 2) Management Fee: 1% annual on property value 3) Gas Fees: Blockchain transaction costs (varies) 4) No withdrawal fees for rental income',
      helpful: 0,
      notHelpful: 0,
      tags: ['fees', 'costs', 'pricing'],
      order: 1
    },
    {
      id: 'faq-14',
      category: 'Security',
      question: 'How secure is my investment?',
      answer: 'Your investment is protected by: blockchain immutability, smart contract audits, insurance on properties, regulatory compliance, secure custody of assets, and 24/7 monitoring. Your property ownership is recorded on the blockchain and cannot be altered.',
      helpful: 0,
      notHelpful: 0,
      tags: ['security', 'safety', 'protection'],
      order: 1
    },
    {
      id: 'faq-15',
      category: 'Troubleshooting',
      question: 'What if I forgot my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email. If you do not receive the email, check your spam folder or contact support.',
      helpful: 0,
      notHelpful: 0,
      tags: ['password', 'reset', 'account'],
      order: 1
    }
  ];

  async getFAQs(category?: string): Promise<FAQItem[]> {
    let faqs = this.FAQ_DATA;

    if (category) {
      faqs = faqs.filter(faq => faq.category === category);
    }

    return faqs.sort((a, b) => a.order - b.order);
  }

  async getFAQCategories(): Promise<string[]> {
    const categories = [...new Set(this.FAQ_DATA.map(faq => faq.category))];
    return categories;
  }

  async searchFAQs(query: string): Promise<FAQItem[]> {
    const lowerQuery = query.toLowerCase();

    return this.FAQ_DATA.filter(faq =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery) ||
      faq.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async markFAQHelpful(faqId: string, helpful: boolean): Promise<void> {
    analyticsService.track('FAQ Feedback', {
      faqId,
      helpful
    });
  }

  async getKnowledgeBaseArticles(category?: string): Promise<KnowledgeBaseArticle[]> {
    try {
      let query = supabase
        .from('knowledge_base')
        .select('*')
        .eq('published', true)
        .order('last_updated', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get knowledge base articles:', error);
      return [];
    }
  }

  async getArticle(slug: string): Promise<KnowledgeBaseArticle | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;

      if (data) {
        await this.incrementArticleViews(data.id);
        analyticsService.track('Knowledge Base Article Viewed', {
          articleId: data.id,
          title: data.title,
          category: data.category
        });
      }

      return data;
    } catch (error) {
      console.error('Failed to get article:', error);
      return null;
    }
  }

  async searchKnowledgeBase(query: string): Promise<KnowledgeBaseArticle[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('views', { ascending: false })
        .limit(10);

      if (error) throw error;

      analyticsService.track('Knowledge Base Searched', { query, results: data?.length || 0 });

      return data || [];
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      return [];
    }
  }

  async getTutorialVideos(category?: string): Promise<TutorialVideo[]> {
    try {
      let query = supabase
        .from('tutorial_videos')
        .select('*')
        .order('views', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get tutorial videos:', error);
      return [];
    }
  }

  async trackVideoView(videoId: string): Promise<void> {
    try {
      await supabase.rpc('increment_video_views', { video_id: videoId });

      analyticsService.track('Tutorial Video Viewed', { videoId });
    } catch (error) {
      console.error('Failed to track video view:', error);
    }
  }

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: ticket.userId,
          subject: ticket.subject,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status
        })
        .select()
        .single();

      if (error) throw error;

      analyticsService.track('Support Ticket Created', {
        category: ticket.category,
        priority: ticket.priority
      });

      return data.id;
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      throw error;
    }
  }

  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get support tickets:', error);
      return [];
    }
  }

  async getPopularArticles(limit: number = 5): Promise<KnowledgeBaseArticle[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('published', true)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get popular articles:', error);
      return [];
    }
  }

  async getRelatedArticles(articleId: string): Promise<KnowledgeBaseArticle[]> {
    try {
      const article = await this.getArticleById(articleId);
      if (!article) return [];

      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('published', true)
        .eq('category', article.category)
        .neq('id', articleId)
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get related articles:', error);
      return [];
    }
  }

  private async incrementArticleViews(articleId: string): Promise<void> {
    try {
      await supabase.rpc('increment_article_views', { article_id: articleId });
    } catch (error) {
      console.error('Failed to increment article views:', error);
    }
  }

  private async getArticleById(articleId: string): Promise<KnowledgeBaseArticle | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }
}

export const helpCenterService = new HelpCenterService();

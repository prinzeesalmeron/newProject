import { supabase } from '../supabase';
import { analyticsService } from './analyticsService';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: string;
  action?: () => Promise<void>;
  completed: boolean;
  order: number;
  required: boolean;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  totalSteps: number;
  percentComplete: number;
  startedAt: string;
  completedAt?: string;
}

export interface TutorialStep {
  id: string;
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  highlightPadding?: number;
}

class OnboardingService {
  private readonly ONBOARDING_STEPS: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to BlockEstate',
      description: 'Learn how to invest in real estate with blockchain technology',
      order: 1,
      completed: false,
      required: true
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your personal information to get started',
      order: 2,
      completed: false,
      required: true
    },
    {
      id: 'wallet',
      title: 'Connect Your Wallet',
      description: 'Connect a crypto wallet to invest in properties',
      order: 3,
      completed: false,
      required: true
    },
    {
      id: 'kyc',
      title: 'Verify Your Identity',
      description: 'Complete KYC verification to start investing',
      order: 4,
      completed: false,
      required: true
    },
    {
      id: 'explore',
      title: 'Explore Properties',
      description: 'Browse available investment properties',
      order: 5,
      completed: false,
      required: false
    },
    {
      id: 'investment',
      title: 'Make Your First Investment',
      description: 'Invest in your first property to complete onboarding',
      order: 6,
      completed: false,
      required: false
    },
    {
      id: 'portfolio',
      title: 'View Your Portfolio',
      description: 'Track your investments and earnings',
      order: 7,
      completed: false,
      required: false
    }
  ];

  private readonly INTERACTIVE_TUTORIAL: Record<string, TutorialStep[]> = {
    dashboard: [
      {
        id: 'nav-properties',
        target: '[data-tour="nav-properties"]',
        title: 'Browse Properties',
        content: 'Click here to explore available investment properties',
        placement: 'bottom'
      },
      {
        id: 'nav-portfolio',
        target: '[data-tour="nav-portfolio"]',
        title: 'Your Portfolio',
        content: 'Track your investments and view performance metrics',
        placement: 'bottom'
      },
      {
        id: 'nav-staking',
        target: '[data-tour="nav-staking"]',
        title: 'Stake Tokens',
        content: 'Earn rewards by staking your property tokens',
        placement: 'bottom'
      },
      {
        id: 'wallet-button',
        target: '[data-tour="wallet-button"]',
        title: 'Connect Wallet',
        content: 'Connect your crypto wallet to start investing',
        placement: 'bottom'
      }
    ],
    marketplace: [
      {
        id: 'property-filters',
        target: '[data-tour="property-filters"]',
        title: 'Filter Properties',
        content: 'Use filters to find properties that match your criteria',
        placement: 'right',
        highlightPadding: 10
      },
      {
        id: 'property-card',
        target: '[data-tour="property-card"]',
        title: 'Property Details',
        content: 'Click on any property to view detailed information and investment options',
        placement: 'top'
      },
      {
        id: 'sort-options',
        target: '[data-tour="sort-options"]',
        title: 'Sort Results',
        content: 'Sort properties by yield, price, or popularity',
        placement: 'left'
      }
    ],
    property: [
      {
        id: 'property-metrics',
        target: '[data-tour="property-metrics"]',
        title: 'Key Metrics',
        content: 'Review important metrics like rental yield, occupancy rate, and ROI',
        placement: 'top'
      },
      {
        id: 'investment-calculator',
        target: '[data-tour="investment-calculator"]',
        title: 'Investment Calculator',
        content: 'Calculate potential returns based on your investment amount',
        placement: 'left'
      },
      {
        id: 'invest-button',
        target: '[data-tour="invest-button"]',
        title: 'Invest Now',
        content: 'Click here to purchase property tokens and start earning',
        placement: 'top',
        action: 'highlight'
      }
    ],
    portfolio: [
      {
        id: 'portfolio-overview',
        target: '[data-tour="portfolio-overview"]',
        title: 'Portfolio Overview',
        content: 'View your total investment value and performance',
        placement: 'bottom'
      },
      {
        id: 'earnings',
        target: '[data-tour="earnings"]',
        title: 'Your Earnings',
        content: 'Track rental income, staking rewards, and capital gains',
        placement: 'right'
      },
      {
        id: 'property-list',
        target: '[data-tour="property-list"]',
        title: 'Your Properties',
        content: 'Manage all your property investments in one place',
        placement: 'top'
      }
    ]
  };

  async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return this.createInitialProgress(userId);
      }

      const completedSteps = data.completed_steps || [];
      const totalSteps = this.ONBOARDING_STEPS.length;
      const percentComplete = (completedSteps.length / totalSteps) * 100;

      return {
        userId,
        currentStep: data.current_step || 0,
        completedSteps,
        totalSteps,
        percentComplete,
        startedAt: data.started_at,
        completedAt: data.completed_at
      };
    } catch (error) {
      console.error('Failed to get onboarding progress:', error);
      return this.createInitialProgress(userId);
    }
  }

  async getOnboardingSteps(userId: string): Promise<OnboardingStep[]> {
    const progress = await this.getOnboardingProgress(userId);

    return this.ONBOARDING_STEPS.map(step => ({
      ...step,
      completed: progress.completedSteps.includes(step.id)
    }));
  }

  async completeStep(userId: string, stepId: string): Promise<void> {
    try {
      const progress = await this.getOnboardingProgress(userId);

      if (progress.completedSteps.includes(stepId)) {
        return;
      }

      const completedSteps = [...progress.completedSteps, stepId];
      const step = this.ONBOARDING_STEPS.find(s => s.id === stepId);
      const currentStep = step ? step.order : progress.currentStep;

      const allStepsCompleted = completedSteps.length === this.ONBOARDING_STEPS.length;

      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: userId,
          current_step: currentStep,
          completed_steps: completedSteps,
          completed_at: allStepsCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      analyticsService.track('Onboarding Step Completed', {
        stepId,
        stepTitle: step?.title,
        progress: (completedSteps.length / this.ONBOARDING_STEPS.length) * 100
      });

      if (allStepsCompleted) {
        analyticsService.track('Onboarding Completed', {
          duration: Date.now() - new Date(progress.startedAt).getTime()
        });
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  }

  async skipOnboarding(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: userId,
          current_step: this.ONBOARDING_STEPS.length,
          completed_steps: this.ONBOARDING_STEPS.map(s => s.id),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      analyticsService.track('Onboarding Skipped');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  }

  async resetOnboarding(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_onboarding')
        .delete()
        .eq('user_id', userId);

      analyticsService.track('Onboarding Reset');
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }

  getTutorialSteps(page: string): TutorialStep[] {
    return this.INTERACTIVE_TUTORIAL[page] || [];
  }

  async markTutorialComplete(userId: string, page: string): Promise<void> {
    try {
      await supabase
        .from('completed_tutorials')
        .insert({
          user_id: userId,
          page,
          completed_at: new Date().toISOString()
        });

      analyticsService.track('Tutorial Completed', { page });
    } catch (error) {
      console.error('Failed to mark tutorial complete:', error);
    }
  }

  async hasCompletedTutorial(userId: string, page: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('completed_tutorials')
        .select('id')
        .eq('user_id', userId)
        .eq('page', page)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  async shouldShowOnboarding(userId: string): Promise<boolean> {
    const progress = await this.getOnboardingProgress(userId);
    return progress.percentComplete < 100;
  }

  async shouldShowTutorial(userId: string, page: string): Promise<boolean> {
    const hasCompleted = await this.hasCompletedTutorial(userId, page);
    const tutorialSteps = this.getTutorialSteps(page);
    return !hasCompleted && tutorialSteps.length > 0;
  }

  getNextStep(completedSteps: string[]): OnboardingStep | null {
    return this.ONBOARDING_STEPS
      .filter(step => !completedSteps.includes(step.id))
      .sort((a, b) => a.order - b.order)[0] || null;
  }

  private createInitialProgress(userId: string): OnboardingProgress {
    return {
      userId,
      currentStep: 0,
      completedSteps: [],
      totalSteps: this.ONBOARDING_STEPS.length,
      percentComplete: 0,
      startedAt: new Date().toISOString()
    };
  }

  async initializeOnboarding(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_onboarding')
        .insert({
          user_id: userId,
          current_step: 0,
          completed_steps: [],
          started_at: new Date().toISOString()
        });

      analyticsService.track('Onboarding Started');
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
    }
  }
}

export const onboardingService = new OnboardingService();

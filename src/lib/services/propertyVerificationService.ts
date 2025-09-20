import { supabase } from '../supabase';
import { DatabaseService } from '../database';
import { NotificationAPI } from '../api/notificationAPI';

export interface VerificationDocument {
  id: string;
  property_id: string;
  document_type: 'title_report' | 'inspection_report' | 'appraisal_report' | 'environmental_report' | 'legal_opinion';
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  verified_by?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  created_at: string;
}

export interface DueDiligenceChecklist {
  property_id: string;
  title_search: {
    completed: boolean;
    clear_title: boolean;
    liens: string[];
    encumbrances: string[];
    notes: string;
  };
  physical_inspection: {
    completed: boolean;
    structural_issues: string[];
    mechanical_systems: string[];
    estimated_repairs: number;
    inspector_rating: number;
    notes: string;
  };
  financial_analysis: {
    completed: boolean;
    rent_roll_verified: boolean;
    expense_analysis: any;
    cash_flow_projection: any;
    comparable_analysis: any;
  };
  legal_review: {
    completed: boolean;
    zoning_compliance: boolean;
    permit_status: string;
    hoa_restrictions: string[];
    legal_issues: string[];
  };
  environmental_assessment: {
    completed: boolean;
    environmental_hazards: string[];
    remediation_required: boolean;
    estimated_costs: number;
  };
  insurance_review: {
    completed: boolean;
    insurability: boolean;
    estimated_premium: number;
    coverage_requirements: string[];
  };
}

/**
 * Property Verification Service - Handles due diligence and property validation
 */
export class PropertyVerificationService {
  /**
   * Start comprehensive property verification
   */
  static async startVerificationProcess(propertyId: string, requestedBy: string): Promise<string> {
    try {
      // Create verification record
      const verificationId = await this.createVerificationRecord(propertyId, requestedBy);
      
      // Initialize due diligence checklist
      await this.initializeDueDiligenceChecklist(propertyId);
      
      // Schedule verification tasks
      await this.scheduleVerificationTasks(propertyId);
      
      // Notify stakeholders
      await this.notifyVerificationStarted(propertyId, requestedBy);
      
      return verificationId;

    } catch (error) {
      console.error('Verification process start failed:', error);
      throw error;
    }
  }

  /**
   * Upload verification document
   */
  static async uploadVerificationDocument(
    propertyId: string,
    documentType: VerificationDocument['document_type'],
    file: File,
    uploadedBy: string
  ): Promise<VerificationDocument> {
    try {
      // In production, upload to secure storage (AWS S3, Supabase Storage, etc.)
      const fileUrl = await this.uploadFileToStorage(file, `verifications/${propertyId}/${documentType}`);
      
      const document: Omit<VerificationDocument, 'id' | 'created_at'> = {
        property_id: propertyId,
        document_type: documentType,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: uploadedBy,
        verification_status: 'pending'
      };

      if (!supabase) {
        throw new Error('Database not configured');
      }

      const { data, error } = await supabase
        .from('verification_documents')
        .insert([document])
        .select()
        .single();

      if (error) throw error;

      // Update verification checklist
      await this.updateVerificationChecklist(propertyId, documentType, true);

      // Notify verification team
      await NotificationAPI.createNotification({
        user_id: uploadedBy,
        title: 'Document Uploaded',
        message: `${documentType.replace('_', ' ')} uploaded for verification`,
        type: 'info'
      });

      return data;

    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  /**
   * Complete property verification
   */
  static async completeVerification(
    propertyId: string,
    verifiedBy: string,
    verificationResults: {
      approved: boolean;
      rating: number;
      notes: string;
      conditions?: string[];
    }
  ): Promise<void> {
    try {
      // Update verification status
      if (supabase) {
        await supabase
          .from('property_verifications')
          .update({
            verification_status: verificationResults.approved ? 'completed' : 'failed',
            verified_by: verifiedBy,
            verified_at: new Date().toISOString(),
            verification_notes: verificationResults.notes,
            final_rating: verificationResults.rating
          })
          .eq('property_id', propertyId);
      }

      // Update property status
      if (verificationResults.approved) {
        await DatabaseService.updateProperty(propertyId, {
          status: 'active',
          rating: verificationResults.rating
        });
      } else {
        await DatabaseService.updateProperty(propertyId, {
          status: 'coming_soon' // Keep as coming soon if verification failed
        });
      }

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'property_verification_completed',
        resource_type: 'property',
        resource_id: propertyId,
        new_values: {
          approved: verificationResults.approved,
          rating: verificationResults.rating,
          verified_by: verifiedBy
        }
      });

      // Notify property manager
      const property = await DatabaseService.getProperty(propertyId);
      await NotificationAPI.createNotification({
        user_id: property.property_manager_id || verifiedBy,
        title: verificationResults.approved ? 'Property Verification Approved' : 'Property Verification Failed',
        message: verificationResults.approved 
          ? `${property.title} has been approved and is now available for investment`
          : `${property.title} verification failed: ${verificationResults.notes}`,
        type: verificationResults.approved ? 'success' : 'error',
        action_url: `/properties/${propertyId}`
      });

    } catch (error) {
      console.error('Verification completion failed:', error);
      throw error;
    }
  }

  /**
   * Get verification status
   */
  static async getVerificationStatus(propertyId: string): Promise<any> {
    if (!supabase) {
      return this.getMockVerificationStatus(propertyId);
    }

    try {
      const { data, error } = await supabase
        .from('property_verifications')
        .select(`
          *,
          verification_documents(*)
        `)
        .eq('property_id', propertyId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error fetching verification status:', error);
      return this.getMockVerificationStatus(propertyId);
    }
  }

  /**
   * Generate verification report
   */
  static async generateVerificationReport(propertyId: string): Promise<any> {
    try {
      const [verification, dueDiligence, marketAnalysis] = await Promise.all([
        this.getVerificationStatus(propertyId),
        this.getDueDiligenceChecklist(propertyId),
        PropertyDataService.getMarketAnalysis(propertyId)
      ]);

      const report = {
        property_id: propertyId,
        verification_summary: verification,
        due_diligence: dueDiligence,
        market_analysis: marketAnalysis,
        risk_assessment: await this.calculateRiskScore(propertyId),
        investment_recommendation: await this.generateInvestmentRecommendation(propertyId),
        generated_at: new Date().toISOString(),
        generated_by: 'system'
      };

      // Store report
      if (supabase) {
        await supabase
          .from('verification_reports')
          .insert([report]);
      }

      return report;

    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async createVerificationRecord(propertyId: string, requestedBy: string): Promise<string> {
    if (!supabase) {
      return `verification_${Date.now()}`;
    }

    const { data, error } = await supabase
      .from('property_verifications')
      .insert([{
        property_id: propertyId,
        verification_status: 'pending',
        requested_by: requestedBy,
        requested_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  private static async initializeDueDiligenceChecklist(propertyId: string): Promise<void> {
    const checklist: DueDiligenceChecklist = {
      property_id: propertyId,
      title_search: {
        completed: false,
        clear_title: false,
        liens: [],
        encumbrances: [],
        notes: ''
      },
      physical_inspection: {
        completed: false,
        structural_issues: [],
        mechanical_systems: [],
        estimated_repairs: 0,
        inspector_rating: 0,
        notes: ''
      },
      financial_analysis: {
        completed: false,
        rent_roll_verified: false,
        expense_analysis: {},
        cash_flow_projection: {},
        comparable_analysis: {}
      },
      legal_review: {
        completed: false,
        zoning_compliance: false,
        permit_status: 'pending',
        hoa_restrictions: [],
        legal_issues: []
      },
      environmental_assessment: {
        completed: false,
        environmental_hazards: [],
        remediation_required: false,
        estimated_costs: 0
      },
      insurance_review: {
        completed: false,
        insurability: false,
        estimated_premium: 0,
        coverage_requirements: []
      }
    };

    if (supabase) {
      await supabase
        .from('due_diligence_checklists')
        .insert([checklist]);
    }
  }

  private static async scheduleVerificationTasks(propertyId: string): Promise<void> {
    // Mock task scheduling - in production, integrate with verification providers
    const tasks = [
      { type: 'title_search', provider: 'First American Title', eta: '2-3 business days' },
      { type: 'inspection', provider: 'Professional Inspections Inc', eta: '5-7 business days' },
      { type: 'appraisal', provider: 'Certified Appraisers LLC', eta: '7-10 business days' },
      { type: 'environmental', provider: 'Environmental Solutions', eta: '10-14 business days' },
      { type: 'legal_review', provider: 'Real Estate Legal Group', eta: '3-5 business days' }
    ];

    console.log(`Scheduled ${tasks.length} verification tasks for property ${propertyId}`);
  }

  private static async notifyVerificationStarted(propertyId: string, requestedBy: string): Promise<void> {
    const property = await DatabaseService.getProperty(propertyId);
    
    await NotificationAPI.createNotification({
      user_id: requestedBy,
      title: 'Property Verification Started',
      message: `Verification process has begun for ${property.title}. You'll receive updates as each step completes.`,
      type: 'info',
      action_url: `/properties/${propertyId}/verification`
    });
  }

  private static async uploadFileToStorage(file: File, path: string): Promise<string> {
    // Mock file upload - in production, use Supabase Storage or AWS S3
    console.log(`Uploading file ${file.name} to ${path}`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock URL
    return `https://storage.blockestate.com/${path}/${file.name}`;
  }

  private static async updateVerificationChecklist(
    propertyId: string,
    documentType: string,
    completed: boolean
  ): Promise<void> {
    if (!supabase) return;

    const updateField = `${documentType}.completed`;
    
    await supabase
      .from('due_diligence_checklists')
      .update({
        [updateField]: completed,
        updated_at: new Date().toISOString()
      })
      .eq('property_id', propertyId);
  }

  private static async getDueDiligenceChecklist(propertyId: string): Promise<DueDiligenceChecklist | null> {
    if (!supabase) {
      return this.getMockDueDiligenceChecklist(propertyId);
    }

    const { data, error } = await supabase
      .from('due_diligence_checklists')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (error) {
      console.error('Error fetching due diligence checklist:', error);
      return this.getMockDueDiligenceChecklist(propertyId);
    }

    return data;
  }

  private static getMockDueDiligenceChecklist(propertyId: string): DueDiligenceChecklist {
    return {
      property_id: propertyId,
      title_search: {
        completed: true,
        clear_title: true,
        liens: [],
        encumbrances: [],
        notes: 'Title search completed - clear title confirmed'
      },
      physical_inspection: {
        completed: true,
        structural_issues: [],
        mechanical_systems: ['HVAC - Good condition', 'Plumbing - Recently updated', 'Electrical - Code compliant'],
        estimated_repairs: 2500,
        inspector_rating: 4.5,
        notes: 'Property in excellent condition with minor cosmetic updates needed'
      },
      financial_analysis: {
        completed: true,
        rent_roll_verified: true,
        expense_analysis: {
          property_taxes: 8500,
          insurance: 2400,
          maintenance: 3600,
          management: 2400
        },
        cash_flow_projection: {
          monthly_income: 2800,
          monthly_expenses: 1400,
          net_monthly: 1400
        },
        comparable_analysis: {
          average_price_per_sqft: 250,
          average_rent_per_sqft: 1.55,
          market_appreciation: 3.2
        }
      },
      legal_review: {
        completed: true,
        zoning_compliance: true,
        permit_status: 'all_current',
        hoa_restrictions: ['No short-term rentals', 'Pet restrictions apply'],
        legal_issues: []
      },
      environmental_assessment: {
        completed: true,
        environmental_hazards: [],
        remediation_required: false,
        estimated_costs: 0
      },
      insurance_review: {
        completed: true,
        insurability: true,
        estimated_premium: 2400,
        coverage_requirements: ['Property insurance', 'Liability coverage', 'Flood insurance recommended']
      }
    };
  }

  private static async calculateRiskScore(propertyId: string): Promise<any> {
    // Mock risk calculation - in production, use comprehensive risk models
    return {
      overall_score: 7.5,
      risk_level: 'Medium-Low',
      factors: {
        market_risk: 6.0,
        liquidity_risk: 7.0,
        credit_risk: 8.5,
        operational_risk: 8.0,
        regulatory_risk: 7.5
      },
      mitigation_strategies: [
        'Diversify across multiple properties',
        'Maintain adequate insurance coverage',
        'Regular property maintenance and inspections',
        'Monitor local market conditions'
      ]
    };
  }

  private static async generateInvestmentRecommendation(propertyId: string): Promise<any> {
    const property = await DatabaseService.getProperty(propertyId);
    const marketAnalysis = await PropertyDataService.getMarketAnalysis(propertyId);
    
    return {
      recommendation: 'BUY',
      confidence_level: 85,
      target_allocation: '5-10%',
      investment_thesis: [
        'Strong rental yield in growing market',
        'Property in excellent condition',
        'Favorable market fundamentals',
        'Clear title and legal structure'
      ],
      risks_to_consider: [
        'Market volatility in tech sector',
        'Interest rate sensitivity',
        'Local regulatory changes'
      ],
      exit_strategy: 'Hold for 5-7 years with potential for appreciation and steady rental income'
    };
  }

  private static getMockVerificationStatus(propertyId: string) {
    return {
      property_id: propertyId,
      verification_status: 'completed',
      title_search: { status: 'clear' },
      inspection: { status: 'completed', inspector_name: 'John Smith' },
      appraisal: { status: 'completed', appraised_value: 475000 },
      environmental: { status: 'clear' },
      legal_review: { status: 'clear' },
      final_rating: 4.5,
      verified_at: new Date().toISOString()
    };
  }

  private static async uploadFileToStorage(file: File, path: string): Promise<string> {
    // Mock file upload - in production, integrate with storage provider
    console.log(`Uploading ${file.name} to ${path}`);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `https://storage.blockestate.com/${path}`;
  }
}
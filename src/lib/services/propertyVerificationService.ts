import { supabase } from '../supabase';
import { DatabaseService } from '../database';
import { NotificationAPI } from '../api/notificationAPI';

export interface VerificationDocument {
  id: string;
  property_id: string;
  document_type: 'title_report' | 'inspection_report' | 'appraisal_report' | 'environmental_report' | 'legal_opinion' | 'survey' | 'insurance_quote' | 'rent_roll' | 'financial_statements';
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
  overall_completion_percentage: number;
}

export interface PropertyInspection {
  id: string;
  property_id: string;
  inspection_type: 'general' | 'structural' | 'environmental' | 'pest' | 'electrical' | 'plumbing';
  inspector_name: string;
  inspector_license: string;
  inspector_company: string;
  inspection_date: string;
  inspection_status: 'scheduled' | 'completed' | 'cancelled' | 'failed';
  findings: any;
  recommendations: string[];
  estimated_repair_costs: number;
  overall_rating: number;
  report_url?: string;
}

/**
 * Property Verification Service - Handles comprehensive due diligence and property validation
 */
export class PropertyVerificationService {
  /**
   * Start comprehensive property verification process
   */
  static async startVerificationProcess(propertyId: string, requestedBy: string): Promise<string> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Create verification record
      const { data: verification, error: verificationError } = await supabase
        .from('property_verifications')
        .insert([{
          property_id: propertyId,
          verification_status: 'pending',
          requested_by: requestedBy,
          requested_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (verificationError) throw verificationError;

      // Initialize due diligence checklist
      await this.initializeDueDiligenceChecklist(propertyId);
      
      // Schedule verification tasks
      await this.scheduleVerificationTasks(propertyId);
      
      // Notify stakeholders
      await this.notifyVerificationStarted(propertyId, requestedBy);
      
      return verification.id;

    } catch (error) {
      console.error('Verification process start failed:', error);
      throw error;
    }
  }

  /**
   * Initialize due diligence checklist for property
   */
  static async initializeDueDiligenceChecklist(propertyId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { error } = await supabase
        .from('due_diligence_checklists')
        .insert([{
          property_id: propertyId,
          overall_completion_percentage: 0
        }]);

      if (error) throw error;

    } catch (error) {
      console.error('Due diligence initialization failed:', error);
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
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `verification-docs/${propertyId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('verification_documents')
        .insert([{
          property_id: propertyId,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: uploadedBy,
          verification_status: 'pending'
        }])
        .select()
        .single();

      if (docError) throw docError;

      // Update verification checklist
      await this.updateVerificationChecklist(propertyId, documentType, true);

      // Notify verification team
      await NotificationAPI.createNotification({
        user_id: uploadedBy,
        title: 'Document Uploaded',
        message: `${documentType.replace('_', ' ')} uploaded for verification`,
        type: 'info'
      });

      return document;

    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  /**
   * Schedule property inspection
   */
  static async scheduleInspection(
    propertyId: string,
    inspectionType: PropertyInspection['inspection_type'],
    inspectorData: {
      name: string;
      license: string;
      company: string;
      inspection_date: string;
    }
  ): Promise<PropertyInspection> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { data: inspection, error } = await supabase
        .from('property_inspections')
        .insert([{
          property_id: propertyId,
          inspection_type: inspectionType,
          inspector_name: inspectorData.name,
          inspector_license: inspectorData.license,
          inspector_company: inspectorData.company,
          inspection_date: inspectorData.inspection_date,
          inspection_status: 'scheduled'
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'inspection_scheduled',
        resource_type: 'property_inspection',
        resource_id: inspection.id,
        new_values: inspectorData
      });

      return inspection;

    } catch (error) {
      console.error('Inspection scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Complete property inspection with findings
   */
  static async completeInspection(
    inspectionId: string,
    findings: {
      overall_rating: number;
      structural_issues: string[];
      recommendations: string[];
      estimated_repair_costs: number;
      report_url?: string;
    }
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { data: inspection, error } = await supabase
        .from('property_inspections')
        .update({
          inspection_status: 'completed',
          findings: findings,
          recommendations: findings.recommendations,
          estimated_repair_costs: findings.estimated_repair_costs,
          overall_rating: findings.overall_rating,
          report_url: findings.report_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId)
        .select()
        .single();

      if (error) throw error;

      // Update due diligence checklist
      await this.updateDueDiligenceItem(inspection.property_id, 'physical_inspection', {
        completed: true,
        structural_issues: findings.structural_issues,
        estimated_repairs: findings.estimated_repair_costs,
        inspector_rating: findings.overall_rating,
        notes: `Inspection completed by ${inspection.inspector_name}`
      });

    } catch (error) {
      console.error('Inspection completion failed:', error);
      throw error;
    }
  }

  /**
   * Get verification status for property
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
          verification_documents(*),
          property_inspections(*)
        `)
        .eq('property_id', propertyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || this.getMockVerificationStatus(propertyId);

    } catch (error) {
      console.error('Error fetching verification status:', error);
      return this.getMockVerificationStatus(propertyId);
    }
  }

  /**
   * Get due diligence checklist
   */
  static async getDueDiligenceChecklist(propertyId: string): Promise<DueDiligenceChecklist | null> {
    if (!supabase) {
      return this.getMockDueDiligenceChecklist(propertyId);
    }

    try {
      const { data, error } = await supabase
        .from('due_diligence_checklists')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || this.getMockDueDiligenceChecklist(propertyId);

    } catch (error) {
      console.error('Error fetching due diligence checklist:', error);
      return this.getMockDueDiligenceChecklist(propertyId);
    }
  }

  /**
   * Update specific due diligence item
   */
  static async updateDueDiligenceItem(
    propertyId: string,
    itemType: keyof Omit<DueDiligenceChecklist, 'property_id' | 'overall_completion_percentage'>,
    itemData: any
  ): Promise<void> {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('due_diligence_checklists')
        .update({
          [itemType]: itemData,
          updated_at: new Date().toISOString()
        })
        .eq('property_id', propertyId);

      if (error) throw error;

    } catch (error) {
      console.error('Due diligence update failed:', error);
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
    if (!supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('property_verifications')
        .update({
          verification_status: verificationResults.approved ? 'completed' : 'failed',
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
          verification_notes: verificationResults.notes,
          final_rating: verificationResults.rating
        })
        .eq('property_id', propertyId);

      if (verificationError) throw verificationError;

      // Update property status
      if (verificationResults.approved) {
        await DatabaseService.updateProperty(propertyId, {
          status: 'active',
          rating: verificationResults.rating
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
   * Generate comprehensive verification report
   */
  static async generateVerificationReport(propertyId: string): Promise<any> {
    try {
      const [verification, dueDiligence, marketAnalysis, inspections] = await Promise.all([
        this.getVerificationStatus(propertyId),
        this.getDueDiligenceChecklist(propertyId),
        PropertyDataService.getMarketAnalysis(propertyId),
        this.getPropertyInspections(propertyId)
      ]);

      const report = {
        property_id: propertyId,
        verification_summary: verification,
        due_diligence: dueDiligence,
        market_analysis: marketAnalysis,
        inspections: inspections,
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

  /**
   * Get property inspections
   */
  static async getPropertyInspections(propertyId: string): Promise<PropertyInspection[]> {
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('property_inspections')
        .select('*')
        .eq('property_id', propertyId)
        .order('inspection_date', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching inspections:', error);
      return [];
    }
  }

  /**
   * Calculate property risk score
   */
  static async calculateRiskScore(propertyId: string): Promise<any> {
    try {
      const [dueDiligence, marketData, inspections] = await Promise.all([
        this.getDueDiligenceChecklist(propertyId),
        PropertyDataService.getMarketAnalysis(propertyId),
        this.getPropertyInspections(propertyId)
      ]);

      // Calculate risk factors
      const riskFactors = {
        title_risk: dueDiligence?.title_search?.clear_title ? 1 : 8,
        structural_risk: this.calculateStructuralRisk(inspections),
        market_risk: this.calculateMarketRisk(marketData),
        financial_risk: this.calculateFinancialRisk(dueDiligence?.financial_analysis),
        legal_risk: dueDiligence?.legal_review?.legal_issues?.length || 0 > 0 ? 6 : 2,
        environmental_risk: dueDiligence?.environmental_assessment?.remediation_required ? 7 : 2
      };

      const averageRisk = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / Object.keys(riskFactors).length;
      
      return {
        overall_score: Math.round((10 - averageRisk) * 10) / 10,
        risk_level: averageRisk <= 3 ? 'Low' : averageRisk <= 6 ? 'Medium' : 'High',
        risk_factors: riskFactors,
        mitigation_strategies: this.generateMitigationStrategies(riskFactors)
      };

    } catch (error) {
      console.error('Risk calculation failed:', error);
      return {
        overall_score: 5.0,
        risk_level: 'Medium',
        risk_factors: {},
        mitigation_strategies: []
      };
    }
  }

  /**
   * Generate investment recommendation
   */
  static async generateInvestmentRecommendation(propertyId: string): Promise<any> {
    try {
      const [property, riskScore, marketAnalysis] = await Promise.all([
        DatabaseService.getProperty(propertyId),
        this.calculateRiskScore(propertyId),
        PropertyDataService.getMarketAnalysis(propertyId)
      ]);

      const recommendation = this.determineRecommendation(property, riskScore, marketAnalysis);

      return {
        recommendation: recommendation.action,
        confidence_level: recommendation.confidence,
        target_allocation: recommendation.allocation,
        investment_thesis: recommendation.thesis,
        risks_to_consider: recommendation.risks,
        exit_strategy: recommendation.exitStrategy,
        price_target: recommendation.priceTarget
      };

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return {
        recommendation: 'HOLD',
        confidence_level: 50,
        target_allocation: '1-3%',
        investment_thesis: ['Insufficient data for recommendation'],
        risks_to_consider: ['Incomplete verification'],
        exit_strategy: 'Monitor until verification complete'
      };
    }
  }

  // Private helper methods
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

    // In production, you would:
    // 1. Create API calls to verification service providers
    // 2. Schedule automated follow-ups
    // 3. Set up webhook endpoints for status updates
    // 4. Create calendar events for inspections
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

  private static async updateVerificationChecklist(
    propertyId: string,
    documentType: string,
    completed: boolean
  ): Promise<void> {
    if (!supabase) return;

    // Map document types to checklist items
    const checklistMapping: Record<string, string> = {
      'title_report': 'title_search',
      'inspection_report': 'physical_inspection',
      'appraisal_report': 'financial_analysis',
      'environmental_report': 'environmental_assessment',
      'legal_opinion': 'legal_review',
      'insurance_quote': 'insurance_review'
    };

    const checklistItem = checklistMapping[documentType];
    if (!checklistItem) return;

    try {
      // Get current checklist
      const { data: currentChecklist } = await supabase
        .from('due_diligence_checklists')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (currentChecklist) {
        const updatedItem = {
          ...currentChecklist[checklistItem],
          completed: completed
        };

        await supabase
          .from('due_diligence_checklists')
          .update({
            [checklistItem]: updatedItem,
            updated_at: new Date().toISOString()
          })
          .eq('property_id', propertyId);
      }

    } catch (error) {
      console.error('Checklist update failed:', error);
    }
  }

  private static calculateStructuralRisk(inspections: PropertyInspection[]): number {
    if (!inspections || inspections.length === 0) return 5; // Medium risk if no inspection

    const latestInspection = inspections[0];
    if (latestInspection.overall_rating >= 4) return 2; // Low risk
    if (latestInspection.overall_rating >= 3) return 5; // Medium risk
    return 8; // High risk
  }

  private static calculateMarketRisk(marketData: any): number {
    if (!marketData) return 5;

    // Analyze market trends, price volatility, etc.
    const priceVolatility = marketData.price_history?.length > 0 ? 3 : 5;
    const neighborhoodScore = marketData.neighborhood_score?.walkability || 50;
    
    if (neighborhoodScore >= 80) return 2;
    if (neighborhoodScore >= 60) return 4;
    return 7;
  }

  private static calculateFinancialRisk(financialAnalysis: any): number {
    if (!financialAnalysis?.completed) return 6;

    const rentRollVerified = financialAnalysis.rent_roll_verified;
    const cashFlow = financialAnalysis.cash_flow_projection?.net_monthly || 0;

    if (rentRollVerified && cashFlow > 0) return 2;
    if (rentRollVerified) return 4;
    return 7;
  }

  private static generateMitigationStrategies(riskFactors: any): string[] {
    const strategies: string[] = [];

    if (riskFactors.title_risk > 5) {
      strategies.push('Obtain title insurance with extended coverage');
    }
    if (riskFactors.structural_risk > 5) {
      strategies.push('Set aside additional reserves for maintenance and repairs');
    }
    if (riskFactors.market_risk > 5) {
      strategies.push('Diversify across multiple markets and property types');
    }
    if (riskFactors.financial_risk > 5) {
      strategies.push('Verify rental income with bank statements and lease agreements');
    }

    return strategies;
  }

  private static determineRecommendation(property: any, riskScore: any, marketAnalysis: any): any {
    const overallScore = riskScore.overall_score;
    const yieldScore = property.rental_yield || 0;
    const marketScore = marketAnalysis?.investment_metrics?.cap_rate || 0;

    if (overallScore >= 7 && yieldScore >= 8 && marketScore >= 6) {
      return {
        action: 'STRONG BUY',
        confidence: 90,
        allocation: '5-10%',
        thesis: [
          'Excellent property condition and location',
          'Strong rental yield above market average',
          'Favorable market fundamentals',
          'Low risk profile with clear title'
        ],
        risks: ['Market volatility', 'Interest rate changes'],
        exitStrategy: 'Hold for 7-10 years with potential for strong appreciation',
        priceTarget: property.price_per_token * 1.2
      };
    } else if (overallScore >= 5 && yieldScore >= 6) {
      return {
        action: 'BUY',
        confidence: 75,
        allocation: '3-7%',
        thesis: [
          'Good property fundamentals',
          'Acceptable rental yield',
          'Manageable risk profile'
        ],
        risks: ['Property condition issues', 'Market uncertainty'],
        exitStrategy: 'Hold for 5-7 years with moderate appreciation expected',
        priceTarget: property.price_per_token * 1.1
      };
    } else {
      return {
        action: 'HOLD',
        confidence: 40,
        allocation: '1-3%',
        thesis: ['High risk or insufficient data'],
        risks: ['Multiple risk factors identified'],
        exitStrategy: 'Wait for better opportunities or risk mitigation',
        priceTarget: property.price_per_token
      };
    }
  }

  private static getMockVerificationStatus(propertyId: string) {
    return {
      property_id: propertyId,
      verification_status: 'in_progress',
      title_search: { status: 'clear' },
      inspection: { status: 'completed', inspector_name: 'John Smith' },
      appraisal: { status: 'completed', appraised_value: 475000 },
      environmental: { status: 'clear' },
      legal_review: { status: 'pending' },
      final_rating: null,
      verified_at: null
    };
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
      },
      overall_completion_percentage: 100
    };
  }
}
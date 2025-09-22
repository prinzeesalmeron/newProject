import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle, Upload, FileText, Download, Eye, Star, TrendingUp } from 'lucide-react';
import { PropertyVerificationService } from '../lib/services/propertyVerificationService';
import { MarketDataService } from '../lib/services/marketDataService';
import { useAuth } from '../lib/auth';
import { toast } from './ui/Toast';
import { motion } from 'framer-motion';

interface PropertyVerificationPanelProps {
  propertyId: string;
  onVerificationComplete?: () => void;
}

export const PropertyVerificationPanel: React.FC<PropertyVerificationPanelProps> = ({
  propertyId,
  onVerificationComplete
}) => {
  const { user } = useAuth();
  const [verification, setVerification] = useState<any>(null);
  const [dueDiligence, setDueDiligence] = useState<any>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'checklist' | 'market' | 'inspections'>('overview');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationData();
  }, [propertyId]);

  const loadVerificationData = async () => {
    try {
      const [verificationData, dueDiligenceData, marketData] = await Promise.all([
        PropertyVerificationService.getVerificationStatus(propertyId),
        PropertyVerificationService.getDueDiligenceChecklist(propertyId),
        MarketDataService.getMarketAnalysis(propertyId)
      ]);

      setVerification(verificationData);
      setDueDiligence(dueDiligenceData);
      setMarketAnalysis(marketData);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    if (!user) return;

    try {
      setUploadingDoc(documentType);
      
      await PropertyVerificationService.uploadVerificationDocument(
        propertyId,
        documentType as any,
        file,
        user.id
      );

      toast.success('Document Uploaded', `${documentType.replace('_', ' ')} uploaded successfully`);
      loadVerificationData();

    } catch (error: any) {
      console.error('Document upload failed:', error);
      toast.error('Upload Failed', error.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleStartVerification = async () => {
    if (!user) return;

    try {
      await PropertyVerificationService.startVerificationProcess(propertyId, user.id);
      toast.success('Verification Started', 'Property verification process has been initiated');
      loadVerificationData();
    } catch (error: any) {
      console.error('Verification start failed:', error);
      toast.error('Failed to Start Verification', error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'clear':
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
      case 'scheduled':
      case 'ordered':
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'issues':
      case 'failed':
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'clear':
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'pending':
      case 'scheduled':
      case 'ordered':
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'issues':
      case 'failed':
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Property Verification</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive due diligence and validation</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verification?.verification_status || 'pending')}`}>
              {getStatusIcon(verification?.verification_status || 'pending')}
              <span className="ml-2 capitalize">{verification?.verification_status || 'Pending'}</span>
            </div>
            {!verification && user && (
              <button
                onClick={handleStartVerification}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Start Verification
              </button>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        {dueDiligence && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                dueDiligence.title_search?.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {getStatusIcon(dueDiligence.title_search?.completed ? 'completed' : 'pending')}
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Title Search</div>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                dueDiligence.physical_inspection?.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {getStatusIcon(dueDiligence.physical_inspection?.completed ? 'completed' : 'pending')}
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Inspection</div>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                dueDiligence.financial_analysis?.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {getStatusIcon(dueDiligence.financial_analysis?.completed ? 'completed' : 'pending')}
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Financial</div>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                dueDiligence.legal_review?.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {getStatusIcon(dueDiligence.legal_review?.completed ? 'completed' : 'pending')}
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Legal</div>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                dueDiligence.environmental_assessment?.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {getStatusIcon(dueDiligence.environmental_assessment?.completed ? 'completed' : 'pending')}
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Environmental</div>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                dueDiligence.insurance_review?.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {getStatusIcon(dueDiligence.insurance_review?.completed ? 'completed' : 'pending')}
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Insurance</div>
            </div>
          </div>
        )}

        {/* Completion Progress */}
        {dueDiligence?.overall_completion_percentage !== undefined && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Verification Progress</span>
              <span>{dueDiligence.overall_completion_percentage.toFixed(0)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dueDiligence.overall_completion_percentage}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'checklist', label: 'Due Diligence', icon: CheckCircle },
              { id: 'inspections', label: 'Inspections', icon: Eye },
              { id: 'market', label: 'Market Analysis', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Verification Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title Search</span>
                    {getStatusIcon(verification?.title_search?.status || 'pending')}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.title_search?.status || 'pending')}`}>
                    {verification?.title_search?.status || 'Pending'}
                  </div>
                  {verification?.title_search?.status === 'clear' && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Clear title confirmed
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Property Inspection</span>
                    {getStatusIcon(verification?.inspection?.status || 'pending')}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.inspection?.status || 'pending')}`}>
                    {verification?.inspection?.status || 'Pending'}
                  </div>
                  {verification?.inspection?.inspector_name && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Inspector: {verification.inspection.inspector_name}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Property Appraisal</span>
                    {getStatusIcon(verification?.appraisal?.status || 'pending')}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.appraisal?.status || 'pending')}`}>
                    {verification?.appraisal?.status || 'Pending'}
                  </div>
                  {verification?.appraisal?.appraised_value && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Value: ${verification.appraisal.appraised_value.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environmental Review</span>
                    {getStatusIcon(verification?.environmental?.status || 'pending')}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.environmental?.status || 'pending')}`}>
                    {verification?.environmental?.status || 'Pending'}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Legal Review</span>
                    {getStatusIcon(verification?.legal_review?.status || 'pending')}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.legal_review?.status || 'pending')}`}>
                    {verification?.legal_review?.status || 'Pending'}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {verification?.final_rating || 'TBD'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {verification?.final_rating ? 'Verification Complete' : 'Pending Completion'}
                  </div>
                </div>
              </div>

              {verification?.verification_notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">Verification Notes</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{verification.verification_notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { type: 'title_report', label: 'Title Report', icon: FileText, required: true },
                  { type: 'inspection_report', label: 'Inspection Report', icon: Eye, required: true },
                  { type: 'appraisal_report', label: 'Appraisal Report', icon: FileText, required: true },
                  { type: 'environmental_report', label: 'Environmental Report', icon: Shield, required: true },
                  { type: 'legal_opinion', label: 'Legal Opinion', icon: FileText, required: true },
                  { type: 'insurance_quote', label: 'Insurance Quote', icon: Shield, required: false }
                ].map((docType) => (
                  <div key={docType.type} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <docType.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{docType.label}</span>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        docType.required ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {docType.required ? 'Required' : 'Optional'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDocumentUpload(docType.type, file);
                          }
                        }}
                        className="hidden"
                        id={`upload-${docType.type}`}
                      />
                      <label
                        htmlFor={`upload-${docType.type}`}
                        className={`flex items-center justify-center space-x-2 w-full py-2 px-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          uploadingDoc === docType.type
                            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        {uploadingDoc === docType.type ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-600 dark:text-blue-400">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Upload {docType.label}</span>
                          </>
                        )}
                      </label>

                      {/* Mock existing document */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-800 dark:text-green-400">{docType.label}.pdf</span>
                          </div>
                          <button className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && dueDiligence && (
            <div className="space-y-6">
              {Object.entries(dueDiligence).filter(([key]) => key !== 'property_id' && key !== 'overall_completion_percentage').map(([category, data]: [string, any]) => (
                <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                    }`}>
                      {data.completed ? 'Complete' : 'Pending'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(data).filter(([key]) => key !== 'completed' && key !== 'notes').map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                          {key.replace('_', ' ')}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {Array.isArray(value) ? (
                            value.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {value.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              'None'
                            )
                          ) : typeof value === 'boolean' ? (
                            value ? 'Yes' : 'No'
                          ) : typeof value === 'number' ? (
                            value > 0 ? `$${value.toLocaleString()}` : '$0'
                          ) : typeof value === 'object' && value !== null ? (
                            <div className="space-y-1">
                              {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                                <div key={subKey} className="text-xs">
                                  <span className="font-medium">{subKey.replace('_', ' ')}:</span> {subValue}
                                </div>
                              ))}
                            </div>
                          ) : (
                            value || 'Not specified'
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {data.notes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-blue-800 dark:text-blue-300">{data.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'market' && marketAnalysis && (
            <div className="space-y-6">
              {/* Property Valuation */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    ${marketAnalysis.current_value?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Value</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    ${marketAnalysis.rental_estimate?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {marketAnalysis.investment_metrics?.cap_rate?.toFixed(1) || 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cap Rate</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {marketAnalysis.investment_metrics?.roi_projection?.toFixed(1) || 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ROI Projection</div>
                </div>
              </div>

              {/* Investment Metrics */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Investment Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketAnalysis.investment_metrics && Object.entries(marketAnalysis.investment_metrics).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <div className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {typeof value === 'number' ? 
                          (key.includes('rate') || key.includes('yield') || key.includes('projection') ? `${value.toFixed(1)}%` : value.toFixed(1)) 
                          : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Neighborhood Analysis */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Neighborhood Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {marketAnalysis.neighborhood_score && Object.entries(marketAnalysis.neighborhood_score).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Trends */}
              {marketAnalysis.market_trends && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Market Trends</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(marketAnalysis.market_trends).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace('_', ' ')}
                        </div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {typeof value === 'number' ? 
                            (key.includes('appreciation') || key.includes('growth') ? `${value.toFixed(1)}%` : value) 
                            : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparable Sales */}
              {marketAnalysis.comparable_sales && marketAnalysis.comparable_sales.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Comparable Sales</h4>
                  <div className="space-y-3">
                    {marketAnalysis.comparable_sales.slice(0, 5).map((comp: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{comp.address}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(comp.date).toLocaleDateString()} • {comp.distance} miles away
                          </div>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          ${comp.price.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
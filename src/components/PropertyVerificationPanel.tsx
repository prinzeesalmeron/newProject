import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle, Upload, FileText, Download, Eye } from 'lucide-react';
import { PropertyVerificationService } from '../lib/services/propertyVerificationService';
import { PropertyDataService } from '../lib/services/propertyDataService';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'checklist' | 'market'>('overview');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationData();
  }, [propertyId]);

  const loadVerificationData = async () => {
    try {
      const [verificationData, dueDiligenceData, marketData] = await Promise.all([
        PropertyVerificationService.getVerificationStatus(propertyId),
        PropertyVerificationService.getDueDiligenceChecklist(propertyId),
        PropertyDataService.getMarketAnalysis(propertyId)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'clear':
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
      case 'scheduled':
      case 'ordered':
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Property Verification</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due diligence and validation status</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verification?.verification_status || 'pending')}`}>
            {getStatusIcon(verification?.verification_status || 'pending')}
            <span className="ml-2 capitalize">{verification?.verification_status || 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'documents', label: 'Documents' },
            { id: 'checklist', label: 'Due Diligence' },
            { id: 'market', label: 'Market Analysis' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
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

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title Search</span>
                  {getStatusIcon(verification?.title_search?.status || 'pending')}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.title_search?.status || 'pending')}`}>
                  {verification?.title_search?.status || 'Pending'}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inspection</span>
                  {getStatusIcon(verification?.inspection?.status || 'pending')}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.inspection?.status || 'pending')}`}>
                  {verification?.inspection?.status || 'Pending'}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appraisal</span>
                  {getStatusIcon(verification?.appraisal?.status || 'pending')}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(verification?.appraisal?.status || 'pending')}`}>
                  {verification?.appraisal?.status || 'Pending'}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environmental</span>
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
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {verification?.final_rating || 'TBD'}
                  </span>
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
                { type: 'title_report', label: 'Title Report', icon: FileText },
                { type: 'inspection_report', label: 'Inspection Report', icon: Eye },
                { type: 'appraisal_report', label: 'Appraisal Report', icon: FileText },
                { type: 'environmental_report', label: 'Environmental Report', icon: Shield },
                { type: 'legal_opinion', label: 'Legal Opinion', icon: FileText }
              ].map((docType) => (
                <div key={docType.type} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <docType.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{docType.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Required</div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
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
            {Object.entries(dueDiligence).filter(([key]) => key !== 'property_id').map(([category, data]: [string, any]) => (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent Estimate</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {marketAnalysis.investment_metrics?.cap_rate?.toFixed(1) || 'N/A'}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cap Rate</div>
              </div>
            </div>

            {/* Neighborhood Scores */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Neighborhood Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {marketAnalysis.neighborhood_score && Object.entries(marketAnalysis.neighborhood_score).map(([key, value]: [string, any]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {typeof value === 'number' ? value : value}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investment Metrics */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Investment Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marketAnalysis.investment_metrics && Object.entries(marketAnalysis.investment_metrics).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <div className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {key.replace('_', ' ')}
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparable Sales */}
            {marketAnalysis.comparable_sales && marketAnalysis.comparable_sales.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Comparable Sales</h4>
                <div className="space-y-3">
                  {marketAnalysis.comparable_sales.slice(0, 3).map((comp: any, index: number) => (
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
  );
};
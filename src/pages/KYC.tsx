import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Upload, CheckCircle, AlertCircle, Clock, FileText,
  User, CreditCard, Home, Camera, X, ChevronRight, Info
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface KYCVerification {
  id: string;
  user_id: string;
  verification_id: string;
  status: string;
  verification_status: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

type KYCStep = 'start' | 'personal' | 'documents' | 'review' | 'complete';

export default function KYC() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<KYCVerification | null>(null);
  const [currentStep, setCurrentStep] = useState<KYCStep>('start');
  const [uploading, setUploading] = useState(false);

  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ssn: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });

  const [documents, setDocuments] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
    proofOfAddress: null as File | null
  });

  const [previews, setPreviews] = useState({
    idFront: '',
    idBack: '',
    selfie: '',
    proofOfAddress: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadKYCStatus();
  }, [user]);

  const loadKYCStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setVerification(data);
        if (data.status === 'approved') {
          setCurrentStep('complete');
        }
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setDocuments({ ...documents, [field]: file });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews({ ...previews, [field]: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (field: keyof typeof documents) => {
    setDocuments({ ...documents, [field]: null });
    setPreviews({ ...previews, [field]: '' });
  };

  const startVerification = () => {
    setCurrentStep('personal');
  };

  const submitPersonalInfo = () => {
    // Validate required fields
    const required = ['firstName', 'lastName', 'dateOfBirth', 'ssn', 'address', 'city', 'state', 'zipCode'];
    const missing = required.filter(field => !personalInfo[field as keyof typeof personalInfo]);

    if (missing.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate date of birth (must be 18+)
    const dob = new Date(personalInfo.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      toast.error('You must be at least 18 years old');
      return;
    }

    setCurrentStep('documents');
  };

  const submitDocuments = async () => {
    // Validate documents
    if (!documents.idFront || !documents.idBack || !documents.selfie) {
      toast.error('Please upload all required documents');
      return;
    }

    setUploading(true);
    try {
      // Upload documents to Supabase Storage
      const uploadedUrls: Record<string, string> = {};

      for (const [key, file] of Object.entries(documents)) {
        if (!file) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${key}_${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(fileName);

        uploadedUrls[key] = publicUrl;
      }

      // Create KYC verification record
      const { data: verificationData, error: verificationError } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: user?.id,
          verification_id: `kyc_${Date.now()}`,
          provider: 'manual',
          status: 'pending',
          verification_status: 'pending',
          fields: personalInfo,
          checks: {
            documents: uploadedUrls,
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (verificationError) throw verificationError;

      setVerification(verificationData);
      setCurrentStep('review');
      toast.success('Documents uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const resubmitVerification = () => {
    setCurrentStep('personal');
    setVerification(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
      case 'rejected':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6" />;
      case 'pending':
        return <Clock className="h-6 w-6" />;
      case 'rejected':
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Identity Verification (KYC)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verify your identity to start investing in tokenized real estate
          </p>
        </div>

        {/* Existing Verification Status */}
        {verification && currentStep !== 'personal' && currentStep !== 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full ${getStatusColor(verification.status)}`}>
                  {getStatusIcon(verification.status)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Verification Status: {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {verification.status === 'approved' && 'Your identity has been verified successfully!'}
                    {verification.status === 'pending' && 'Your documents are being reviewed. This typically takes 1-2 business days.'}
                    {verification.status === 'rejected' && 'Your verification was not approved. Please resubmit with correct information.'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Submitted: {new Date(verification.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {verification.status === 'rejected' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={resubmitVerification}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Resubmit Verification
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Start Screen */}
        {currentStep === 'start' && !verification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Why Verify Your Identity?</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Identity verification is required by law to prevent fraud and ensure compliance with regulations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your data is encrypted and protected</p>
              </div>
              <div className="text-center">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Typically verified in 1-2 business days</p>
              </div>
              <div className="text-center">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Required</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mandated by law for investments</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">What you'll need:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Government-issued ID (driver's license or passport)</li>
                    <li>Social Security Number</li>
                    <li>Proof of address (utility bill or bank statement)</li>
                    <li>A clear selfie</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={startVerification}
              className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <span>Start Verification</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {/* Personal Information Step */}
        {currentStep === 'personal' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Social Security Number *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.ssn}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, ssn: e.target.value })}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.state}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })}
                    placeholder="CA"
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.zipCode}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, zipCode: e.target.value })}
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep('start')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={submitPersonalInfo}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <span>Continue</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Documents Upload Step */}
        {currentStep === 'documents' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upload Documents</h2>

            <div className="space-y-6">
              {/* ID Front */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Government ID (Front) *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  {previews.idFront ? (
                    <div className="relative">
                      <img src={previews.idFront} alt="ID Front" className="max-h-48 mx-auto rounded" />
                      <button
                        onClick={() => removeFile('idFront')}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('idFront', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* ID Back */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Government ID (Back) *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  {previews.idBack ? (
                    <div className="relative">
                      <img src={previews.idBack} alt="ID Back" className="max-h-48 mx-auto rounded" />
                      <button
                        onClick={() => removeFile('idBack')}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('idBack', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selfie (Clear face photo) *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  {previews.selfie ? (
                    <div className="relative">
                      <img src={previews.selfie} alt="Selfie" className="max-h-48 mx-auto rounded" />
                      <button
                        onClick={() => removeFile('selfie')}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Proof of Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proof of Address (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  {previews.proofOfAddress ? (
                    <div className="relative">
                      <img src={previews.proofOfAddress} alt="Proof of Address" className="max-h-48 mx-auto rounded" />
                      <button
                        onClick={() => removeFile('proofOfAddress')}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Utility bill or bank statement</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('proofOfAddress', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep('personal')}
                disabled={uploading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={submitDocuments}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Verification</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Review/Pending Step */}
        {currentStep === 'review' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"
          >
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Clock className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verification Submitted!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Your documents are being reviewed. We'll notify you via email once the verification is complete.
              This typically takes 1-2 business days.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

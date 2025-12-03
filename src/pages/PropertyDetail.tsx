import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Calendar, TrendingUp, Heart,
  Share2, Download, FileText, Image as ImageIcon, Bell,
  ChevronLeft, ChevronRight, X, DollarSign, Users, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { InvestmentModal } from '../components/InvestmentModal';
import { motion, AnimatePresence } from 'framer-motion';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  property_type: string;
  price: number;
  token_price: number;
  total_tokens: number;
  available_tokens: number;
  annual_return: number;
  rental_yield: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  year_built: number;
  status: string;
  amenities: string[];
  images: string[];
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadPropertyData();
      checkFavoriteStatus();
    }
  }, [id]);

  const loadPropertyData = async () => {
    try {
      // Load property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Load images
      const { data: imagesData } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id)
        .order('display_order');

      setImages(imagesData || []);

      // Load documents
      const { data: documentsData } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', id)
        .order('document_type');

      setDocuments(documentsData || []);

      // Load updates
      const { data: updatesData } = await supabase
        .from('property_updates')
        .select('*')
        .eq('property_id', id)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(5);

      setUpdates(updatesData || []);
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert('Please login to save favorites');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);
        setIsFavorite(false);
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, property_id: id });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const shareProperty = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: property?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const calculateROI = (tokens: number) => {
    if (!property) return { investment: 0, annual: 0, monthly: 0 };
    const investment = tokens * property.token_price;
    const annual = investment * (property.annual_return / 100);
    const monthly = annual / 12;
    return { investment, annual, monthly };
  };

  const roi = calculateROI(investmentAmount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Property Not Found</h2>
          <Link to="/" className="text-blue-600 hover:underline">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const fundedPercentage = ((property.total_tokens - property.available_tokens) / property.total_tokens) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Image Gallery */}
      <div className="relative h-96 bg-gray-200 dark:bg-gray-800">
        {images.length > 0 ? (
          <>
            <img
              src={images[selectedImageIndex]?.url || property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
            />
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between p-4">
                <button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  disabled={selectedImageIndex === images.length - 1}
                >
                  <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
                </button>
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full text-sm font-medium">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-24 w-24 text-gray-400" />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{property.address}, {property.city}, {property.state}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleFavorite}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={shareProperty}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Bed className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">{property.bedrooms} Beds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bath className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">{property.bathrooms} Baths</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Square className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">{property.sqft?.toLocaleString()} sqft</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">Built {property.year_built}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-8 px-6">
                  {['overview', 'documents', 'updates'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About This Property</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{property.description}</p>
                    </div>

                    {property.amenities && property.amenities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Amenities</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {property.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <span className="text-gray-700 dark:text-gray-300">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    {documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No documents available</p>
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{doc.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{doc.document_type}</p>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <Download className="h-5 w-5" />
                            <span>Download</span>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div className="space-y-4">
                    {updates.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No updates yet</p>
                      </div>
                    ) : (
                      updates.map((update) => (
                        <div key={update.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{update.title}</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">{update.content}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(update.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Investment Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4">
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  ${property.token_price.toLocaleString()}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/token</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>{property.annual_return}% Annual Return</span>
                  </div>
                </div>
              </div>

              {/* Funding Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Funding Progress</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{fundedPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${fundedPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{property.total_tokens - property.available_tokens} tokens sold</span>
                  <span>{property.available_tokens} remaining</span>
                </div>
              </div>

              {/* Investment Calculator */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max={property.available_tokens}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Investment:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${roi.investment.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Est. Annual Income:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">${roi.annual.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Est. Monthly Income:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">${roi.monthly.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInvestModal(true)}
                disabled={property.available_tokens === 0}
                className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {property.available_tokens === 0 ? 'Fully Funded' : 'Invest Now'}
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${property.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Investors:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    <Users className="h-4 w-4 inline mr-1" />
                    Coming soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestModal && (
        <InvestmentModal
          property={property}
          onClose={() => setShowInvestModal(false)}
          initialTokens={investmentAmount}
        />
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <img
              src={images[selectedImageIndex]?.url || property.images[0]}
              alt={property.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

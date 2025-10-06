import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Plus, Shield, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { EmptyState, LoadingSpinner, Button, Card } from '../components/ui';
import { toast } from '../components/ui/Toast';
import { PropertyCard } from '../components/PropertyCard';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { PropertyImportModal } from '../components/PropertyImportModal';
import { PropertyVerificationPanel } from '../components/PropertyVerificationPanel';
import { MarketDataService } from '../lib/services/marketDataService';
import { Property } from '../lib/supabase';
import { PropertyAPI } from '../lib/api';
import { useAuth, isAdmin } from '../lib/auth';
import { motion } from 'framer-motion';

export const Marketplace = () => {
  const { user, profile } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('All Markets');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Use the new useApi hook for better data management
  const {
    data: properties,
    loading,
    error,
    refetch: fetchProperties
  } = useApi(() => PropertyAPI.getAllProperties(), { immediate: true });


  // Check if user can add properties (admin or property manager)
  const canAddProperties = user && (
    isAdmin(profile || user) || 
    profile?.role === 'admin' || 
    profile?.role === 'property_manager' ||
    user?.user_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'property_manager'
  );

  const propertyTypes = [
    'All Markets',
    'Cash Flowing',
    'Vacation Rentals',
    'Commercial',
    'Single Family',
    'Multi Family',
    'Owner Occupied'
  ];

  const handleAddProperty = async (propertyData: Omit<Property, 'id'>) => {
    try {
      console.log('Adding property:', propertyData);
      const newProperty = await PropertyAPI.createProperty(propertyData);
      console.log('Property added successfully:', newProperty);
      
      // Refresh the properties list
      fetchProperties();
      
      // Show success toast
      toast.success('Property Added', `"${newProperty.title}" has been added successfully!`);
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to Add Property', 'Please try again.');
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const handleImportProperty = (property: any) => {
    console.log('Property imported:', property);
    fetchProperties();
    toast.success('Property Imported', 'Property has been imported and verification started');
  };

  const handleImportFromMLS = async (mlsId: string) => {
    try {
      const importedProperty = await MarketDataService.importPropertyFromMLS(mlsId);
      fetchProperties();
      toast.success('MLS Import Successful', `Property ${importedProperty.title} imported and verification started`);
    } catch (error: any) {
      console.error('MLS import failed:', error);
      toast.error('Import Failed', error.message);
    }
  };

  const handleViewVerification = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowVerificationPanel(true);
  };

  const filteredProperties = (properties || []).filter((property) => {
    const matchesType = selectedType === 'All Markets' || property.property_type === selectedType;
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleInvest = (propertyId: string) => {
    console.log('Investing in property:', propertyId);

    // Check if user is authenticated
    if (!user) {
      toast.error('Authentication Required', 'Please sign in to invest in properties.');
      return;
    }

    // In a real implementation, this would open an investment modal
    // For now, we'll simulate an investment
    const tokenAmount = 10; // Example: buying 10 tokens
    const property = properties.find(p => p.id === propertyId);

    if (!property) {
      toast.error('Property Not Found', 'The property you are trying to invest in could not be found.');
      return;
    }

    const totalCost = tokenAmount * property.price_per_token;

    PropertyAPI.investInProperty(propertyId, tokenAmount, totalCost)
      .then(() => {
        toast.success('Investment Successful', `Successfully invested $${totalCost} in ${property.title}!`);
        // Refresh properties to show updated available tokens
        fetchProperties();
      })
      .catch(error => {
        console.error('Investment failed:', error);
        toast.error('Investment Failed', error.message || 'Please try again.');
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading properties..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <EmptyState
            icon="⚠️"
            title="Error Loading Properties"
            description={error}
            action={{
              label: "Try Again",
              onClick: fetchProperties
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Property Marketplace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Discover premium real estate investment opportunities. Start building your portfolio today.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by address or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Property Types Filter */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 py-4 overflow-x-auto">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span> Filter</span>
            </button>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredProperties.length} Properties Available
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {selectedType === 'All Markets' ? 'all' : selectedType.toLowerCase()} properties
              </div>
              {canAddProperties && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Property</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center space-x-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    <span>Import from MLS</span>
                  </button>
                  <button
                    onClick={() => handleViewVerification('')}
                    className="flex items-center space-x-2 bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Verification Center</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {filteredProperties.length === 0 && (
            <EmptyState
              icon="🏠"
              title="No properties available yet"
              description="Get started by adding the first property to the marketplace. Properties you add will appear here for investors to discover."
              action={
                canAddProperties
                  ? {
                      label: "Add First Property",
                      onClick: () => setShowAddModal(true)
                    }
                  : undefined
              }
            />
          )}

          {filteredProperties.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onInvest={handleInvest}
                    onViewVerification={() => handleViewVerification(property.id)}
                  />
                ))}
              </motion.div>

              <div className="text-center mt-12">
                <Button size="lg">
                  Load More Properties
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Debug Panel for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
          <div className="font-bold mb-2">Debug Info:</div>
          <div>User: {user ? '✓' : '✗'}</div>
          <div>Profile: {profile ? '✓' : '✗'}</div>
          <div>Profile Role: {profile?.role || 'none'}</div>
          <div>User Role: {user?.user_metadata?.role || 'none'}</div>
          <div>Can Add Properties: {canAddProperties ? '✓' : '✗'}</div>
          <div>Properties Count: {properties?.length || 0}</div>
        </div>
      )}
      <AddPropertyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProperty}
      />

      <PropertyImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportProperty}
        onMLSImport={handleImportFromMLS}
      />

      {showVerificationPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Property Verification</h2>
                <button
                  onClick={() => setShowVerificationPanel(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <PropertyVerificationPanel
              propertyId={selectedPropertyId}
              onVerificationComplete={() => {
                setShowVerificationPanel(false);
                fetchProperties();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
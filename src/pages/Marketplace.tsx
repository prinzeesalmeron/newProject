import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Plus } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { EmptyState, LoadingSpinner, Button, Card } from '../components/ui';
import { toast } from '../components/ui/Toast';
import { PropertyCard } from '../components/PropertyCard';
import { AddPropertyModal } from '../components/AddPropertyModal';
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

  // Use the new useApi hook for better data management
  const {
    data: properties = [],
    loading,
    error,
    refetch: fetchProperties
  } = useApi(() => PropertyAPI.getAllProperties());

  // Debug admin status
  console.log('User:', user);
  console.log('Profile:', profile);
  console.log('Is Admin:', isAdmin(profile || user));
  console.log('Profile role:', profile?.role);
  console.log('User metadata role:', user?.user_metadata?.role);

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
      await fetchProperties();
      
      // Show success toast
      toast.success('Property Added', `"${newProperty.title}" has been added successfully!`);
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to Add Property', 'Please try again.');
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesType = selectedType === 'All Markets' || property.property_type === selectedType;
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleInvest = (propertyId: string) => {
    console.log('Investing in property:', propertyId);
    if (!user) {
      // Show auth modal instead of alert
      const navbar = document.querySelector('[data-auth-modal]');
      if (navbar) {
        // Trigger sign in modal - this is a simple approach
        // In a real app, you might want to use a global state or context
      }
      alert('Please sign in to invest in properties. Click "Sign Up" in the navigation to create an account.');
      return;
    }
    
    // In a real implementation, this would open an investment modal
    // For now, we'll simulate an investment
    const tokenAmount = 10; // Example: buying 10 tokens
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      const totalCost = tokenAmount * property.price_per_token;
      PropertyAPI.investInProperty(propertyId, tokenAmount, totalCost)
        .then(() => {
          alert(`Successfully invested $${totalCost} in ${property.title}!`);
          fetchProperties(); // Refresh properties to update available tokens
        })
        .catch(error => {
          console.error('Investment failed:', error);
          alert('Investment failed. Please try again.');
        });
    }
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
              {user && (isAdmin(profile) || isAdmin(user) || profile?.role === 'admin') && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Property</span>
                </button>
              )}
            </div>
          </div>

          {filteredProperties.length === 0 && (
            <EmptyState
              icon="🏠"
              title="No properties available yet"
              description="Get started by adding the first property to the marketplace. Properties you add will appear here for investors to discover."
              action={
                user && (isAdmin(profile) || isAdmin(user) || profile?.role === 'admin')
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

      <AddPropertyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProperty}
      />
    </div>
  );
};
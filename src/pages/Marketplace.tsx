import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Plus } from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { Property, mockApi } from '../lib/mockData';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';

export const Marketplace = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('All Markets');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const propertyTypes = [
    'All Markets',
    'Cash Flowing',
    'Vacation Rentals',
    'Commercial',
    'Single Family',
    'Multi Family',
    'Owner Occupied'
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const data = await mockApi.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async (propertyData: Omit<Property, 'id'>) => {
    try {
      const newProperty = await mockApi.addProperty(propertyData);
      setProperties(prev => [...prev, newProperty]);
    } catch (error) {
      console.error('Error adding property:', error);
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
      alert('Please sign in to invest in properties');
      return;
    }
    // Handle investment logic here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Property Marketplace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
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
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by address or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Property Types Filter */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 py-4 overflow-x-auto">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
            </button>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredProperties.length} Properties Available
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Showing {selectedType === 'All Markets' ? 'all' : selectedType.toLowerCase()} properties
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Property</span>
              </button>
            </div>
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-20">
              <div className="text-gray-400 text-8xl mb-6">🏠</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No properties available yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Get started by adding the first property to the marketplace. Properties you add will appear here for investors to discover.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Add First Property</span>
              </button>
            </div>
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
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Load More Properties
                </button>
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
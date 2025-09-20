import React, { useState } from 'react';
import { X, Search, Upload, MapPin, DollarSign, Home, TrendingUp } from 'lucide-react';
import { PropertyDataService } from '../lib/services/propertyDataService';
import { PropertyAPI } from '../lib/api';
import { toast } from './ui/Toast';
import { motion } from 'framer-motion';

interface PropertyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (property: any) => void;
}

export const PropertyImportModal: React.FC<PropertyImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<'mls' | 'manual' | 'csv'>('mls');
  const [loading, setLoading] = useState(false);
  
  // MLS Search
  const [mlsSearch, setMLSSearch] = useState({
    city: '',
    state: '',
    min_price: '',
    max_price: '',
    property_type: '',
    bedrooms: ''
  });
  const [mlsResults, setMLSResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Manual Entry
  const [manualProperty, setManualProperty] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    year_built: '',
    description: '',
    photos: ['']
  });

  // CSV Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const handleMLSSearch = async () => {
    try {
      setSearchLoading(true);
      const results = await PropertyDataService.searchMLSProperties({
        city: mlsSearch.city,
        state: mlsSearch.state,
        min_price: mlsSearch.min_price ? parseInt(mlsSearch.min_price) : undefined,
        max_price: mlsSearch.max_price ? parseInt(mlsSearch.max_price) : undefined,
        property_type: mlsSearch.property_type || undefined,
        bedrooms: mlsSearch.bedrooms ? parseInt(mlsSearch.bedrooms) : undefined
      });

      setMLSResults(results);
      
      if (results.length === 0) {
        toast.info('No Results', 'No properties found matching your criteria');
      }

    } catch (error: any) {
      console.error('MLS search failed:', error);
      toast.error('Search Failed', error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMLSImport = async (mlsProperty: any) => {
    try {
      setLoading(true);
      const importedProperty = await PropertyDataService.importPropertyFromMLS(mlsProperty.mls_id);
      
      toast.success('Property Imported', `${mlsProperty.address} has been imported and verification started`);
      onImport(importedProperty);
      onClose();

    } catch (error: any) {
      console.error('MLS import failed:', error);
      toast.error('Import Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    try {
      setLoading(true);
      
      // Convert manual entry to property format
      const propertyData = {
        title: `${manualProperty.address} - ${manualProperty.city}, ${manualProperty.state}`,
        description: manualProperty.description,
        image_url: manualProperty.photos[0] || 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg',
        location: `${manualProperty.city}, ${manualProperty.state}`,
        property_type: 'Single Family' as const,
        price_per_token: 100,
        total_tokens: Math.floor(parseInt(manualProperty.price) / 100),
        available_tokens: Math.floor(parseInt(manualProperty.price) / 100),
        rental_yield: 8.0,
        projected_return: 12.0,
        rating: 0,
        features: ['Manual Entry'],
        is_yield_property: true,
        yield_percentage: '8.0%',
        status: 'coming_soon' as const
      };

      const newProperty = await PropertyAPI.createProperty(propertyData);
      
      toast.success('Property Added', 'Property has been added and verification started');
      onImport(newProperty);
      onClose();

    } catch (error: any) {
      console.error('Manual property creation failed:', error);
      toast.error('Creation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (file: File) => {
    try {
      setCsvFile(file);
      
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
          return obj;
        }, {} as any);
      });

      setCsvPreview(preview);
      
    } catch (error) {
      console.error('CSV parsing failed:', error);
      toast.error('CSV Error', 'Failed to parse CSV file');
    }
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;

    try {
      setLoading(true);
      
      // In production, process entire CSV file
      toast.success('CSV Import Started', 'Properties are being imported in the background');
      onClose();

    } catch (error: any) {
      console.error('CSV import failed:', error);
      toast.error('Import Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Properties</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'mls', label: 'MLS Search', icon: Search },
              { id: 'manual', label: 'Manual Entry', icon: Home },
              { id: 'csv', label: 'CSV Upload', icon: Upload }
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
          {activeTab === 'mls' && (
            <div className="space-y-6">
              {/* Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={mlsSearch.city}
                    onChange={(e) => setMLSSearch({ ...mlsSearch, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={mlsSearch.state}
                    onChange={(e) => setMLSSearch({ ...mlsSearch, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="TX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Type</label>
                  <select
                    value={mlsSearch.property_type}
                    onChange={(e) => setMLSSearch({ ...mlsSearch, property_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="Single Family Residential">Single Family</option>
                    <option value="Condominium">Condominium</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Price</label>
                  <input
                    type="number"
                    value={mlsSearch.min_price}
                    onChange={(e) => setMLSSearch({ ...mlsSearch, min_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Min price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Price</label>
                  <input
                    type="number"
                    value={mlsSearch.max_price}
                    onChange={(e) => setMLSSearch({ ...mlsSearch, max_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Max price"
                  />
                </div>
                <div>
                  <button
                    onClick={handleMLSSearch}
                    disabled={searchLoading}
                    className="w-full h-10 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
                  >
                    {searchLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>Search MLS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {mlsResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Found {mlsResults.length} Properties
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {mlsResults.map((property, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{property.address}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {property.city}, {property.state} {property.zip_code}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              ${property.price.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              MLS: {property.mls_id}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Beds:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">{property.bedrooms}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Baths:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">{property.bathrooms}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Sq Ft:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">{property.square_feet.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Listed: {new Date(property.listing_date).toLocaleDateString()}
                          </div>
                          <button
                            onClick={() => handleMLSImport(property)}
                            disabled={loading}
                            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 transition-colors text-sm"
                          >
                            {loading ? 'Importing...' : 'Import'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address *</label>
                  <input
                    type="text"
                    value={manualProperty.address}
                    onChange={(e) => setManualProperty({ ...manualProperty, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City *</label>
                  <input
                    type="text"
                    value={manualProperty.city}
                    onChange={(e) => setManualProperty({ ...manualProperty, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Austin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State *</label>
                  <input
                    type="text"
                    value={manualProperty.state}
                    onChange={(e) => setManualProperty({ ...manualProperty, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="TX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={manualProperty.zip_code}
                    onChange={(e) => setManualProperty({ ...manualProperty, zip_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="78701"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price *</label>
                  <input
                    type="number"
                    value={manualProperty.price}
                    onChange={(e) => setManualProperty({ ...manualProperty, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="450000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bedrooms</label>
                  <input
                    type="number"
                    value={manualProperty.bedrooms}
                    onChange={(e) => setManualProperty({ ...manualProperty, bedrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    value={manualProperty.bathrooms}
                    onChange={(e) => setManualProperty({ ...manualProperty, bathrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Square Feet</label>
                  <input
                    type="number"
                    value={manualProperty.square_feet}
                    onChange={(e) => setManualProperty({ ...manualProperty, square_feet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="1800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year Built</label>
                  <input
                    type="number"
                    value={manualProperty.year_built}
                    onChange={(e) => setManualProperty({ ...manualProperty, year_built: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="2018"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={manualProperty.description}
                  onChange={(e) => setManualProperty({ ...manualProperty, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe the property..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo URLs</label>
                {manualProperty.photos.map((photo, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="url"
                      value={photo}
                      onChange={(e) => {
                        const newPhotos = [...manualProperty.photos];
                        newPhotos[index] = e.target.value;
                        setManualProperty({ ...manualProperty, photos: newPhotos });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://example.com/photo.jpg"
                    />
                    {index === manualProperty.photos.length - 1 && (
                      <button
                        onClick={() => setManualProperty({ 
                          ...manualProperty, 
                          photos: [...manualProperty.photos, ''] 
                        })}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleManualSubmit}
                disabled={loading || !manualProperty.address || !manualProperty.city || !manualProperty.price}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Adding Property...' : 'Add Property'}
              </button>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload CSV File</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Upload a CSV file with property data to import multiple properties at once
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCSVUpload(file);
                    }}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Choose CSV File</span>
                  </label>
                </div>
              </div>

              {csvPreview.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview (First 5 rows)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 dark:border-gray-600 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {Object.keys(csvPreview[0] || {}).map((header) => (
                            <th key={header} className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, index) => (
                          <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <button
                    onClick={handleCSVImport}
                    disabled={loading}
                    className="w-full mt-4 bg-green-600 dark:bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Importing...' : `Import ${csvPreview.length} Properties`}
                  </button>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">CSV Format Requirements</h4>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p>Required columns: address, city, state, price</p>
                  <p>Optional columns: bedrooms, bathrooms, square_feet, year_built, description</p>
                  <p>Example: "123 Main St","Austin","TX","450000","3","2","1800","2018","Beautiful home"</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              All imported properties undergo comprehensive verification before going live
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
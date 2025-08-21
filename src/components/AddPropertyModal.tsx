import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Property } from '../lib/supabase';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    location: '',
    property_type: 'Single Family' as Property['property_type'],
    price_per_token: 0,
    total_tokens: 0,
    available_tokens: 0,
    rental_yield: 0,
    projected_return: 0,
    rating: 0,
    features: '',
    is_yield_property: true,
    yield_percentage: '',
    status: 'active' as Property['status']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const property: Omit<Property, 'id' | 'created_at' | 'updated_at'> = {
      ...formData,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      yield_percentage: formData.yield_percentage || `${formData.rental_yield}%`
    };

    onAdd(property);
    onClose();
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      image_url: '',
      location: '',
      property_type: 'Single Family',
      price_per_token: 0,
      total_tokens: 0,
      available_tokens: 0,
      rental_yield: 0,
      projected_return: 0,
      rating: 0,
      features: '',
      is_yield_property: true,
      yield_percentage: '',
      status: 'active'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Add New Property</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Modern Downtown Apartment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the property..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type *
              </label>
              <select
                required
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value as Property['property_type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Single Family">Single Family</option>
                <option value="Multi Family">Multi Family</option>
                <option value="Commercial">Commercial</option>
                <option value="Vacation Rentals">Vacation Rentals</option>
                <option value="Cash Flowing">Cash Flowing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (0-5) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Token ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price_per_token}
                onChange={(e) => setFormData({ ...formData, price_per_token: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Tokens *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.total_tokens}
                onChange={(e) => setFormData({ ...formData, total_tokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Tokens *
              </label>
              <input
                type="number"
                required
                min="0"
                max={formData.total_tokens}
                value={formData.available_tokens}
                onChange={(e) => setFormData({ ...formData, available_tokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rental Yield (%) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.rental_yield}
                onChange={(e) => setFormData({ ...formData, rental_yield: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projected Return (%) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.projected_return}
                onChange={(e) => setFormData({ ...formData, projected_return: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features (comma-separated)
            </label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Pool, Gym, Parking, Security"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
import React from 'react';
import { Heart, TrendingUp, MapPin, Star } from 'lucide-react';
import { Property } from '../lib/mockData';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  property: Property;
  onInvest?: (propertyId: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onInvest }) => {
  const [isLiked, setIsLiked] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative">
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Yield Badge */}
        {property.is_yield_property && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
            {property.yield_percentage} Yield
          </div>
        )}

        {/* Property Type */}
        <div className="absolute top-3 right-12 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
          {property.property_type}
        </div>

        {/* Like Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Heart
            className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`}
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          {property.location}
        </div>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">{property.rating}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Rental Yield</p>
            <p className="text-sm font-semibold text-green-600">{property.rental_yield}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Projected Return</p>
            <p className="text-sm font-semibold text-blue-600">{property.projected_return}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Available Tokens</p>
            <p className="text-sm font-semibold">{property.available_tokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Price per Token</p>
            <p className="text-sm font-semibold">${property.price_per_token}</p>
          </div>
        </div>

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {property.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => onInvest?.(property.id)}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Invest Now</span>
        </button>
      </div>
    </motion.div>
  );
};
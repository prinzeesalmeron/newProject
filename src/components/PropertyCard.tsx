import React from 'react';
import { Heart, TrendingUp, MapPin, Star } from 'lucide-react';
import { Property } from '../lib/supabase';
import { useWallet } from '../lib/wallet';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  property: Property;
  onInvest?: (propertyId: string) => void;
  onViewVerification?: (propertyId: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onInvest }) => {
  const { isConnected } = useWallet();
  const [isLiked, setIsLiked] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-[480px] flex flex-col"
    >
      <div className="relative">
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-48 object-cover flex-shrink-0"
        />
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <Heart
            className={`h-5 w-5 ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </button>
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{property.rating || 4.5}</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2 min-h-[3.5rem]">
            {property.title}
          </h3>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
            ${(property.price_per_token * property.total_tokens).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{property.location}</span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1 min-h-[4.5rem]">
          {property.description}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{property.projected_return}%</div>
            <div className="text-xs text-gray-500">Expected Return</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">${property.price_per_token}</div>
            <div className="text-xs text-gray-500">Min Investment</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(((property.total_tokens - property.available_tokens) / property.total_tokens) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Funded</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Funding Progress</span>
            <span>{Math.round(((property.total_tokens - property.available_tokens) / property.total_tokens) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(((property.total_tokens - property.available_tokens) / property.total_tokens) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => onInvest?.(property.id)}
            className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
              isConnected 
                ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>{isConnected ? 'Invest Now' : 'Connect Wallet'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
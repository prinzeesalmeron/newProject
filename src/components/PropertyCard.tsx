import React from 'react';
import { Heart, TrendingUp, MapPin, Star } from 'lucide-react';
import { Property } from '../lib/supabase';
import { PaymentModal } from './PaymentModal';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

interface PropertyCardProps {
  property: Property;
  onInvest?: (propertyId: string) => void;
  onViewVerification?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onInvest }) => {
export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onInvest, onViewVerification }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [tokenAmount, setTokenAmount] = React.useState(10); // Default investment amount

  const handleInvestClick = () => {
    if (!user) {
      alert('Please sign in to invest in properties. Click "Sign Up" in the navigation to create an account.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    onInvest?.(property.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative">
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Yield Badge */}
        {property.is_yield_property && (
          <div className="absolute top-3 left-3 bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
            {property.yield_percentage} Yield
          </div>
        )}

        {/* Property Type */}
        <div className="absolute top-3 right-12 bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
          {property.property_type}
        </div>

        {/* Like Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Heart
            className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400 dark:text-gray-500'}`}
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{property.title}</h3>
        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
          {property.location}
        </div>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{property.rating}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rental Yield</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">{property.rental_yield}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projected Return</p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{property.projected_return}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available Tokens</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{property.available_tokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price per Token</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">${property.price_per_token}</p>
          </div>
        </div>

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {property.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleInvestClick}
          className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
            user 
              ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>{user ? 'Invest Now' : 'Sign In to Invest'}</span>
        </button>

        {/* Verification Status Button */}
        {onViewVerification && (
          <button
            onClick={onViewVerification}
            className="w-full mt-2 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Shield className="h-4 w-4" />
            <span>View Verification</span>
          </button>
        )}
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        tokenAmount={tokenAmount}
        pricePerToken={property.price_per_token}
        onSuccess={handlePaymentSuccess}
      />
    </motion.div>
  );
};
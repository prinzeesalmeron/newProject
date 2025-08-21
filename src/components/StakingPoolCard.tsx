import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { StakingPool } from '../lib/supabase';

interface StakingPoolCardProps {
  pool: StakingPool;
  isSelected: boolean;
  onSelect: (poolId: string) => void;
}

export const StakingPoolCard: React.FC<StakingPoolCardProps> = ({
  pool,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(pool.id)}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{pool.name}</h3>
        <span className="text-lg font-bold text-blue-600">{pool.apy}%</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{pool.description}</p>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-500">
          <span className="text-xs font-medium">APY</span>
        </div>
        <div className="flex items-center text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          <span className="text-xs">
            {pool.lock_period === 0 ? 'No lock' : `${pool.lock_period} days`}
          </span>
        </div>
      </div>
    </div>
  );
};
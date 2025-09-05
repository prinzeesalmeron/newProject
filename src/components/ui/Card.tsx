import React from 'react';
import { motion } from 'framer-motion';
import type { BaseComponentProps } from '../../types';

interface CardProps extends BaseComponentProps {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
};

export const Card: React.FC<CardProps> = ({
  hover = false,
  padding = 'md',
  shadow = 'sm',
  children,
  className = ''
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, shadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' } : {}}
      className={`
        bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${hover ? 'transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader: React.FC<BaseComponentProps> = ({ children, className = '' }) => (
  <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<BaseComponentProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
    {children}
  </h3>
);

export const CardContent: React.FC<BaseComponentProps> = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter: React.FC<BaseComponentProps> = ({ children, className = '' }) => (
  <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 ${className}`}>
    {children}
  </div>
);
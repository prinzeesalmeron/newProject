import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = true
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
};

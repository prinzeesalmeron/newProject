import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || null);

interface PaymentProviderProps {
  children: React.ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const options = {
    // Stripe Elements options
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3B82F6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};
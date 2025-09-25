import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyCard } from '../../components/PropertyCard';
import { createMockProperty } from '../setup';

// Mock the wallet hook
vi.mock('../../lib/wallet', () => ({
  useWallet: () => ({
    isConnected: true,
    address: '0x123...',
    balance: '1.5',
    blockBalance: 2500
  })
}));

describe('PropertyCard', () => {
  const mockProperty = createMockProperty();
  const mockOnInvest = vi.fn();

  it('renders property information correctly', () => {
    render(
      <PropertyCard 
        property={mockProperty} 
        onInvest={mockOnInvest} 
      />
    );

    expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    expect(screen.getByText(mockProperty.location)).toBeInTheDocument();
    expect(screen.getByText('Invest Now')).toBeInTheDocument();
  });

  it('calls onInvest when invest button is clicked', () => {
    render(
      <PropertyCard 
        property={mockProperty} 
        onInvest={mockOnInvest} 
      />
    );

    fireEvent.click(screen.getByText('Invest Now'));
    expect(mockOnInvest).toHaveBeenCalledWith(mockProperty.id);
  });

  it('shows connect wallet when wallet not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      address: null,
      balance: '0',
      blockBalance: 0
    });

    render(
      <PropertyCard 
        property={mockProperty} 
        onInvest={mockOnInvest} 
      />
    );

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
});
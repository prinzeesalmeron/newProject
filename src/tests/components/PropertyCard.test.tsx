import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PropertyCard } from '../../components/PropertyCard';
import { createMockProperty } from '../setup';

const mockUseAuth = vi.fn();

vi.mock('../../lib/auth', () => ({
  useAuth: () => mockUseAuth()
}));

describe('PropertyCard', () => {
  const mockProperty = createMockProperty();
  const mockOnInvest = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      initialized: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      initialize: vi.fn()
    });
  });

  it('renders property information correctly', () => {
    render(
      <BrowserRouter>
        <PropertyCard
          property={mockProperty}
          onInvest={mockOnInvest}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    expect(screen.getByText(mockProperty.location)).toBeInTheDocument();
    expect(screen.getByText('Invest Now')).toBeInTheDocument();
  });

  it('calls onInvest when invest button is clicked', () => {
    render(
      <BrowserRouter>
        <PropertyCard
          property={mockProperty}
          onInvest={mockOnInvest}
        />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Invest Now'));
    expect(mockOnInvest).toHaveBeenCalledWith(mockProperty.id);
  });

  it('shows sign in when user not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      initialized: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      initialize: vi.fn()
    });

    render(
      <BrowserRouter>
        <PropertyCard
          property={mockProperty}
          onInvest={mockOnInvest}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Sign In to Invest')).toBeInTheDocument();
  });
});
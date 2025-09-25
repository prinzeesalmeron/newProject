import { describe, it, expect, vi } from 'vitest';
import { PropertyAPI, StakingAPI } from '../../lib/api';
import { mockSupabase, createMockProperty } from '../setup';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('PropertyAPI', () => {
  it('should fetch all properties', async () => {
    const properties = await PropertyAPI.getAllProperties();
    expect(Array.isArray(properties)).toBe(true);
  });

  it('should create a new property', async () => {
    const mockProperty = createMockProperty();
    const { id, created_at, updated_at, ...propertyData } = mockProperty;
    
    const result = await PropertyAPI.createProperty(propertyData);
    expect(result).toBeDefined();
    expect(result.title).toBe(propertyData.title);
  });

  it('should handle investment in property', async () => {
    const propertyId = 'test-property-id';
    const tokenAmount = 10;
    const totalCost = 1000;
    
    await expect(PropertyAPI.investInProperty(
      propertyId,
      tokenAmount,
      totalCost
    )).resolves.not.toThrow();
  });
});

describe('StakingAPI', () => {
  it('should fetch all staking pools', async () => {
    const pools = await StakingAPI.getAllPools();
    expect(Array.isArray(pools)).toBe(true);
  });

  it('should handle token staking', async () => {
    const poolId = 'test-pool-id';
    const amount = 1000;
    
    await expect(StakingAPI.stakeTokens(
      poolId,
      amount
    )).resolves.not.toThrow();
  });
});
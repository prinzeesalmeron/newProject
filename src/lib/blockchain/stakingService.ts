import { ethers } from 'ethers';
import { getContractAddresses } from '../contractConfig';
import StakingABI from '../abis/Staking.json';

export interface StakingPool {
  id: number;
  name: string;
  lockPeriod: number;
  apy: number;
  totalStaked: string;
  maxCapacity: string;
  active: boolean;
}

export interface UserStake {
  poolId: number;
  amount: string;
  startTime: number;
  lastClaimTime: number;
  active: boolean;
  stakeId: number;
  rewards?: string;
}

/**
 * Staking Service - Interacts with the Staking smart contract
 */
export class StakingService {
  private provider: ethers.providers.Web3Provider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the service with a Web3 provider
   */
  async initialize(provider: ethers.providers.Web3Provider) {
    this.provider = provider;
    this.signer = provider.getSigner();

    const addresses = getContractAddresses();
    if (!addresses.STAKING || addresses.STAKING === '0x0000000000000000000000000000000000000000') {
      throw new Error('Staking contract address not configured');
    }

    this.contract = new ethers.Contract(
      addresses.STAKING,
      StakingABI,
      this.signer
    );
  }

  /**
   * Get all staking pools
   */
  async getAllPools(): Promise<StakingPool[]> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const pools = await this.contract.getAllPools();

      return pools.map((pool: any) => ({
        id: pool.id.toNumber(),
        name: pool.name,
        lockPeriod: pool.lockPeriod.toNumber() / (24 * 60 * 60), // Convert seconds to days
        apy: pool.apy.toNumber() / 100, // Convert basis points to percentage
        totalStaked: ethers.utils.formatEther(pool.totalStaked),
        maxCapacity: ethers.utils.formatEther(pool.maxCapacity),
        active: pool.active
      }));
    } catch (error: any) {
      console.error('Error fetching pools:', error);

      // Return mock data if contract not deployed
      if (error.code === 'CALL_EXCEPTION') {
        console.warn('Staking contract not deployed, using mock data');
        return this.getMockPools();
      }

      throw error;
    }
  }

  /**
   * Get mock pools for development/testing
   */
  private getMockPools(): StakingPool[] {
    return [
      {
        id: 1,
        name: 'Flexible',
        lockPeriod: 0,
        apy: 5,
        totalStaked: '125.5',
        maxCapacity: '1000',
        active: true
      },
      {
        id: 2,
        name: '30 Days',
        lockPeriod: 30,
        apy: 8,
        totalStaked: '89.2',
        maxCapacity: '500',
        active: true
      },
      {
        id: 3,
        name: '90 Days',
        lockPeriod: 90,
        apy: 12,
        totalStaked: '45.8',
        maxCapacity: '300',
        active: true
      },
      {
        id: 4,
        name: '180 Days',
        lockPeriod: 180,
        apy: 15,
        totalStaked: '23.4',
        maxCapacity: '200',
        active: true
      }
    ];
  }

  /**
   * Get user's stakes
   */
  async getUserStakes(address: string): Promise<UserStake[]> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const stakes = await this.contract.getUserStakes(address);

      const stakesWithRewards = await Promise.all(
        stakes.map(async (stake: any, index: number) => {
          let rewards = '0';
          try {
            const rewardsWei = await this.contract!.calculateRewards(address, index);
            rewards = ethers.utils.formatEther(rewardsWei);
          } catch (error) {
            console.warn(`Could not calculate rewards for stake ${index}:`, error);
          }

          return {
            poolId: stake.poolId.toNumber(),
            amount: ethers.utils.formatEther(stake.amount),
            startTime: stake.startTime.toNumber() * 1000, // Convert to milliseconds
            lastClaimTime: stake.lastClaimTime.toNumber() * 1000,
            active: stake.active,
            stakeId: index,
            rewards
          };
        })
      );

      return stakesWithRewards.filter(stake => stake.active);
    } catch (error) {
      console.error('Error fetching user stakes:', error);
      throw error;
    }
  }

  /**
   * Stake ETH in a pool
   */
  async stake(poolId: number, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const amountWei = ethers.utils.parseEther(amount);
      const tx = await this.contract.stake(poolId, { value: amountWei });
      return tx;
    } catch (error) {
      console.error('Error staking:', error);
      throw error;
    }
  }

  /**
   * Unstake from a position
   */
  async unstake(stakeId: number): Promise<ethers.ContractTransaction> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const tx = await this.contract.unstake(stakeId);
      return tx;
    } catch (error) {
      console.error('Error unstaking:', error);
      throw error;
    }
  }

  /**
   * Claim rewards from a stake
   */
  async claimRewards(stakeId: number): Promise<ethers.ContractTransaction> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const tx = await this.contract.claimRewards(stakeId);
      return tx;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    }
  }

  /**
   * Calculate pending rewards for a stake
   */
  async calculateRewards(address: string, stakeId: number): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const rewardsWei = await this.contract.calculateRewards(address, stakeId);
      return ethers.utils.formatEther(rewardsWei);
    } catch (error) {
      console.error('Error calculating rewards:', error);
      throw error;
    }
  }

  /**
   * Get pool count
   */
  async getPoolCount(): Promise<number> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const count = await this.contract.poolCount();
      return count.toNumber();
    } catch (error) {
      console.error('Error getting pool count:', error);
      throw error;
    }
  }

  /**
   * Get minimum stake amount
   */
  async getMinStakeAmount(): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const minAmount = await this.contract.minStakeAmount();
      return ethers.utils.formatEther(minAmount);
    } catch (error) {
      console.error('Error getting min stake amount:', error);
      throw error;
    }
  }

  /**
   * Check if contract is paused
   */
  async isPaused(): Promise<boolean> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      return await this.contract.paused();
    } catch (error) {
      console.error('Error checking pause status:', error);
      return false;
    }
  }

  /**
   * Get contract balance
   */
  async getContractBalance(): Promise<string> {
    if (!this.provider || !this.contract) throw new Error('Service not initialized');

    try {
      const balance = await this.provider.getBalance(this.contract.address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting contract balance:', error);
      throw error;
    }
  }

  /**
   * Get rewards pool balance
   */
  async getRewardsPoolBalance(): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');

    try {
      const balance = await this.contract.rewardsPool();
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting rewards pool balance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stakingService = new StakingService();

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Staking
 * @dev Staking contract for BLOCK tokens with multiple pools and rewards
 */
contract Staking is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    struct Pool {
        uint256 apy; // Annual percentage yield (in basis points, e.g., 1000 = 10%)
        uint256 lockPeriod; // Lock period in seconds
        uint256 minStake; // Minimum stake amount
        uint256 maxStake; // Maximum stake amount (0 = no limit)
        uint256 totalStakedInPool; // Total amount staked in this pool
        bool isActive; // Whether the pool is active
    }
    
    struct UserStake {
        uint256 amount; // Amount staked
        uint256 stakeTime; // When the stake was made
        uint256 lastRewardTime; // Last time rewards were calculated
        uint256 accumulatedRewards; // Accumulated rewards
    }
    
    IERC20 public immutable blockToken;
    
    mapping(uint256 => Pool) public pools;
    mapping(address => mapping(uint256 => UserStake)) public userStakes;
    mapping(address => uint256) public totalUserStaked;
    
    uint256 public nextPoolId = 0;
    uint256 public totalStakedOverall = 0; // renamed to avoid shadowing
    uint256 public rewardRate = 10000; // 100% APY in basis points
    
    event PoolCreated(uint256 indexed poolId, uint256 apy, uint256 lockPeriod);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event PoolUpdated(uint256 indexed poolId);
    
    constructor(address _blockToken) Ownable(msg.sender) {
        blockToken = IERC20(_blockToken);
        
        // Create default pools
        _createPool(500, 0, 100 * 10**18, 0);       // 5% APY, no lock, min 100 tokens
        _createPool(1000, 30 days, 1000 * 10**18, 0); // 10% APY, 30 day lock, min 1000 tokens
        _createPool(1500, 90 days, 5000 * 10**18, 0); // 15% APY, 90 day lock, min 5000 tokens
    }
    
    // Create a new staking pool
    function createPool(
        uint256 apy,
        uint256 lockPeriod,
        uint256 minStake,
        uint256 maxStake
    ) external onlyOwner returns (uint256) {
        return _createPool(apy, lockPeriod, minStake, maxStake);
    }
    
    function _createPool(
        uint256 apy,
        uint256 lockPeriod,
        uint256 minStake,
        uint256 maxStake
    ) internal returns (uint256) {
        uint256 poolId = nextPoolId++;
        
        pools[poolId] = Pool({
            apy: apy,
            lockPeriod: lockPeriod,
            minStake: minStake,
            maxStake: maxStake,
            totalStakedInPool: 0,
            isActive: true
        });
        
        emit PoolCreated(poolId, apy, lockPeriod);
        return poolId;
    }
    
    // Stake tokens in a specific pool
    function stake(uint256 poolId, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(amount >= pool.minStake, "Below minimum stake");
        if (pool.maxStake > 0) {
            require(
                userStakes[msg.sender][poolId].amount + amount <= pool.maxStake,
                "Exceeds max stake"
            );
        }
        
        _updateRewards(msg.sender, poolId);
        
        blockToken.safeTransferFrom(msg.sender, address(this), amount);
        
        UserStake storage stakeData = userStakes[msg.sender][poolId];
        stakeData.amount += amount;
        stakeData.stakeTime = block.timestamp;
        stakeData.lastRewardTime = block.timestamp;
        
        pool.totalStakedInPool += amount;
        totalStakedOverall += amount;
        totalUserStaked[msg.sender] += amount;
        
        emit Staked(msg.sender, poolId, amount);
    }
    
    // Unstake tokens from a specific pool
    function unstake(uint256 poolId, uint256 amount) external nonReentrant {
        UserStake storage stakeData = userStakes[msg.sender][poolId];
        Pool storage pool = pools[poolId];
        
        require(stakeData.amount >= amount, "Insufficient stake");
        require(block.timestamp >= stakeData.stakeTime + pool.lockPeriod, "Still locked");
        
        _updateRewards(msg.sender, poolId);
        
        stakeData.amount -= amount;
        pool.totalStakedInPool -= amount;
        totalStakedOverall -= amount;
        totalUserStaked[msg.sender] -= amount;
        
        blockToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, poolId, amount);
    }
    
    // Claim accumulated rewards
    function claimRewards(uint256 poolId) external nonReentrant {
        _updateRewards(msg.sender, poolId);
        
        UserStake storage stakeData = userStakes[msg.sender][poolId];
        uint256 rewards = stakeData.accumulatedRewards;
        require(rewards > 0, "No rewards");
        
        stakeData.accumulatedRewards = 0;
        blockToken.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, poolId, rewards);
    }
    
    // Internal reward calculation
    function _updateRewards(address user, uint256 poolId) internal {
        UserStake storage stakeData = userStakes[user][poolId];
        Pool storage pool = pools[poolId];
        
        if (stakeData.amount > 0 && stakeData.lastRewardTime < block.timestamp) {
            uint256 timeElapsed = block.timestamp - stakeData.lastRewardTime;
            uint256 rewards = (stakeData.amount * pool.apy * timeElapsed) / (365 days * 10000);
            stakeData.accumulatedRewards += rewards;
            stakeData.lastRewardTime = block.timestamp;
        }
    }
    
    // View pending rewards
    function getPendingRewards(address user, uint256 poolId) external view returns (uint256) {
        UserStake memory stakeData = userStakes[user][poolId];
        Pool memory pool = pools[poolId];
        
        if (stakeData.amount == 0) {
            return stakeData.accumulatedRewards;
        }
        
        uint256 timeElapsed = block.timestamp - stakeData.lastRewardTime;
        uint256 pendingRewards = (stakeData.amount * pool.apy * timeElapsed) / (365 days * 10000);
        return stakeData.accumulatedRewards + pendingRewards;
    }
    
    // Get user's staked amount
    function getStakedAmount(address user, uint256 poolId) external view returns (uint256) {
        return userStakes[user][poolId].amount;
    }
    
    // Get pool info
    function getPoolInfo(uint256 poolId) external view returns (
        uint256 apy,
        uint256 lockPeriod,
        uint256 minStake,
        uint256 maxStake,
        uint256 poolTotalStaked,
        bool isActive
    ) {
        Pool memory pool = pools[poolId];
        return (
            pool.apy,
            pool.lockPeriod,
            pool.minStake,
            pool.maxStake,
            pool.totalStakedInPool,
            pool.isActive
        );
    }
    
    // Update pool parameters
    function updatePool(
        uint256 poolId,
        uint256 apy,
        uint256 lockPeriod,
        uint256 minStake,
        uint256 maxStake,
        bool isActive
    ) external onlyOwner {
        Pool storage pool = pools[poolId];
        pool.apy = apy;
        pool.lockPeriod = lockPeriod;
        pool.minStake = minStake;
        pool.maxStake = maxStake;
        pool.isActive = isActive;
        
        emit PoolUpdated(poolId);
    }
    
    // Emergency withdraw ERC20
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    // Pause / unpause
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}

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
        uint256 totalStaked; // Total amount staked in this pool
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
    uint256 public totalStaked = 0;
    uint256 public rewardRate = 10000; // 100% APY in basis points
    
    event PoolCreated(uint256 indexed poolId, uint256 apy, uint256 lockPeriod);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event PoolUpdated(uint256 indexed poolId);
    
    constructor(address _blockToken) Ownable(msg.sender) {
        blockToken = IERC20(_blockToken);
        
        // Create default pools
        _createPool(500, 0, 100 * 10**18, 0); // 5% APY, no lock, min 100 tokens
        _createPool(1000, 30 days, 1000 * 10**18, 0); // 10% APY, 30 day lock, min 1000 tokens
        _createPool(1500, 90 days, 5000 * 10**18, 0); // 15% APY, 90 day lock, min 5000 tokens
    }
    
    /**
     * @dev Create a new staking pool
     */
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
            totalStaked: 0,
            isActive: true
        });
        
        emit PoolCreated(poolId, apy, lockPeriod);
        return poolId;
    }
    
    /**
     * @dev Stake tokens in a specific pool
     */
    function stake(uint256 poolId, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(pools[poolId].isActive, "Pool is not active");
        require(amount >= pools[poolId].minStake, "Amount below minimum stake");
        
        if (pools[poolId].maxStake > 0) {
            require(
                userStakes[msg.sender][poolId].amount + amount <= pools[poolId].maxStake,
                "Amount exceeds maximum stake"
            );
        }
        
        // Update rewards before staking
        _updateRewards(msg.sender, poolId);
        
        // Transfer tokens from user
        blockToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user stake
        userStakes[msg.sender][poolId].amount += amount;
        userStakes[msg.sender][poolId].stakeTime = block.timestamp;
        userStakes[msg.sender][poolId].lastRewardTime = block.timestamp;
        
        // Update pool and global totals
        pools[poolId].totalStaked += amount;
        totalStaked += amount;
        totalUserStaked[msg.sender] += amount;
        
        emit Staked(msg.sender, poolId, amount);
    }
    
    /**
     * @dev Unstake tokens from a specific pool
     */
    function unstake(uint256 poolId, uint256 amount) external nonReentrant {
        UserStake storage userStake = userStakes[msg.sender][poolId];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.stakeTime + pools[poolId].lockPeriod,
            "Tokens are still locked"
        );
        
        // Update rewards before unstaking
        _updateRewards(msg.sender, poolId);
        
        // Update user stake
        userStake.amount -= amount;
        
        // Update pool and global totals
        pools[poolId].totalStaked -= amount;
        totalStaked -= amount;
        totalUserStaked[msg.sender] -= amount;
        
        // Transfer tokens back to user
        blockToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, poolId, amount);
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards(uint256 poolId) external nonReentrant {
        _updateRewards(msg.sender, poolId);
        
        uint256 rewards = userStakes[msg.sender][poolId].accumulatedRewards;
        require(rewards > 0, "No rewards to claim");
        
        userStakes[msg.sender][poolId].accumulatedRewards = 0;
        
        // Transfer rewards to user
        blockToken.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, poolId, rewards);
    }
    
    /**
     * @dev Update rewards for a user in a specific pool
     */
    function _updateRewards(address user, uint256 poolId) internal {
        UserStake storage userStake = userStakes[user][poolId];
        
        if (userStake.amount > 0 && userStake.lastRewardTime < block.timestamp) {
            uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
            uint256 rewards = (userStake.amount * pools[poolId].apy * timeElapsed) / (365 days * 10000);
            
            userStake.accumulatedRewards += rewards;
            userStake.lastRewardTime = block.timestamp;
        }
    }
    
    /**
     * @dev Get pending rewards for a user in a specific pool
     */
    function getPendingRewards(address user, uint256 poolId) external view returns (uint256) {
        UserStake memory userStake = userStakes[user][poolId];
        
        if (userStake.amount == 0) {
            return userStake.accumulatedRewards;
        }
        
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        uint256 pendingRewards = (userStake.amount * pools[poolId].apy * timeElapsed) / (365 days * 10000);
        
        return userStake.accumulatedRewards + pendingRewards;
    }
    
    /**
     * @dev Get user's staked amount in a specific pool
     */
    function getStakedAmount(address user, uint256 poolId) external view returns (uint256) {
        return userStakes[user][poolId].amount;
    }
    
    /**
     * @dev Get pool information
     */
    function getPoolInfo(uint256 poolId) external view returns (
        uint256 apy,
        uint256 lockPeriod,
        uint256 minStake,
        uint256 maxStake,
        uint256 totalStaked,
        bool isActive
    ) {
        Pool memory pool = pools[poolId];
        return (
            pool.apy,
            pool.lockPeriod,
            pool.minStake,
            pool.maxStake,
            pool.totalStaked,
            pool.isActive
        );
    }
    
    /**
     * @dev Update pool parameters
     */
    function updatePool(
        uint256 poolId,
        uint256 apy,
        uint256 lockPeriod,
        uint256 minStake,
        uint256 maxStake,
        bool isActive
    ) external onlyOwner {
        pools[poolId].apy = apy;
        pools[poolId].lockPeriod = lockPeriod;
        pools[poolId].minStake = minStake;
        pools[poolId].maxStake = maxStake;
        pools[poolId].isActive = isActive;
        
        emit PoolUpdated(poolId);
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    /**
     * @dev Pause staking
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause staking
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
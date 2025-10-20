// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // Updated import path
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Staking is ReentrancyGuard, Ownable, Pausable {
    struct Pool {
        uint256 id;
        string name;
        uint256 lockPeriod; // Lock period in seconds
        uint256 apy; // APY in basis points (e.g., 1000 = 10%)
        uint256 totalStaked;
        uint256 maxCapacity; // Maximum ETH that can be staked in this pool
        bool active;
    }

    struct Stake {
        uint256 poolId;
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        bool active;
    }

    // Pool ID => Pool details
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;

    // User address => Stake ID => Stake details
    mapping(address => mapping(uint256 => Stake)) public stakes;
    mapping(address => uint256) public userStakeCount;

    // Total ETH staked across all pools
    uint256 public totalStaked;

    // Rewards pool for paying out rewards
    uint256 public rewardsPool;

    // Minimum stake amount
    uint256 public minStakeAmount = 0.01 ether;

    // Events
    event PoolCreated(uint256 indexed poolId, string name, uint256 lockPeriod, uint256 apy);
    event PoolUpdated(uint256 indexed poolId, uint256 apy, uint256 maxCapacity, bool active);
    event Staked(address indexed user, uint256 indexed poolId, uint256 stakeId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 stakeId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 stakeId, uint256 amount);
    event RewardsDeposited(uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {
        // Create default pools
        _createPool("Flexible", 0, 500, 1000 ether); // 5% APY, no lock
        _createPool("30 Days", 30 days, 800, 500 ether); // 8% APY
        _createPool("90 Days", 90 days, 1200, 300 ether); // 12% APY
        _createPool("180 Days", 180 days, 1500, 200 ether); // 15% APY
    }

    // Rest of the contract remains unchanged
    function createPool(
        string memory name,
        uint256 lockPeriod,
        uint256 apy,
        uint256 maxCapacity
    ) external onlyOwner {
        _createPool(name, lockPeriod, apy, maxCapacity);
    }

    function _createPool(
        string memory name,
        uint256 lockPeriod,
        uint256 apy,
        uint256 maxCapacity
    ) internal {
        poolCount++;
        pools[poolCount] = Pool({
            id: poolCount,
            name: name,
            lockPeriod: lockPeriod,
            apy: apy,
            totalStaked: 0,
            maxCapacity: maxCapacity,
            active: true
        });

        emit PoolCreated(poolCount, name, lockPeriod, apy);
    }

    function updatePool(
        uint256 poolId,
        uint256 apy,
        uint256 maxCapacity,
        bool active
    ) external onlyOwner {
        require(poolId > 0 && poolId <= poolCount, "Invalid pool");

        Pool storage pool = pools[poolId];
        pool.apy = apy;
        pool.maxCapacity = maxCapacity;
        pool.active = active;

        emit PoolUpdated(poolId, apy, maxCapacity, active);
    }

    function stake(uint256 poolId) external payable nonReentrant whenNotPaused {
        require(poolId > 0 && poolId <= poolCount, "Invalid pool");
        require(msg.value >= minStakeAmount, "Amount below minimum");

        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        require(pool.totalStaked + msg.value <= pool.maxCapacity, "Pool capacity exceeded");

        uint256 stakeId = userStakeCount[msg.sender];
        stakes[msg.sender][stakeId] = Stake({
            poolId: poolId,
            amount: msg.value,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            active: true
        });

        userStakeCount[msg.sender]++;
        pool.totalStaked += msg.value;
        totalStaked += msg.value;

        emit Staked(msg.sender, poolId, stakeId, msg.value);
    }

    function unstake(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakeCount[msg.sender], "Invalid stake ID");

        Stake storage userStake = stakes[msg.sender][stakeId];
        require(userStake.active, "Stake already withdrawn");

        Pool storage pool = pools[userStake.poolId];
        require(
            block.timestamp >= userStake.startTime + pool.lockPeriod,
            "Lock period not ended"
        );

        _claimRewards(msg.sender, stakeId);

        uint256 amount = userStake.amount;
        userStake.active = false;

        pool.totalStaked -= amount;
        totalStaked -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Unstaked(msg.sender, userStake.poolId, stakeId, amount);
    }

    function claimRewards(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakeCount[msg.sender], "Invalid stake ID");
        _claimRewards(msg.sender, stakeId);
    }

    function _claimRewards(address user, uint256 stakeId) internal {
        Stake storage userStake = stakes[user][stakeId];
        require(userStake.active, "Stake not active");

        uint256 rewards = calculateRewards(user, stakeId);
        require(rewards > 0, "No rewards to claim");
        require(rewardsPool >= rewards, "Insufficient rewards pool");

        userStake.lastClaimTime = block.timestamp;
        rewardsPool -= rewards;

        (bool success, ) = user.call{value: rewards}("");
        require(success, "Transfer failed");

        emit RewardsClaimed(user, userStake.poolId, stakeId, rewards);
    }

    function calculateRewards(address user, uint256 stakeId) public view returns (uint256) {
        require(stakeId < userStakeCount[user], "Invalid stake ID");

        Stake memory userStake = stakes[user][stakeId];
        if (!userStake.active) return 0;

        Pool memory pool = pools[userStake.poolId];

        uint256 timeStaked = block.timestamp - userStake.lastClaimTime;
        uint256 rewards = (userStake.amount * pool.apy * timeStaked) / (10000 * 365 days);

        return rewards;
    }

    function getUserStakes(address user) external view returns (Stake[] memory) {
        uint256 count = userStakeCount[user];
        Stake[] memory userStakes = new Stake[](count);

        for (uint256 i = 0; i < count; i++) {
            userStakes[i] = stakes[user][i];
        }

        return userStakes;
    }

    function getAllPools() external view returns (Pool[] memory) {
        Pool[] memory allPools = new Pool[](poolCount);

        for (uint256 i = 1; i <= poolCount; i++) {
            allPools[i - 1] = pools[i];
        }

        return allPools;
    }

    function getPool(uint256 poolId) external view returns (Pool memory) {
        require(poolId > 0 && poolId <= poolCount, "Invalid pool");
        return pools[poolId];
    }

    function depositRewards() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        rewardsPool += msg.value;
        emit RewardsDeposited(msg.value);
    }

    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
        emit EmergencyWithdraw(owner(), balance);
    }

    function setMinStakeAmount(uint256 amount) external onlyOwner {
        minStakeAmount = amount;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        rewardsPool += msg.value;
        emit RewardsDeposited(msg.value);
    }
}
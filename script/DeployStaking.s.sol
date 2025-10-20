// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/Staking.sol";

/**
 * @title DeployStaking
 * @dev Deployment script for Staking contract
 *
 * To deploy:
 * forge script script/DeployStaking.s.sol:DeployStaking --rpc-url <RPC_URL> --broadcast --verify
 *
 * For testnet (Sepolia):
 * forge script script/DeployStaking.s.sol:DeployStaking --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
 */
contract DeployStaking is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey); // Define deployer address

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Staking contract
        Staking staking = new Staking(deployer);

        console.log("Staking deployed to:", address(staking));
        console.log("Default pools created:");
        console.log("  1. Flexible (0 days lock, 5% APY)");
        console.log("  2. 30 Days (30 days lock, 8% APY)");
        console.log("  3. 90 Days (90 days lock, 12% APY)");
        console.log("  4. 180 Days (180 days lock, 15% APY)");

        // Fund rewards pool with initial ETH (optional)
        uint256 initialRewards = 1 ether;
        if (address(this).balance >= initialRewards) {
            (bool success, ) = address(staking).call{value: initialRewards}("");
            require(success, "Failed to fund rewards pool");
            console.log("Rewards pool funded with:", initialRewards);
        }

        vm.stopBroadcast();

        // Output deployment information
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("Staking Contract:", address(staking));
        console.log("Owner:", staking.owner());
        console.log("Total Pools:", staking.poolCount());
        console.log("Rewards Pool:", staking.rewardsPool());
        console.log("Min Stake Amount:", staking.minStakeAmount());
        console.log("\nAdd this address to your frontend config!");
    }
}
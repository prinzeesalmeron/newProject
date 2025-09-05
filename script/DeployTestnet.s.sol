// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/BlockToken.sol";
import "../contracts/PropertyToken.sol";
import "../contracts/Staking.sol";
import "../contracts/Governance.sol";
import "../contracts/Marketplace.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract DeployTestnetScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying to Sepolia Testnet...");
        console.log("Deployer address:", deployer);
        
        // Deploy BLOCK token
        BlockToken blockToken = new BlockToken();
        console.log("BlockToken deployed at:", address(blockToken));
        
        // Deploy PropertyToken
        PropertyToken propertyToken = new PropertyToken("https://api.blockestate.com/metadata/");
        console.log("PropertyToken deployed at:", address(propertyToken));
        
        // Deploy Staking contract
        Staking staking = new Staking(address(blockToken));
        console.log("Staking deployed at:", address(staking));
        
        // Deploy Marketplace
        Marketplace marketplace = new Marketplace(
            address(propertyToken),
            address(blockToken),
            deployer // Fee recipient
        );
        console.log("Marketplace deployed at:", address(marketplace));
        
        // Add marketplace as authorized minter for property tokens
        propertyToken.addAuthorizedMinter(address(marketplace));
        
        // Add staking contract as minter for rewards
        blockToken.addMinter(address(staking));
        
        // Deploy Timelock (1 hour delay for testnet)
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = deployer;
        
        TimelockController timelock = new TimelockController(
            1 hours, // 1 hour delay for testnet
            proposers,
            executors,
            deployer // admin
        );
        console.log("TimelockController deployed at:", address(timelock));
        
        // Deploy Governor
        BlockEstateGovernor governor = new BlockEstateGovernor(
            IVotes(address(blockToken)),
            timelock,
            4, // 4% quorum
            7200, // ~1 day voting period on testnet (assuming 12s blocks)
            1 // 1 block voting delay
        );
        console.log("BlockEstateGovernor deployed at:", address(governor));
        
        // Grant roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // Anyone can execute
        
        // Mint initial tokens for testing
        blockToken.mint(deployer, 1000000 * 10**18); // 1M tokens for testing
        
        // Create test staking pools
        staking.createPool(500, 0, 100 * 10**18, 0); // 5% APY, no lock
        staking.createPool(1000, 30 days, 1000 * 10**18, 0); // 10% APY, 30 day lock
        staking.createPool(1500, 90 days, 5000 * 10**18, 0); // 15% APY, 90 day lock
        
        // Create test property
        propertyToken.tokenizeProperty(
            "Test Property #1",
            "New York, NY",
            1000, // 1000 tokens
            100 * 10**18, // 100 BLOCK per token
            "https://api.blockestate.com/metadata/1"
        );
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Sepolia Testnet Deployment Summary ===");
        console.log("Network: Sepolia Testnet (Chain ID: 11155111)");
        console.log("BlockToken:", address(blockToken));
        console.log("PropertyToken:", address(propertyToken));
        console.log("Staking:", address(staking));
        console.log("Marketplace:", address(marketplace));
        console.log("TimelockController:", address(timelock));
        console.log("BlockEstateGovernor:", address(governor));
        console.log("Deployer:", deployer);
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract", address(blockToken), "contracts/BlockToken.sol:BlockToken --chain sepolia");
        console.log("forge verify-contract", address(propertyToken), "contracts/PropertyToken.sol:PropertyToken --chain sepolia");
        console.log("forge verify-contract", address(staking), "contracts/Staking.sol:Staking --chain sepolia");
        console.log("forge verify-contract", address(marketplace), "contracts/Marketplace.sol:Marketplace --chain sepolia");
    }
}
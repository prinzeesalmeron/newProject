// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/PropertyToken.sol";
import "../contracts/Marketplace.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract DeployTestnetScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying to Sepolia Testnet...");
        console.log("Deployer address:", deployer);

        // Deploy PropertyToken
        PropertyToken propertyToken = new PropertyToken("https://api.blockestate.com/metadata/");
        console.log("PropertyToken deployed at:", address(propertyToken));

        // Deploy Marketplace (250 = 2.5% fee)
        Marketplace marketplace = new Marketplace(
            address(0), // No payment token for now
            250
        );
        console.log("Marketplace deployed at:", address(marketplace));
        
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
        
        
        // Grant roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), deployer);
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // Anyone can execute

        // Create test property
        propertyToken.tokenizeProperty(
            "Test Property #1",
            "New York, NY",
            1000, // 1000 tokens
            1 ether, // 1 ETH per token
            "https://api.blockestate.com/metadata/1"
        );
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Sepolia Testnet Deployment Summary ===");
        console.log("Network: Sepolia Testnet (Chain ID: 11155111)");
        console.log("PropertyToken:", address(propertyToken));
        console.log("Marketplace:", address(marketplace));
        console.log("TimelockController:", address(timelock));
        console.log("Deployer:", deployer);
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract", address(propertyToken), "contracts/PropertyToken.sol:PropertyToken --chain sepolia --constructor-args", abi.encode("https://api.blockestate.com/metadata/"));
        console.log("forge verify-contract", address(marketplace), "contracts/Marketplace.sol:Marketplace --chain sepolia --constructor-args", abi.encode(address(0), 250));
    }
}
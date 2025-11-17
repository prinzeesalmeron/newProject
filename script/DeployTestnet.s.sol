// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol"; // Ensure console is imported
import "../contracts/PropertyToken.sol";
import "../contracts/Marketplace.sol";
import "../contracts/Staking.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract DeployScript is Script {
    function run() external {
        // Load deployer's private key and address
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying contracts to Sepolia Testnet...");
        console.log("Deployer address:", deployer);

        // 1. Deploy PropertyToken
        PropertyToken propertyToken = new PropertyToken("https://api.blockestate.com/metadata/");
        console.log("PropertyToken deployed at:", address(propertyToken));

        // 2. Deploy Marketplace (2.5% fee)
        Marketplace marketplace = new Marketplace(
            address(0), // No payment token yet
            250
        );
        console.log("Marketplace deployed at:", address(marketplace));

        // 3. Deploy Staking
        Staking staking = new Staking(deployer); // Use deployer instead of msg.sender for clarity
        console.log("Staking deployed at:", address(staking));

        // 4. Deploy TimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = deployer;

        TimelockController timelock = new TimelockController(
            1 hours, // Minimum delay
            proposers,
            executors,
            deployer // Admin
        );
        console.log("TimelockController deployed at:", address(timelock));

        // 5. Configure roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), deployer);
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // Anyone can execute

        // 6. Create a test property
        propertyToken.tokenizeProperty(
            "Test Property #1",
            "New York, NY",
            1000,
            1 ether,
            "https://api.blockestate.com/metadata/1"
        );

        // Stop broadcasting
        vm.stopBroadcast();

        // Summary
        console.log("Deployment Summary:");
        console.log("PropertyToken deployed at:", address(propertyToken));
        console.log("Marketplace deployed at:", address(marketplace));
        console.log("Staking deployed at:", address(staking));
        console.log("TimelockController deployed at:", address(timelock));
    }
}
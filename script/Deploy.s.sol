// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/PropertyToken.sol";
import "../contracts/Marketplace.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PropertyToken
        PropertyToken propertyToken = new PropertyToken("https://api.blockestate.com/metadata/");
        console.log("PropertyToken deployed at:", address(propertyToken));

        // Deploy Marketplace (250 = 2.5% fee)
        Marketplace marketplace = new Marketplace(
            address(0), // No payment token for now
            250
        );
        console.log("Marketplace deployed at:", address(marketplace));

        // Deploy Timelock (1 day delay)
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = deployer;

        TimelockController timelock = new TimelockController(
            1 days, // 1 day delay
            proposers,
            executors,
            deployer // admin
        );
        console.log("TimelockController deployed at:", address(timelock));

        // Grant roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), deployer);
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // Anyone can execute
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("PropertyToken:", address(propertyToken));
        console.log("Marketplace:", address(marketplace));
        console.log("TimelockController:", address(timelock));
        console.log("Deployer:", deployer);
    }
}
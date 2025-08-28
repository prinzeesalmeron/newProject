// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/BlockToken.sol";
import "../contracts/PropertyToken.sol";
import "../contracts/Staking.sol";
import "../contracts/Governance.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy BLOCK token
        BlockToken blockToken = new BlockToken();
        console.log("BlockToken deployed at:", address(blockToken));
        
        // Deploy PropertyToken
        PropertyToken propertyToken = new PropertyToken("https://api.blockestate.com/metadata/");
        console.log("PropertyToken deployed at:", address(propertyToken));
        
        // Deploy Staking contract
        Staking staking = new Staking(address(blockToken));
        console.log("Staking deployed at:", address(staking));
        
        // Add staking contract as minter for rewards
        blockToken.addMinter(address(staking));
        
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
        
        // Deploy Governor
        BlockEstateGovernor governor = new BlockEstateGovernor(
            IVotes(address(blockToken)),
            timelock,
            4, // 4% quorum
            50400, // ~1 week voting period (assuming 12s blocks)
            1 // 1 block voting delay
        );
        console.log("BlockEstateGovernor deployed at:", address(governor));
        
        // Grant roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // Anyone can execute
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("BlockToken:", address(blockToken));
        console.log("PropertyToken:", address(propertyToken));
        console.log("Staking:", address(staking));
        console.log("TimelockController:", address(timelock));
        console.log("BlockEstateGovernor:", address(governor));
        console.log("Deployer:", deployer);
    }
}
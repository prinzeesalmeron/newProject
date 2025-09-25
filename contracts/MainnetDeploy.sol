// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/BlockToken.sol";
import "../contracts/PropertyToken.sol";
import "../contracts/Staking.sol";
import "../contracts/Governance.sol";
import "../contracts/Marketplace.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract MainnetDeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying to Ethereum Mainnet...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Deploy ProxyAdmin for upgradeable contracts
        ProxyAdmin proxyAdmin = new ProxyAdmin();
        console.log("ProxyAdmin deployed at:", address(proxyAdmin));
        
        // Deploy implementation contracts
        BlockToken blockTokenImpl = new BlockToken();
        PropertyToken propertyTokenImpl = new PropertyToken("https://api.blockestate.com/metadata/");
        Staking stakingImpl = new Staking(address(blockTokenImpl));
        Marketplace marketplaceImpl = new Marketplace(
            address(propertyTokenImpl),
            address(blockTokenImpl),
            deployer
        );
        
        console.log("Implementation contracts deployed:");
        console.log("BlockToken implementation:", address(blockTokenImpl));
        console.log("PropertyToken implementation:", address(propertyTokenImpl));
        console.log("Staking implementation:", address(stakingImpl));
        console.log("Marketplace implementation:", address(marketplaceImpl));
        
        // Deploy proxies
        bytes memory blockTokenInitData = abi.encodeWithSignature("initialize()");
        TransparentUpgradeableProxy blockTokenProxy = new TransparentUpgradeableProxy(
            address(blockTokenImpl),
            address(proxyAdmin),
            blockTokenInitData
        );
        
        bytes memory propertyTokenInitData = abi.encodeWithSignature(
            "initialize(string)", 
            "https://api.blockestate.com/metadata/"
        );
        TransparentUpgradeableProxy propertyTokenProxy = new TransparentUpgradeableProxy(
            address(propertyTokenImpl),
            address(proxyAdmin),
            propertyTokenInitData
        );
        
        bytes memory stakingInitData = abi.encodeWithSignature(
            "initialize(address)", 
            address(blockTokenProxy)
        );
        TransparentUpgradeableProxy stakingProxy = new TransparentUpgradeableProxy(
            address(stakingImpl),
            address(proxyAdmin),
            stakingInitData
        );
        
        bytes memory marketplaceInitData = abi.encodeWithSignature(
            "initialize(address,address,address)",
            address(propertyTokenProxy),
            address(blockTokenProxy),
            deployer
        );
        TransparentUpgradeableProxy marketplaceProxy = new TransparentUpgradeableProxy(
            address(marketplaceImpl),
            address(proxyAdmin),
            marketplaceInitData
        );
        
        console.log("Proxy contracts deployed:");
        console.log("BlockToken proxy:", address(blockTokenProxy));
        console.log("PropertyToken proxy:", address(propertyTokenProxy));
        console.log("Staking proxy:", address(stakingProxy));
        console.log("Marketplace proxy:", address(marketplaceProxy));
        
        // Deploy Timelock (2 days delay for mainnet)
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = deployer;
        
        TimelockController timelock = new TimelockController(
            2 days, // 2 day delay for mainnet
            proposers,
            executors,
            deployer
        );
        console.log("TimelockController deployed at:", address(timelock));
        
        // Deploy Governor
        BlockEstateGovernor governor = new BlockEstateGovernor(
            IVotes(address(blockTokenProxy)),
            timelock,
            4, // 4% quorum
            50400, // ~1 week voting period
            1 // 1 block voting delay
        );
        console.log("BlockEstateGovernor deployed at:", address(governor));
        
        // Setup permissions
        BlockToken(address(blockTokenProxy)).addMinter(address(stakingProxy));
        PropertyToken(address(propertyTokenProxy)).addAuthorizedMinter(address(marketplaceProxy));
        
        // Grant timelock roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // Anyone can execute
        
        vm.stopBroadcast();
        
        // Log final deployment summary
        console.log("\n=== MAINNET DEPLOYMENT COMPLETE ===");
        console.log("Network: Ethereum Mainnet (Chain ID: 1)");
        console.log("Gas Used: Approximately 15-20M gas");
        console.log("Estimated Cost: 0.5-1.0 ETH (depending on gas prices)");
        console.log("\nProxy Addresses (Use these in frontend):");
        console.log("BLOCK_TOKEN:", address(blockTokenProxy));
        console.log("PROPERTY_TOKEN:", address(propertyTokenProxy));
        console.log("STAKING:", address(stakingProxy));
        console.log("MARKETPLACE:", address(marketplaceProxy));
        console.log("GOVERNANCE:", address(governor));
        console.log("TIMELOCK:", address(timelock));
        console.log("PROXY_ADMIN:", address(proxyAdmin));
        console.log("\nImplementation Addresses:");
        console.log("BlockToken impl:", address(blockTokenImpl));
        console.log("PropertyToken impl:", address(propertyTokenImpl));
        console.log("Staking impl:", address(stakingImpl));
        console.log("Marketplace impl:", address(marketplaceImpl));
    }
}
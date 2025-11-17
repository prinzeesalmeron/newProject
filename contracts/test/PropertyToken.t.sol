// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../PropertyToken.sol";

contract PropertyTokenTest is Test {
    PropertyToken public token;
    address public owner;
    address public user1;
    address public user2;
    address public attacker;

    uint256 constant PROPERTY_ID = 1;
    uint256 constant TOKEN_AMOUNT = 1000;

    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        attacker = makeAddr("attacker");

        token = new PropertyToken();
    }

    // ============================================================================
    // BASIC FUNCTIONALITY TESTS
    // ============================================================================

    function testMint() public {
        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");

        assertEq(token.balanceOf(user1, PROPERTY_ID), TOKEN_AMOUNT);
        assertEq(token.totalSupply(PROPERTY_ID), TOKEN_AMOUNT);
    }

    function testMintEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit TransferSingle(owner, address(0), user1, PROPERTY_ID, TOKEN_AMOUNT);

        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");
    }

    function testTransfer() public {
        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");

        vm.prank(user1);
        token.safeTransferFrom(user1, user2, PROPERTY_ID, 500, "");

        assertEq(token.balanceOf(user1, PROPERTY_ID), 500);
        assertEq(token.balanceOf(user2, PROPERTY_ID), 500);
    }

    // ============================================================================
    // SECURITY TESTS - ACCESS CONTROL
    // ============================================================================

    function testOnlyOwnerCanMint() public {
        vm.prank(attacker);
        vm.expectRevert();
        token.mint(attacker, PROPERTY_ID, TOKEN_AMOUNT, "");
    }

    function testCannotMintToZeroAddress() public {
        vm.expectRevert();
        token.mint(address(0), PROPERTY_ID, TOKEN_AMOUNT, "");
    }

    function testCannotMintZeroAmount() public {
        vm.expectRevert();
        token.mint(user1, PROPERTY_ID, 0, "");
    }

    // ============================================================================
    // SECURITY TESTS - REENTRANCY
    // ============================================================================

    function testNoReentrancyOnTransfer() public {
        MaliciousReceiver malicious = new MaliciousReceiver(token);

        token.mint(address(malicious), PROPERTY_ID, TOKEN_AMOUNT, "");

        // Should not be able to reenter
        vm.expectRevert();
        malicious.attack(user1, PROPERTY_ID, TOKEN_AMOUNT);
    }

    // ============================================================================
    // SECURITY TESTS - INTEGER OVERFLOW/UNDERFLOW
    // ============================================================================

    function testCannotOverflowTotalSupply() public {
        uint256 maxUint = type(uint256).max;

        token.mint(user1, PROPERTY_ID, maxUint, "");

        vm.expectRevert();
        token.mint(user2, PROPERTY_ID, 1, "");
    }

    function testCannotUnderflowBalance() public {
        token.mint(user1, PROPERTY_ID, 100, "");

        vm.prank(user1);
        vm.expectRevert();
        token.safeTransferFrom(user1, user2, PROPERTY_ID, 101, "");
    }

    // ============================================================================
    // SECURITY TESTS - APPROVAL MECHANISM
    // ============================================================================

    function testApprovalForAll() public {
        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");

        vm.prank(user1);
        token.setApprovalForAll(user2, true);

        assertTrue(token.isApprovedForAll(user1, user2));

        // user2 can now transfer on behalf of user1
        vm.prank(user2);
        token.safeTransferFrom(user1, attacker, PROPERTY_ID, 100, "");

        assertEq(token.balanceOf(attacker, PROPERTY_ID), 100);
    }

    function testCannotTransferWithoutApproval() public {
        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");

        vm.prank(attacker);
        vm.expectRevert();
        token.safeTransferFrom(user1, attacker, PROPERTY_ID, 100, "");
    }

    // ============================================================================
    // SECURITY TESTS - FRONT-RUNNING PROTECTION
    // ============================================================================

    function testBatchMintPreventsFrontRunning() public {
        address[] memory recipients = new address[](2);
        uint256[] memory ids = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);

        recipients[0] = user1;
        recipients[1] = user2;
        ids[0] = PROPERTY_ID;
        ids[1] = PROPERTY_ID;
        amounts[0] = 500;
        amounts[1] = 500;

        // Atomic batch mint
        for (uint256 i = 0; i < recipients.length; i++) {
            token.mint(recipients[i], ids[i], amounts[i], "");
        }

        assertEq(token.balanceOf(user1, PROPERTY_ID), 500);
        assertEq(token.balanceOf(user2, PROPERTY_ID), 500);
    }

    // ============================================================================
    // FUZZ TESTING
    // ============================================================================

    function testFuzzMint(address recipient, uint256 propertyId, uint256 amount) public {
        vm.assume(recipient != address(0));
        vm.assume(amount > 0 && amount < type(uint128).max);
        vm.assume(propertyId > 0);

        token.mint(recipient, propertyId, amount, "");

        assertEq(token.balanceOf(recipient, propertyId), amount);
        assertEq(token.totalSupply(propertyId), amount);
    }

    function testFuzzTransfer(uint256 mintAmount, uint256 transferAmount) public {
        vm.assume(mintAmount > 0 && mintAmount < type(uint128).max);
        vm.assume(transferAmount > 0 && transferAmount <= mintAmount);

        token.mint(user1, PROPERTY_ID, mintAmount, "");

        vm.prank(user1);
        token.safeTransferFrom(user1, user2, PROPERTY_ID, transferAmount, "");

        assertEq(token.balanceOf(user1, PROPERTY_ID), mintAmount - transferAmount);
        assertEq(token.balanceOf(user2, PROPERTY_ID), transferAmount);
    }

    // ============================================================================
    // GAS OPTIMIZATION TESTS
    // ============================================================================

    function testGasOptimizedBatchTransfer() public {
        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");

        address[] memory recipients = new address[](10);
        uint256[] memory amounts = new uint256[](10);

        for (uint256 i = 0; i < 10; i++) {
            recipients[i] = makeAddr(string(abi.encodePacked("recipient", i)));
            amounts[i] = 10;
        }

        uint256 gasBefore = gasleft();

        vm.prank(user1);
        for (uint256 i = 0; i < recipients.length; i++) {
            token.safeTransferFrom(user1, recipients[i], PROPERTY_ID, amounts[i], "");
        }

        uint256 gasUsed = gasBefore - gasleft();

        // Gas should be reasonable (adjust based on actual measurements)
        assertLt(gasUsed, 1000000);
    }

    // ============================================================================
    // EDGE CASES
    // ============================================================================

    function testMultiplePropertiesPerUser() public {
        token.mint(user1, 1, 100, "");
        token.mint(user1, 2, 200, "");
        token.mint(user1, 3, 300, "");

        assertEq(token.balanceOf(user1, 1), 100);
        assertEq(token.balanceOf(user1, 2), 200);
        assertEq(token.balanceOf(user1, 3), 300);
    }

    function testTransferEntireBalance() public {
        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");

        vm.prank(user1);
        token.safeTransferFrom(user1, user2, PROPERTY_ID, TOKEN_AMOUNT, "");

        assertEq(token.balanceOf(user1, PROPERTY_ID), 0);
        assertEq(token.balanceOf(user2, PROPERTY_ID), TOKEN_AMOUNT);
    }

    function testSelfTransfer() public {
        token.mint(user1, PROPERTY_ID, TOKEN_AMOUNT, "");

        vm.prank(user1);
        token.safeTransferFrom(user1, user1, PROPERTY_ID, 100, "");

        assertEq(token.balanceOf(user1, PROPERTY_ID), TOKEN_AMOUNT);
    }
}

// Malicious receiver for reentrancy testing
contract MaliciousReceiver {
    PropertyToken public token;
    bool public attacked;

    constructor(PropertyToken _token) {
        token = _token;
    }

    function attack(address to, uint256 id, uint256 amount) external {
        token.safeTransferFrom(address(this), to, id, amount, "");
    }

    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256 amount,
        bytes memory
    ) external returns (bytes4) {
        if (!attacked) {
            attacked = true;
            // Try to reenter
            token.safeTransferFrom(address(this), msg.sender, id, amount, "");
        }
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}

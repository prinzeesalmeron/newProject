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
    uint256 constant TOKEN_PRICE = 0.1 ether;

    event PropertyTokenized(
        uint256 indexed propertyId,
        address indexed owner,
        uint256 totalTokens,
        uint256 pricePerToken
    );

    event TokensPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost
    );

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        attacker = makeAddr("attacker");

        token = new PropertyToken("https://api.blockestate.com/metadata/");

        // Give users some ETH
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(attacker, 100 ether);
    }

    receive() external payable {}

    // ============================================================================
    // BASIC FUNCTIONALITY TESTS
    // ============================================================================

    function testTokenizeProperty() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        assertEq(propertyId, PROPERTY_ID);

        (
            string memory title,
            string memory location,
            uint256 totalTokens,
            uint256 availableTokens,
            uint256 pricePerToken,
            address propertyOwner,
            bool isActive,
            string memory metadataURI
        ) = token.properties(propertyId);

        assertEq(title, "Sunset Tower");
        assertEq(location, "Miami, FL");
        assertEq(totalTokens, TOKEN_AMOUNT);
        assertEq(availableTokens, TOKEN_AMOUNT);
        assertEq(pricePerToken, TOKEN_PRICE);
        assertEq(propertyOwner, owner);
        assertTrue(isActive);
        assertEq(metadataURI, "ipfs://QmExample");
    }

    function testTokenizeEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit PropertyTokenized(PROPERTY_ID, owner, TOKEN_AMOUNT, TOKEN_PRICE);

        token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );
    }

    function testPurchaseTokens() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 purchaseAmount = 100;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.prank(user1);
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);

        assertEq(token.balanceOf(user1, propertyId), purchaseAmount);

        (, , , uint256 availableTokens, , , ,) = token.properties(propertyId);
        assertEq(availableTokens, TOKEN_AMOUNT - purchaseAmount);
    }

    function testPurchaseEmitsEvent() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 purchaseAmount = 100;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.expectEmit(true, true, false, true);
        emit TokensPurchased(propertyId, user1, purchaseAmount, totalCost);

        vm.prank(user1);
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);
    }

    function testTransferTokens() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 purchaseAmount = 100;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.prank(user1);
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);

        // Transfer half to user2
        vm.prank(user1);
        token.safeTransferFrom(user1, user2, propertyId, 50, "");

        assertEq(token.balanceOf(user1, propertyId), 50);
        assertEq(token.balanceOf(user2, propertyId), 50);
    }

    // ============================================================================
    // SECURITY TESTS - ACCESS CONTROL
    // ============================================================================

    function testOnlyAuthorizedCanTokenize() public {
        vm.prank(attacker);
        vm.expectRevert("Not authorized");
        token.tokenizeProperty(
            "Malicious Property",
            "Nowhere",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmMalicious"
        );
    }

    function testAuthorizedMinterCanTokenize() public {
        token.addAuthorizedMinter(user1);

        vm.prank(user1);
        uint256 propertyId = token.tokenizeProperty(
            "Authorized Property",
            "Somewhere",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmAuthorized"
        );

        assertGt(propertyId, 0);
    }

    function testOnlyOwnerCanAddMinter() public {
        vm.prank(attacker);
        vm.expectRevert();
        token.addAuthorizedMinter(user1);
    }

    function testOnlyOwnerCanRemoveMinter() public {
        token.addAuthorizedMinter(user1);

        vm.prank(attacker);
        vm.expectRevert();
        token.removeAuthorizedMinter(user1);
    }

    // ============================================================================
    // SECURITY TESTS - PURCHASE VALIDATION
    // ============================================================================

    function testCannotPurchaseInactiveProperty() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        token.updatePropertyStatus(propertyId, false);

        uint256 purchaseAmount = 100;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.prank(user1);
        vm.expectRevert("Property not active");
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);
    }

    function testCannotPurchaseZeroTokens() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        token.purchaseTokens{value: 0}(propertyId, 0);
    }

    function testCannotPurchaseMoreThanAvailable() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 purchaseAmount = TOKEN_AMOUNT + 1;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.prank(user1);
        vm.expectRevert("Not enough tokens available");
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);
    }

    function testCannotPurchaseWithInsufficientFunds() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 purchaseAmount = 100;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.prank(user1);
        vm.expectRevert("Insufficient payment");
        token.purchaseTokens{value: totalCost - 1}(propertyId, purchaseAmount);
    }

    // ============================================================================
    // SECURITY TESTS - REENTRANCY
    // ============================================================================

    function testNoReentrancyOnPurchase() public {
        MaliciousReceiver malicious = new MaliciousReceiver(token);
        vm.deal(address(malicious), 100 ether);

        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        // Malicious contract tries to purchase
        vm.expectRevert();
        malicious.attack(propertyId, 100);
    }

    // ============================================================================
    // PAUSABLE TESTS
    // ============================================================================

    function testCannotPurchaseWhenPaused() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        token.pause();

        uint256 purchaseAmount = 100;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.prank(user1);
        vm.expectRevert();
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);
    }

    function testCannotTransferWhenPaused() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 purchaseAmount = 100;
        uint256 totalCost = purchaseAmount * TOKEN_PRICE;

        vm.prank(user1);
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);

        token.pause();

        vm.prank(user1);
        vm.expectRevert();
        token.safeTransferFrom(user1, user2, propertyId, 50, "");
    }

    function testOnlyOwnerCanPause() public {
        vm.prank(attacker);
        vm.expectRevert();
        token.pause();
    }

    function testOnlyOwnerCanUnpause() public {
        token.pause();

        vm.prank(attacker);
        vm.expectRevert();
        token.unpause();
    }

    // ============================================================================
    // FUZZ TESTING
    // ============================================================================

    function testFuzzTokenizeProperty(
        uint256 totalTokens,
        uint256 pricePerToken
    ) public {
        vm.assume(totalTokens > 0 && totalTokens < type(uint128).max);
        vm.assume(pricePerToken > 0 && pricePerToken < 1000 ether);

        uint256 propertyId = token.tokenizeProperty(
            "Fuzz Property",
            "Fuzz Location",
            totalTokens,
            pricePerToken,
            "ipfs://QmFuzz"
        );

        (, , uint256 storedTotalTokens, , uint256 storedPrice, , ,) = token.properties(propertyId);
        assertEq(storedTotalTokens, totalTokens);
        assertEq(storedPrice, pricePerToken);
    }

    function testFuzzPurchaseTokens(uint256 purchaseAmount) public {
        vm.assume(purchaseAmount > 0 && purchaseAmount <= TOKEN_AMOUNT);

        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 totalCost = purchaseAmount * TOKEN_PRICE;
        vm.deal(user1, totalCost);

        vm.prank(user1);
        token.purchaseTokens{value: totalCost}(propertyId, purchaseAmount);

        assertEq(token.balanceOf(user1, propertyId), purchaseAmount);
    }

    // ============================================================================
    // EDGE CASES
    // ============================================================================

    function testMultiplePropertiesPerUser() public {
        uint256 prop1 = token.tokenizeProperty("Property 1", "Location 1", 100, TOKEN_PRICE, "ipfs://1");
        uint256 prop2 = token.tokenizeProperty("Property 2", "Location 2", 200, TOKEN_PRICE, "ipfs://2");
        uint256 prop3 = token.tokenizeProperty("Property 3", "Location 3", 300, TOKEN_PRICE, "ipfs://3");

        vm.startPrank(user1);
        token.purchaseTokens{value: 10 * TOKEN_PRICE}(prop1, 10);
        token.purchaseTokens{value: 20 * TOKEN_PRICE}(prop2, 20);
        token.purchaseTokens{value: 30 * TOKEN_PRICE}(prop3, 30);
        vm.stopPrank();

        assertEq(token.balanceOf(user1, prop1), 10);
        assertEq(token.balanceOf(user1, prop2), 20);
        assertEq(token.balanceOf(user1, prop3), 30);
    }

    function testPurchaseAllAvailableTokens() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        uint256 totalCost = TOKEN_AMOUNT * TOKEN_PRICE;

        vm.prank(user1);
        token.purchaseTokens{value: totalCost}(propertyId, TOKEN_AMOUNT);

        assertEq(token.balanceOf(user1, propertyId), TOKEN_AMOUNT);

        (, , , uint256 availableTokens, , , ,) = token.properties(propertyId);
        assertEq(availableTokens, 0);
    }

    function testURIGeneration() public {
        uint256 propertyId = token.tokenizeProperty(
            "Sunset Tower",
            "Miami, FL",
            TOKEN_AMOUNT,
            TOKEN_PRICE,
            "ipfs://QmExample"
        );

        string memory tokenURI = token.uri(propertyId);
        assertTrue(bytes(tokenURI).length > 0);
    }
}

// Malicious receiver for reentrancy testing
contract MaliciousReceiver {
    PropertyToken public token;
    bool public attacked;

    constructor(PropertyToken _token) {
        token = _token;
    }

    function attack(uint256 propertyId, uint256 amount) external {
        uint256 cost = amount * 0.1 ether;
        token.purchaseTokens{value: cost}(propertyId, amount);
    }

    function onERC1155Received(
        address,
        address,
        uint256 propertyId,
        uint256 amount,
        bytes memory
    ) external returns (bytes4) {
        if (!attacked) {
            attacked = true;
            // Try to reenter
            uint256 cost = amount * 0.1 ether;
            token.purchaseTokens{value: cost}(propertyId, amount);
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

    receive() external payable {}
}

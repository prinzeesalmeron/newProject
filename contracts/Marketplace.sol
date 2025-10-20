// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Marketplace is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken;
    uint256 public marketplaceFee; // Fee in basis points (e.g., 250 = 2.5%)

    struct Listing {
        address seller;
        uint256 amount;
        uint256 pricePerToken; // Price in ETH
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;

    event TokenListed(uint256 indexed listingId, address seller, uint256 amount, uint256 pricePerToken);
    event TokenPurchased(uint256 indexed listingId, address buyer, uint256 amount);
    event ListingCancelled(uint256 indexed listingId);

    constructor(address _paymentToken, uint256 _marketplaceFee) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        marketplaceFee = _marketplaceFee;
    }

    // List tokens for sale
    function createListing(uint256 amount, uint256 pricePerToken) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(pricePerToken > 0, "Price must be > 0");

        // Transfer tokens from seller to marketplace (escrow)
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        nextListingId++;
        listings[nextListingId] = Listing({
            seller: msg.sender,
            amount: amount,
            pricePerToken: pricePerToken,
            isActive: true
        });

        emit TokenListed(nextListingId, msg.sender, amount, pricePerToken);
    }

    // Buy tokens from a listing
    function purchaseTokens(uint256 _listingId, uint256 amount) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(amount > 0 && amount <= listing.amount, "Invalid amount");
        uint256 totalPrice = amount * listing.pricePerToken;
        require(msg.value == totalPrice, "Incorrect ETH amount");

        // Calculate marketplace fee
        uint256 fee = (totalPrice * marketplaceFee) / 10_000;
        uint256 sellerAmount = totalPrice - fee;

        // Transfer ETH to seller and fee to owner
        payable(listing.seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(owner()).transfer(fee);
        }

        // Transfer tokens to buyer
        paymentToken.safeTransfer(msg.sender, amount);

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }

        emit TokenPurchased(_listingId, msg.sender, amount);
    }

    // Cancel a listing
    function cancelListing(uint256 _listingId) external nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        // Return tokens to seller
        paymentToken.safeTransfer(listing.seller, listing.amount);
        listing.isActive = false;

        emit ListingCancelled(_listingId);
    }

    // Admin functions
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        marketplaceFee = _fee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Recover accidentally sent ERC20 tokens
    function recoverToken(address tokenAddress) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), IERC20(tokenAddress).balanceOf(address(this)));
    }

    // Withdraw ETH from the contract
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

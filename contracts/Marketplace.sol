// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Marketplace is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public blockToken;
    uint256 public marketplaceFee; // Fee in basis points (e.g., 250 = 2.5%)

    struct Listing {
        address seller;
        uint256 amount;
        uint256 pricePerToken; // Price in ETH (or another token if extended)
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingId;

    event TokenListed(uint256 indexed listingId, address seller, uint256 amount, uint256 pricePerToken);
    event TokenPurchased(uint256 indexed listingId, address buyer, uint256 amount);

   constructor(address _blockToken, uint256 _marketplaceFee) 
    Ownable(msg.sender) 
{
    blockToken = IERC20(_blockToken);
    marketplaceFee = _marketplaceFee;
}

    // List tokens for sale
    function createListing(uint256 amount, uint256 pricePerToken) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(pricePerToken > 0, "Price must be > 0");

        // Transfer tokens from seller to marketplace (escrow)
        blockToken.safeTransferFrom(msg.sender, address(this), amount);

        listingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            amount: amount,
            pricePerToken: pricePerToken,
            isActive: true
        });

        emit TokenListed(listingId, msg.sender, amount, pricePerToken);
    }

    // Buy tokens from a listing
    function purchaseTokens(uint256 listingId, uint256 amount) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(amount <= listing.amount, "Insufficient tokens available");
        require(msg.value == amount * listing.pricePerToken, "Incorrect ETH amount");

        // Calculate fee
        uint256 fee = (amount * marketplaceFee) / 10_000; // 0.1% if marketplaceFee = 100
        uint256 sellerAmount = amount - fee;

        // Transfer tokens to buyer
        blockToken.safeTransfer(listing.seller, sellerAmount);
        blockToken.safeTransfer(owner(), fee); // Send fee to marketplace owner

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }

        // Refund excess ETH (if any)
        if (address(this).balance > 0) {
            payable(msg.sender).transfer(address(this).balance);
        }

        emit TokenPurchased(listingId, msg.sender, amount);
    }

    // Cancel a listing
    function cancelListing(uint256 listingId) external nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");

        // Return tokens to seller
        blockToken.safeTransfer(listing.seller, listing.amount);
        listing.isActive = false;
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
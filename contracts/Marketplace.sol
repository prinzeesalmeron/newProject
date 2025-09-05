// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PropertyToken.sol";
import "./BlockToken.sol";

/**
 * @title Marketplace
 * @dev Decentralized marketplace for trading property tokens with automated rental payouts
 */
contract Marketplace is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    struct Listing {
        uint256 propertyId;
        address seller;
        uint256 tokensForSale;
        uint256 pricePerToken;
        bool isActive;
        uint256 createdAt;
    }
    
    struct RentalPayout {
        uint256 propertyId;
        uint256 totalAmount;
        uint256 payoutDate;
        mapping(address => bool) claimed;
        mapping(address => uint256) amounts;
    }
    
    PropertyToken public immutable propertyToken;
    BlockToken public immutable blockToken;
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => RentalPayout) public rentalPayouts;
    mapping(uint256 => uint256[]) public propertyPayouts; // propertyId => payout IDs
    
    uint256 public nextListingId = 1;
    uint256 public nextPayoutId = 1;
    uint256 public platformFee = 250; // 2.5% in basis points
    address public feeRecipient;
    
    // Liquidity pool for instant buy/sell
    mapping(uint256 => uint256) public liquidityPool; // propertyId => BLOCK amount
    mapping(uint256 => uint256) public poolTokens; // propertyId => property tokens in pool
    
    event PropertyListed(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed seller,
        uint256 tokensForSale,
        uint256 pricePerToken
    );
    
    event TokensPurchased(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    event RentalPayoutCreated(
        uint256 indexed payoutId,
        uint256 indexed propertyId,
        uint256 totalAmount
    );
    
    event RentalClaimed(
        uint256 indexed payoutId,
        uint256 indexed propertyId,
        address indexed recipient,
        uint256 amount
    );
    
    event LiquidityAdded(uint256 indexed propertyId, uint256 blockAmount, uint256 tokenAmount);
    event LiquidityRemoved(uint256 indexed propertyId, uint256 blockAmount, uint256 tokenAmount);
    
    constructor(
        address _propertyToken,
        address _blockToken,
        address _feeRecipient
    ) {
        propertyToken = PropertyToken(_propertyToken);
        blockToken = BlockToken(_blockToken);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev List property tokens for sale
     */
    function listTokens(
        uint256 propertyId,
        uint256 tokensForSale,
        uint256 pricePerToken
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(tokensForSale > 0, "Must list at least 1 token");
        require(pricePerToken > 0, "Price must be greater than 0");
        require(
            propertyToken.balanceOf(msg.sender, propertyId) >= tokensForSale,
            "Insufficient token balance"
        );
        
        uint256 listingId = nextListingId++;
        
        listings[listingId] = Listing({
            propertyId: propertyId,
            seller: msg.sender,
            tokensForSale: tokensForSale,
            pricePerToken: pricePerToken,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Transfer tokens to marketplace for escrow
        propertyToken.safeTransferFrom(
            msg.sender,
            address(this),
            propertyId,
            tokensForSale,
            ""
        );
        
        emit PropertyListed(listingId, propertyId, msg.sender, tokensForSale, pricePerToken);
        return listingId;
    }
    
    /**
     * @dev Buy tokens from a listing
     */
    function buyTokens(uint256 listingId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= listing.tokensForSale, "Not enough tokens available");
        
        uint256 totalCost = amount * listing.pricePerToken;
        uint256 fee = (totalCost * platformFee) / 10000;
        uint256 sellerAmount = totalCost - fee;
        
        // Transfer BLOCK tokens from buyer
        blockToken.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        blockToken.safeTransferFrom(msg.sender, feeRecipient, fee);
        
        // Transfer property tokens to buyer
        propertyToken.safeTransferFrom(
            address(this),
            msg.sender,
            listing.propertyId,
            amount,
            ""
        );
        
        // Update listing
        listing.tokensForSale -= amount;
        if (listing.tokensForSale == 0) {
            listing.isActive = false;
        }
        
        emit TokensPurchased(listingId, listing.propertyId, msg.sender, amount, totalCost);
    }
    
    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");
        
        // Return tokens to seller
        propertyToken.safeTransferFrom(
            address(this),
            listing.seller,
            listing.propertyId,
            listing.tokensForSale,
            ""
        );
        
        listing.isActive = false;
        
        emit ListingCancelled(listingId);
    }
    
    /**
     * @dev Create rental payout for property holders
     */
    function createRentalPayout(uint256 propertyId, uint256 totalAmount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(totalAmount > 0, "Amount must be greater than 0");
        
        uint256 payoutId = nextPayoutId++;
        RentalPayout storage payout = rentalPayouts[payoutId];
        payout.propertyId = propertyId;
        payout.totalAmount = totalAmount;
        payout.payoutDate = block.timestamp;
        
        propertyPayouts[propertyId].push(payoutId);
        
        // Transfer BLOCK tokens to contract for distribution
        blockToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        emit RentalPayoutCreated(payoutId, propertyId, totalAmount);
    }
    
    /**
     * @dev Claim rental payout
     */
    function claimRentalPayout(uint256 payoutId) external nonReentrant {
        RentalPayout storage payout = rentalPayouts[payoutId];
        require(!payout.claimed[msg.sender], "Already claimed");
        
        uint256 userTokens = propertyToken.balanceOf(msg.sender, payout.propertyId);
        require(userTokens > 0, "No tokens owned");
        
        uint256 totalSupply = propertyToken.totalSupply(payout.propertyId);
        uint256 userShare = (payout.totalAmount * userTokens) / totalSupply;
        
        payout.claimed[msg.sender] = true;
        payout.amounts[msg.sender] = userShare;
        
        blockToken.safeTransfer(msg.sender, userShare);
        
        emit RentalClaimed(payoutId, payout.propertyId, msg.sender, userShare);
    }
    
    /**
     * @dev Add liquidity to property token pool
     */
    function addLiquidity(uint256 propertyId, uint256 blockAmount, uint256 tokenAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(blockAmount > 0 && tokenAmount > 0, "Amounts must be greater than 0");
        
        // Transfer tokens to pool
        blockToken.safeTransferFrom(msg.sender, address(this), blockAmount);
        propertyToken.safeTransferFrom(msg.sender, address(this), propertyId, tokenAmount, "");
        
        liquidityPool[propertyId] += blockAmount;
        poolTokens[propertyId] += tokenAmount;
        
        emit LiquidityAdded(propertyId, blockAmount, tokenAmount);
    }
    
    /**
     * @dev Instant buy from liquidity pool
     */
    function instantBuy(uint256 propertyId, uint256 tokenAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(tokenAmount > 0, "Amount must be greater than 0");
        require(poolTokens[propertyId] >= tokenAmount, "Insufficient liquidity");
        
        uint256 blockCost = (liquidityPool[propertyId] * tokenAmount) / poolTokens[propertyId];
        uint256 fee = (blockCost * platformFee) / 10000;
        uint256 totalCost = blockCost + fee;
        
        // Transfer BLOCK from buyer
        blockToken.safeTransferFrom(msg.sender, address(this), blockCost);
        blockToken.safeTransferFrom(msg.sender, feeRecipient, fee);
        
        // Transfer property tokens to buyer
        propertyToken.safeTransferFrom(address(this), msg.sender, propertyId, tokenAmount, "");
        
        // Update pool
        liquidityPool[propertyId] -= blockCost;
        poolTokens[propertyId] -= tokenAmount;
        
        emit TokensPurchased(0, propertyId, msg.sender, tokenAmount, totalCost);
    }
    
    /**
     * @dev Instant sell to liquidity pool
     */
    function instantSell(uint256 propertyId, uint256 tokenAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(tokenAmount > 0, "Amount must be greater than 0");
        require(
            propertyToken.balanceOf(msg.sender, propertyId) >= tokenAmount,
            "Insufficient token balance"
        );
        
        uint256 blockAmount = (liquidityPool[propertyId] * tokenAmount) / poolTokens[propertyId];
        uint256 fee = (blockAmount * platformFee) / 10000;
        uint256 sellerAmount = blockAmount - fee;
        
        // Transfer property tokens from seller
        propertyToken.safeTransferFrom(msg.sender, address(this), propertyId, tokenAmount, "");
        
        // Transfer BLOCK to seller
        blockToken.safeTransfer(msg.sender, sellerAmount);
        blockToken.safeTransfer(feeRecipient, fee);
        
        // Update pool
        liquidityPool[propertyId] += blockAmount;
        poolTokens[propertyId] += tokenAmount;
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (
        uint256 propertyId,
        address seller,
        uint256 tokensForSale,
        uint256 pricePerToken,
        bool isActive,
        uint256 createdAt
    ) {
        Listing memory listing = listings[listingId];
        return (
            listing.propertyId,
            listing.seller,
            listing.tokensForSale,
            listing.pricePerToken,
            listing.isActive,
            listing.createdAt
        );
    }
    
    /**
     * @dev Get liquidity pool info
     */
    function getPoolInfo(uint256 propertyId) external view returns (
        uint256 blockAmount,
        uint256 tokenAmount,
        uint256 price
    ) {
        blockAmount = liquidityPool[propertyId];
        tokenAmount = poolTokens[propertyId];
        price = tokenAmount > 0 ? blockAmount / tokenAmount : 0;
    }
    
    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = newFee;
    }
    
    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
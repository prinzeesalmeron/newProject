// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PropertyToken
 * @dev ERC1155 token representing fractional ownership of real estate properties
 */
contract PropertyToken is ERC1155, Ownable, Pausable, ReentrancyGuard {
    using Strings for uint256;
    
    struct Property {
        string title;
        string location;
        uint256 totalTokens;
        uint256 availableTokens;
        uint256 pricePerToken;
        address owner;
        bool isActive;
        string metadataURI;
    }
    
    mapping(uint256 => Property) public properties;
    mapping(address => bool) public authorizedMinters;
    
    uint256 public nextPropertyId = 1;
    string public baseURI;
    
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
    
    event PropertyUpdated(uint256 indexed propertyId);
    
    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(string memory _baseURI) ERC1155(_baseURI) Ownable(msg.sender) {
        baseURI = _baseURI;
    }
    
    /**
     * @dev Tokenize a new property
     */
    function tokenizeProperty(
        string memory title,
        string memory location,
        uint256 totalTokens,
        uint256 pricePerToken,
        string memory metadataURI
    ) external onlyAuthorized returns (uint256) {
        uint256 propertyId = nextPropertyId++;
        
        properties[propertyId] = Property({
            title: title,
            location: location,
            totalTokens: totalTokens,
            availableTokens: totalTokens,
            pricePerToken: pricePerToken,
            owner: msg.sender,
            isActive: true,
            metadataURI: metadataURI
        });
        
        emit PropertyTokenized(propertyId, msg.sender, totalTokens, pricePerToken);
        return propertyId;
    }
    
    /**
     * @dev Purchase property tokens
     */
    function purchaseTokens(uint256 propertyId, uint256 amount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Property storage property = properties[propertyId];
        require(property.isActive, "Property not active");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= property.availableTokens, "Not enough tokens available");
        
        uint256 totalCost = amount * property.pricePerToken;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Update available tokens
        property.availableTokens -= amount;
        
        // Mint tokens to buyer
        _mint(msg.sender, propertyId, amount, "");
        
        // Transfer payment to property owner
        payable(property.owner).transfer(totalCost);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit TokensPurchased(propertyId, msg.sender, amount, totalCost);
    }
    
    /**
     * @dev Get property information
     */
    function getProperty(uint256 propertyId) 
        external 
        view 
        returns (
            string memory title,
            string memory location,
            uint256 totalTokens,
            uint256 availableTokens,
            uint256 pricePerToken,
            address propertyOwner,
            bool isActive
        ) 
    {
        Property memory property = properties[propertyId];
        return (
            property.title,
            property.location,
            property.totalTokens,
            property.availableTokens,
            property.pricePerToken,
            property.owner,
            property.isActive
        );
    }
    
    /**
     * @dev Update property status
     */
    function updatePropertyStatus(uint256 propertyId, bool isActive) 
        external 
        onlyAuthorized 
    {
        properties[propertyId].isActive = isActive;
        emit PropertyUpdated(propertyId);
    }
    
    /**
     * @dev Add authorized minter
     */
    function addAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }
    
    /**
     * @dev Remove authorized minter
     */
    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }
    
    /**
     * @dev Set base URI for metadata
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
        _setURI(_baseURI);
    }
    
    /**
     * @dev Get token URI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        Property memory property = properties[tokenId];
        if (bytes(property.metadataURI).length > 0) {
            return property.metadataURI;
        }
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) internal whenNotPaused {
    // Custom logic (e.g., restrict transfers to whitelisted addresses)
    require(to != address(0), "Cannot transfer to zero address");

    // Call parent logic
    // super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
}

}
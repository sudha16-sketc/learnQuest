// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LearnQuestGameStore
 * @dev On-chain store for purchasing hints and cosmetic accessories using LQST utility tokens.
 */
contract LearnQuestGameStore is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public treasury;

    struct Item {
        string name;
        uint256 price;
        bool isAvailable;
    }

    // sku => Item
    mapping(string => Item) public items;

    event ItemConfigured(string indexed sku, string name, uint256 price, bool isAvailable);
    event ItemPurchased(address indexed buyer, string indexed sku, uint256 price, uint256 timestamp);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    constructor(
        address tokenAddress,
        address initialTreasury,
        address initialOwner
    ) Ownable(initialOwner) {
        require(tokenAddress != address(0), "Invalid token address");
        require(initialTreasury != address(0), "Invalid treasury address");
        token = IERC20(tokenAddress);
        treasury = initialTreasury;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function setItem(
        string calldata sku,
        string calldata name,
        uint256 price,
        bool isAvailable
    ) external onlyOwner {
        require(bytes(sku).length > 0, "SKU cannot be empty");
        items[sku] = Item({
            name: name,
            price: price,
            isAvailable: isAvailable
        });
        emit ItemConfigured(sku, name, price, isAvailable);
    }

    function getItem(string calldata sku) external view returns (string memory name, uint256 price, bool isAvailable) {
        Item memory item = items[sku];
        return (item.name, item.price, item.isAvailable);
    }

    /**
     * @dev Purchase an in-game item using LQST tokens. Tokens are securely transferred to the treasury.
     */
    function purchaseItem(string calldata sku) external nonReentrant {
        Item memory item = items[sku];
        require(item.isAvailable, "Item is not available for purchase");
        require(item.price > 0, "Item price must be positive");

        // Transfer LQST tokens from buyer to treasury
        token.safeTransferFrom(msg.sender, treasury, item.price);

        emit ItemPurchased(msg.sender, sku, item.price, block.timestamp);
    }
}

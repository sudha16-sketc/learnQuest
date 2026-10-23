// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title LearnQuestUtilityToken (LQST)
 * @dev ERC-20 utility token for LearnQuest educational platform on MST Blockchain.
 * Used for purchasing hints, cosmetic accessories, and redeeming learning achievements.
 */
contract LearnQuestUtilityToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100M LQST Max Capped Supply

    event MintCapReached(uint256 currentSupply, uint256 maxSupply);

    constructor(address initialAdmin) ERC20("LearnQuest Token", "LQST") {
        require(initialAdmin != address(0), "Invalid initial admin");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
    }

    /**
     * @dev Mint utility tokens to a recipient. Only callable by addresses with MINTER_ROLE (e.g. Rewards contract).
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max token supply exceeded");
        _mint(to, amount);
    }
}

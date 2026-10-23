// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./LearnQuestUtilityToken.sol";

/**
 * @title LearnQuestRewards
 * @dev Distributes on-chain LQST utility token rewards via cryptographic EIP-712 signed vouchers.
 * Prevents double-spending, signature replay, and unauthorized minting.
 */
contract LearnQuestRewards is EIP712, Ownable {
    using ECDSA for bytes32;

    LearnQuestUtilityToken public immutable token;
    address public signerAddress;

    // user address => nonce => claimed status
    mapping(address => mapping(uint256 => bool)) public isNonceUsed;

    bytes32 public constant REWARD_VOUCHER_TYPEHASH = keccak256(
        "RewardVoucher(address user,uint256 amount,uint256 nonce,uint256 expiry,string reason)"
    );

    event RewardClaimed(
        address indexed user,
        uint256 amount,
        uint256 indexed nonce,
        string reason
    );
    event SignerAddressUpdated(address indexed oldSigner, address indexed newSigner);

    constructor(
        address tokenAddress,
        address initialSigner,
        address initialOwner
    ) EIP712("LearnQuestRewards", "1") Ownable(initialOwner) {
        require(tokenAddress != address(0), "Invalid token address");
        require(initialSigner != address(0), "Invalid signer address");
        token = LearnQuestUtilityToken(tokenAddress);
        signerAddress = initialSigner;
    }

    /**
     * @dev Sets a new backend signer address. Only callable by contract owner.
     */
    function setSignerAddress(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid new signer");
        address oldSigner = signerAddress;
        signerAddress = newSigner;
        emit SignerAddressUpdated(oldSigner, newSigner);
    }

    /**
     * @dev Claim reward with an EIP-712 signed voucher from the LearnQuest server.
     */
    function claimReward(
        address user,
        uint256 amount,
        uint256 nonce,
        uint256 expiry,
        string calldata reason,
        bytes calldata signature
    ) external {
        require(msg.sender == user, "Caller must match voucher recipient");
        require(block.timestamp <= expiry, "Voucher has expired");
        require(!isNonceUsed[user][nonce], "Voucher nonce already used");
        require(amount > 0, "Reward amount must be greater than zero");

        // Compute typed hash
        bytes32 structHash = keccak256(
            abi.encode(
                REWARD_VOUCHER_TYPEHASH,
                user,
                amount,
                nonce,
                expiry,
                keccak256(bytes(reason))
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = digest.recover(signature);

        require(recoveredSigner == signerAddress, "Invalid voucher signature");

        // Mark nonce as used before external call (Reentrancy guard)
        isNonceUsed[user][nonce] = true;

        // Mint reward tokens to the user
        token.mint(user, amount);

        emit RewardClaimed(user, amount, nonce, reason);
    }
}

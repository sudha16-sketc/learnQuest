// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title LearnQuestAchievements
 * @dev On-chain registry for verifiable educational credentials and course completion diplomas.
 * Permanent, tamper-proof proof of educational mastery on MST Blockchain.
 */
contract LearnQuestAchievements is AccessControl {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    struct Record {
        bool exists;
        uint256 timestamp;
        uint256 score;
        string title;
    }

    // student address => achievementType => Record
    mapping(address => mapping(string => Record)) public achievements;

    event AchievementRecorded(
        address indexed student,
        string indexed achievementType,
        string title,
        uint256 score,
        uint256 timestamp
    );

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid initial admin");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(RECORDER_ROLE, initialAdmin);
    }

    /**
     * @dev Records an achievement for a student upon verified course completion.
     */
    function recordAchievement(
        address student,
        string calldata achievementType,
        string calldata title,
        uint256 score
    ) external onlyRole(RECORDER_ROLE) {
        require(student != address(0), "Cannot record for zero address");
        require(bytes(achievementType).length > 0, "Achievement type cannot be empty");
        require(!achievements[student][achievementType].exists, "Achievement already recorded for student");

        achievements[student][achievementType] = Record({
            exists: true,
            timestamp: block.timestamp,
            score: score,
            title: title
        });

        emit AchievementRecorded(student, achievementType, title, score, block.timestamp);
    }

    /**
     * @dev Check if a student has an achievement.
     */
    function getAchievement(address student, string calldata achievementType)
        external
        view
        returns (bool exists, uint256 timestamp, uint256 score, string memory title)
    {
        Record memory rec = achievements[student][achievementType];
        return (rec.exists, rec.timestamp, rec.score, rec.title);
    }
}

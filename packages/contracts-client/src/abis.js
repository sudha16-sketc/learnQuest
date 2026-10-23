/**
 * Smart Contract ABIs for LearnQuest on MST Blockchain
 */

export const LearnQuestUtilityTokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const LearnQuestRewardsABI = [
  "function token() view returns (address)",
  "function signerAddress() view returns (address)",
  "function isNonceUsed(address user, uint256 nonce) view returns (bool)",
  "function claimReward(address user, uint256 amount, uint256 nonce, uint256 expiry, string reason, bytes signature)",
  "function setSignerAddress(address newSigner)",
  "event RewardClaimed(address indexed user, uint256 amount, uint256 indexed nonce, string reason)"
];

export const LearnQuestGameStoreABI = [
  "function token() view returns (address)",
  "function treasury() view returns (address)",
  "function getItem(string sku) view returns (string name, uint256 price, bool isAvailable)",
  "function purchaseItem(string sku)",
  "function setItem(string sku, string name, uint256 price, bool isAvailable)",
  "event ItemPurchased(address indexed buyer, string indexed sku, uint256 price, uint256 timestamp)"
];

export const LearnQuestAchievementsABI = [
  "function getAchievement(address student, string achievementType) view returns (bool exists, uint256 timestamp, uint256 score, string title)",
  "function recordAchievement(address student, string achievementType, string title, uint256 score)",
  "event AchievementRecorded(address indexed student, string indexed achievementType, string title, uint256 score, uint256 timestamp)"
];

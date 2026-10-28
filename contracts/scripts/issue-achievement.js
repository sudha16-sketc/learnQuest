const hre = require("hardhat");

async function main() {
  const achievementsAddress = process.env.MST_ACHIEVEMENTS_ADDRESS;
  if (!achievementsAddress) {
    throw new Error("MST_ACHIEVEMENTS_ADDRESS not set in environment");
  }

  const studentAddress = process.env.ACHIEVEMENT_STUDENT_ADDRESS;
  if (!studentAddress) {
    throw new Error("ACHIEVEMENT_STUDENT_ADDRESS not set in environment");
  }

  const achievementType = process.env.ACHIEVEMENT_TYPE || "SOLIDITY_FUNDAMENTALS_MASTERY";
  const title = process.env.ACHIEVEMENT_TITLE || "Solidity Fundamentals Mastery";
  const score = parseInt(process.env.ACHIEVEMENT_SCORE || "90", 10);

  const [signer] = await hre.ethers.getSigners();
  console.log(`\n========================================`);
  console.log(`Issuing Achievement on MST Blockchain`);
  console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId})`);
  console.log(`Recorder: ${signer.address}`);
  console.log(`Student: ${studentAddress}`);
  console.log(`Contract: ${achievementsAddress}`);
  console.log(`========================================\n`);

  const Achievements = await hre.ethers.getContractFactory("LearnQuestAchievements");
  const achievements = Achievements.attach(achievementsAddress);

  // Check if already exists
  const existing = await achievements.getAchievement(studentAddress, achievementType);
  if (existing.exists) {
    console.log("Achievement already exists on-chain:");
    console.log(`  Title: ${existing.title}`);
    console.log(`  Score: ${existing.score}`);
    console.log(`  Timestamp: ${existing.timestamp}`);
    process.exit(0);
  }

  console.log(`Recording achievement...`);
  const tx = await achievements.recordAchievement(studentAddress, achievementType, title, score);
  console.log(`Transaction sent: ${tx.hash}`);
  console.log(`Waiting for confirmation...`);
  
  const receipt = await tx.wait();
  console.log(`\nTransaction confirmed!`);
  console.log(`Block: ${receipt.blockNumber}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
  
  // Verify
  const record = await achievements.getAchievement(studentAddress, achievementType);
  console.log(`\nVerified on-chain:`);
  console.log(`  Exists: ${record.exists}`);
  console.log(`  Title: ${record.title}`);
  console.log(`  Score: ${record.score}`);
  console.log(`  Timestamp: ${record.timestamp}`);
  
  const explorerUrl = process.env.MST_EXPLORER_URL || "https://testnet.mstscan.com";
  console.log(`\nExplorer: ${explorerUrl}/tx/${tx.hash}`);
  console.log(`========================================\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

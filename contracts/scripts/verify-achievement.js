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

  const Achievements = await hre.ethers.getContractFactory("LearnQuestAchievements");
  const achievements = Achievements.attach(achievementsAddress);

  const record = await achievements.getAchievement(studentAddress, achievementType);
  
  console.log(`\n========================================`);
  console.log(`On-Chain Achievement Verification`);
  console.log(`Contract: ${achievementsAddress}`);
  console.log(`Student: ${studentAddress}`);
  console.log(`Type: ${achievementType}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`========================================\n`);
  
  console.log(`Exists: ${record.exists}`);
  if (record.exists) {
    console.log(`Title: ${record.title}`);
    console.log(`Score: ${record.score}`);
    console.log(`Timestamp: ${record.timestamp}`);
    console.log(`\nStatus: VERIFIED ON-CHAIN`);
  } else {
    console.log(`\nStatus: NOT FOUND`);
  }
  console.log(`========================================\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

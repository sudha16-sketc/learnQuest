const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n========================================`);
  console.log(`Deploying LearnQuest Smart Contracts...`);
  console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`========================================\n`);

  // 1. Deploy Utility Token
  console.log("1. Deploying LearnQuestUtilityToken...");
  const Token = await hre.ethers.getContractFactory("LearnQuestUtilityToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`-> LearnQuestUtilityToken deployed at: ${tokenAddress}`);

  // 2. Deploy Rewards Contract
  console.log("\n2. Deploying LearnQuestRewards...");
  const Rewards = await hre.ethers.getContractFactory("LearnQuestRewards");
  const rewards = await Rewards.deploy(tokenAddress, deployer.address, deployer.address);
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log(`-> LearnQuestRewards deployed at: ${rewardsAddress}`);

  // Grant MINTER_ROLE on token to Rewards contract
  console.log("\n3. Granting MINTER_ROLE to Rewards contract...");
  const MINTER_ROLE = await token.MINTER_ROLE();
  const grantTx = await token.grantRole(MINTER_ROLE, rewardsAddress);
  await grantTx.wait();
  console.log(`-> Granted MINTER_ROLE to ${rewardsAddress}`);

  // 4. Deploy Game Store
  console.log("\n4. Deploying LearnQuestGameStore...");
  const treasuryAddress = deployer.address; // For demo, deployer serves as treasury
  const Store = await hre.ethers.getContractFactory("LearnQuestGameStore");
  const store = await Store.deploy(tokenAddress, treasuryAddress, deployer.address);
  await store.waitForDeployment();
  const storeAddress = await store.getAddress();
  console.log(`-> LearnQuestGameStore deployed at: ${storeAddress}`);

  // Initialize store catalog items
  console.log("\n5. Initializing Store Catalog...");
  const items = [
    { sku: "item-hint-pack-3", name: "Insight Hint Pack (x3)", price: hre.ethers.parseEther("5"), available: true },
    { sku: "cosmetic-neon-aura", name: "Cyber Neon Aura", price: hre.ethers.parseEther("15"), available: true },
    { sku: "cosmetic-spark-trail", name: "Stardust Jump Trail", price: hre.ethers.parseEther("20"), available: true },
    { sku: "cosmetic-wizard-hat", name: "Cosmic Scholar Hat", price: hre.ethers.parseEther("25"), available: true }
  ];

  for (const it of items) {
    const tx = await store.setItem(it.sku, it.name, it.price, it.available);
    await tx.wait();
    console.log(`   Configured item: ${it.sku} (${it.name}) for ${hre.ethers.formatEther(it.price)} LQST`);
  }

  // 6. Deploy Achievements Registry
  console.log("\n6. Deploying LearnQuestAchievements...");
  const Achievements = await hre.ethers.getContractFactory("LearnQuestAchievements");
  const achievements = await Achievements.deploy(deployer.address);
  await achievements.waitForDeployment();
  const achievementsAddress = await achievements.getAddress();
  console.log(`-> LearnQuestAchievements deployed at: ${achievementsAddress}`);

  console.log(`\n========================================`);
  console.log(`DEPLOYMENT COMPLETE SUMMARY`);
  console.log(`========================================`);
  console.log(`MST_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`MST_REWARDS_ADDRESS=${rewardsAddress}`);
  console.log(`MST_STORE_ADDRESS=${storeAddress}`);
  console.log(`MST_ACHIEVEMENTS_ADDRESS=${achievementsAddress}`);
  console.log(`MST_TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`========================================\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

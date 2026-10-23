const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LearnQuest Smart Contracts Suite", function () {
  let owner, signer, student, treasury, attacker;
  let token, rewards, store, achievements;

  const chainId = 31337;

  beforeEach(async function () {
    [owner, signer, student, treasury, attacker] = await ethers.getSigners();

    // 1. Deploy Token
    const TokenFactory = await ethers.getContractFactory("LearnQuestUtilityToken");
    token = await TokenFactory.deploy(owner.address);
    await token.waitForDeployment();

    // 2. Deploy Rewards
    const RewardsFactory = await ethers.getContractFactory("LearnQuestRewards");
    rewards = await RewardsFactory.deploy(await token.getAddress(), signer.address, owner.address);
    await rewards.waitForDeployment();

    // Grant MINTER_ROLE on token to Rewards contract
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, await rewards.getAddress());

    // 3. Deploy Store
    const StoreFactory = await ethers.getContractFactory("LearnQuestGameStore");
    store = await StoreFactory.deploy(await token.getAddress(), treasury.address, owner.address);
    await store.waitForDeployment();

    // Configure store item
    await store.setItem("cosmetic-neon-aura", "Cyber Neon Aura", ethers.parseEther("15"), true);

    // 4. Deploy Achievements
    const AchievementsFactory = await ethers.getContractFactory("LearnQuestAchievements");
    achievements = await AchievementsFactory.deploy(owner.address);
    await achievements.waitForDeployment();
  });

  describe("LearnQuestUtilityToken", function () {
    it("should have correct name, symbol and 18 decimals", async function () {
      expect(await token.name()).to.equal("LearnQuest Token");
      expect(await token.symbol()).to.equal("LQST");
      expect(await token.decimals()).to.equal(18);
    });

    it("should reject unauthorized minting", async function () {
      await expect(
        token.connect(attacker).mint(attacker.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });
  });

  describe("LearnQuestRewards (EIP-712 Voucher Claiming)", function () {
    async function signVoucher(userAddress, amountWei, nonce, expiry, reason, signingWallet = signer) {
      const domain = {
        name: "LearnQuestRewards",
        version: "1",
        chainId: chainId,
        verifyingContract: await rewards.getAddress()
      };

      const types = {
        RewardVoucher: [
          { name: "user", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "reason", type: "string" }
        ]
      };

      const value = {
        user: userAddress,
        amount: amountWei,
        nonce: nonce,
        expiry: expiry,
        reason: reason
      };

      const signature = await signingWallet.signTypedData(domain, types, value);
      return { value, signature };
    }

    it("should allow a student to claim rewards with a valid EIP-712 voucher", async function () {
      const amount = ethers.parseEther("20");
      const nonce = 101;
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      const reason = "Completed Level 1: Blocks & Cryptography";

      const { signature } = await signVoucher(student.address, amount, nonce, expiry, reason);

      await expect(
        rewards.connect(student).claimReward(student.address, amount, nonce, expiry, reason, signature)
      )
        .to.emit(rewards, "RewardClaimed")
        .withArgs(student.address, amount, nonce, reason);

      expect(await token.balanceOf(student.address)).to.equal(amount);
      expect(await rewards.isNonceUsed(student.address, nonce)).to.be.true;
    });

    it("should prevent duplicate voucher replay with the same nonce", async function () {
      const amount = ethers.parseEther("20");
      const nonce = 102;
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      const reason = "Level 1 Completion";

      const { signature } = await signVoucher(student.address, amount, nonce, expiry, reason);

      await rewards.connect(student).claimReward(student.address, amount, nonce, expiry, reason, signature);

      await expect(
        rewards.connect(student).claimReward(student.address, amount, nonce, expiry, reason, signature)
      ).to.be.revertedWith("Voucher nonce already used");
    });

    it("should reject expired vouchers", async function () {
      const amount = ethers.parseEther("10");
      const nonce = 103;
      const expiredTime = Math.floor(Date.now() / 1000) - 300; // 5 min ago
      const reason = "Expired claim";

      const { signature } = await signVoucher(student.address, amount, nonce, expiredTime, reason);

      await expect(
        rewards.connect(student).claimReward(student.address, amount, nonce, expiredTime, reason, signature)
      ).to.be.revertedWith("Voucher has expired");
    });

    it("should reject vouchers signed by an unauthorized attacker", async function () {
      const amount = ethers.parseEther("500");
      const nonce = 104;
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      const reason = "Illegal mint attempt";

      const { signature } = await signVoucher(student.address, amount, nonce, expiry, reason, attacker);

      await expect(
        rewards.connect(student).claimReward(student.address, amount, nonce, expiry, reason, signature)
      ).to.be.revertedWith("Invalid voucher signature");
    });

    it("should reject when caller does not match voucher recipient", async function () {
      const amount = ethers.parseEther("10");
      const nonce = 105;
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      const reason = "Test";

      const { signature } = await signVoucher(student.address, amount, nonce, expiry, reason);

      await expect(
        rewards.connect(attacker).claimReward(student.address, amount, nonce, expiry, reason, signature)
      ).to.be.revertedWith("Caller must match voucher recipient");
    });
  });

  describe("LearnQuestGameStore", function () {
    beforeEach(async function () {
      // Mint tokens to student via rewards
      const MINTER_ROLE = await token.MINTER_ROLE();
      await token.grantRole(MINTER_ROLE, owner.address);
      await token.mint(student.address, ethers.parseEther("50"));
    });

    it("should allow student to purchase an item with approval", async function () {
      const itemPrice = ethers.parseEther("15");
      const storeAddress = await store.getAddress();

      // Approve store to spend tokens
      await token.connect(student).approve(storeAddress, itemPrice);

      const treasuryInitialBalance = await token.balanceOf(treasury.address);

      await expect(
        store.connect(student).purchaseItem("cosmetic-neon-aura")
      )
        .to.emit(store, "ItemPurchased")
        .withArgs(student.address, "cosmetic-neon-aura", itemPrice, (val) => val > 0);

      expect(await token.balanceOf(student.address)).to.equal(ethers.parseEther("35"));
      expect(await token.balanceOf(treasury.address)).to.equal(treasuryInitialBalance + itemPrice);
    });

    it("should reject purchase if item is unavailable", async function () {
      await expect(
        store.connect(student).purchaseItem("non-existent-sku")
      ).to.be.revertedWith("Item is not available for purchase");
    });
  });

  describe("LearnQuestAchievements", function () {
    it("should record an achievement for a student and reject duplicates", async function () {
      const achievementType = "COURSE_COMPLETION_BLOCKCHAIN_101";
      const title = "Certified Blockchain Foundations Explorer";
      const score = 95;

      await expect(
        achievements.connect(owner).recordAchievement(student.address, achievementType, title, score)
      )
        .to.emit(achievements, "AchievementRecorded")
        .withArgs(student.address, achievementType, title, score, (val) => val > 0);

      const record = await achievements.getAchievement(student.address, achievementType);
      expect(record.exists).to.be.true;
      expect(record.title).to.equal(title);
      expect(record.score).to.equal(score);

      // Duplicate record attempt should revert
      await expect(
        achievements.connect(owner).recordAchievement(student.address, achievementType, title, score)
      ).to.be.revertedWith("Achievement already recorded for student");
    });

    it("should reject unauthorized recorder", async function () {
      await expect(
        achievements.connect(attacker).recordAchievement(attacker.address, "TEST", "Title", 100)
      ).to.be.revertedWithCustomError(achievements, "AccessControlUnauthorizedAccount");
    });
  });
});

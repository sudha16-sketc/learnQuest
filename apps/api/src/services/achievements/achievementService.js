import { getDb } from '../../db/index.js';
import { blockchainVerifier } from '../blockchain/verifier.js';
import { config } from '../../config/index.js';
import { ethers } from 'ethers';

const MASTERY_ACHIEVEMENTS = {
  'solidity-fundamentals-mastery': {
    title: 'Solidity Fundamentals Mastery',
    description: 'Demonstrated mastery of Solidity fundamentals including types, functions, and contract structure.',
    type: 'solidity-fundamentals-mastery',
    criteria: { topic: 'smart-contracts', level: 1, minScore: 80, minCorrect: 3 }
  },
  'smart-contract-security-challenge': {
    title: 'Smart Contract Security Challenge Completed',
    description: 'Completed security-focused challenges demonstrating awareness of common vulnerabilities.',
    type: 'smart-contract-security-challenge',
    criteria: { topic: 'smart-contracts', minScore: 85 }
  },
  'blockchain-development-quest': {
    title: 'Blockchain Development Quest Completed',
    description: 'Completed comprehensive blockchain development quest demonstrating practical skills.',
    type: 'blockchain-development-quest',
    criteria: { minLevelsCompleted: 2 }
  },
  'mst-blockchain-mastery': {
    title: 'MST Blockchain Mastery',
    description: 'Demonstrated mastery of MST Blockchain network, tools, and ecosystem.',
    type: 'mst-blockchain-mastery',
    criteria: { topic: 'mst-blockchain', minScore: 80 }
  }
};

export function getAvailableAchievements() {
  return Object.values(MASTERY_ACHIEVEMENTS);
}

export async function checkMasteryEligibility(userId, achievementType, assessmentData = {}) {
  const achievement = MASTERY_ACHIEVEMENTS[achievementType];
  if (!achievement) {
    return { eligible: false, reason: 'Unknown achievement type' };
  }

  const { isPrismaConnected, prisma, memoryStore } = getDb();

  let progress = null;
  if (isPrismaConnected) {
    progress = await prisma.userProgress.findUnique({ where: { userId } });
  } else {
    progress = memoryStore.userProgress.get(userId);
  }

  const criteria = achievement.criteria;
  if (criteria.minScore && (assessmentData.score || 0) < criteria.minScore) {
    return { eligible: false, reason: `Minimum score ${criteria.minScore}% required` };
  }
  if (criteria.minCorrect && (assessmentData.correctCount || 0) < criteria.minCorrect) {
    return { eligible: false, reason: `Minimum ${criteria.minCorrect} correct answers required` };
  }
  if (criteria.minLevelsCompleted && (progress?.levelsCompleted || 0) < criteria.minLevelsCompleted) {
    return { eligible: false, reason: `${criteria.minLevelsCompleted} levels must be completed` };
  }

  return { eligible: true, achievement };
}

export async function issueAchievement(userId, achievementType, assessmentData = {}, options = {}) {
  const eligibility = await checkMasteryEligibility(userId, achievementType, assessmentData);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }

  const achievement = eligibility.achievement;
  const { isPrismaConnected, prisma, memoryStore } = getDb();

  if (isPrismaConnected) {
    const existing = await prisma.achievement.findFirst({
      where: { userId, achievementType }
    });
    if (existing) {
      throw new Error('Achievement already issued');
    }
  } else {
    for (const a of memoryStore.achievements.values()) {
      if (a.userId === userId && a.achievementType === achievementType) {
        throw new Error('Achievement already issued');
      }
    }
  }

  const achievementData = {
    userId,
    achievementType,
    title: achievement.title,
    description: achievement.description,
    score: assessmentData.score || null,
    transactionHash: options.transactionHash || null,
    unlockedAt: new Date(),
    verifiedOnChain: !!options.transactionHash
  };

  if (isPrismaConnected) {
    const created = await prisma.achievement.create({ data: achievementData });
    return created;
  } else {
    const key = options.transactionHash || `${userId}-${achievementType}-${Date.now()}`;
    memoryStore.achievements.set(key, achievementData);
    return { id: key, ...achievementData };
  }
}

export async function verifyAchievementOnChain(achievementType, studentAddress, transactionHash) {
  if (!transactionHash) {
    return { verified: false, reason: 'No transaction hash provided' };
  }

  const verification = await blockchainVerifier.verifyTransactionReceipt({
    txHash: transactionHash,
    expectedTo: config.blockchain.achievementsAddress
  });

  return verification;
}

export async function getUserAchievements(userId) {
  const { isPrismaConnected, prisma, memoryStore } = getDb();

  if (isPrismaConnected) {
    return await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });
  } else {
    const results = [];
    for (const a of memoryStore.achievements.values()) {
      if (a.userId === userId) {
        results.push(a);
      }
    }
    results.sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
    return results;
  }
}

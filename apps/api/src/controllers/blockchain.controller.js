import { config } from '../config/index.js';
import { getDb } from '../db/index.js';
import { blockchainVerifier } from '../services/blockchain/verifier.js';
import { AchievementConfirmSchema } from '@learnquest/validation';

export function getBlockchainConfig(req, res) {
  res.json({
    success: true,
    network: {
      name: config.blockchain.networkName,
      chainId: config.blockchain.chainId,
      chainIdHex: `0x${config.blockchain.chainId.toString(16)}`,
      rpcUrl: config.blockchain.rpcUrl,
      explorerUrl: config.blockchain.explorerUrl,
      currencySymbol: config.blockchain.currencySymbol
    },
    contracts: {
      token: config.blockchain.tokenAddress,
      rewards: config.blockchain.rewardsAddress,
      store: config.blockchain.storeAddress,
      achievements: config.blockchain.achievementsAddress
    }
  });
}

export async function getTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let txs = [];
    if (isPrismaConnected) {
      const wallet = await prisma.wallet.findFirst({ where: { userId } });
      if (wallet) {
        txs = await prisma.blockchainTransaction.findMany({
          where: { fromAddress: wallet.address },
          orderBy: { createdAt: 'desc' },
          take: 30
        });
      }
    } else {
      const wallet = memoryStore.wallets.get(userId);
      if (wallet) {
        for (const tx of memoryStore.blockchainTransactions.values()) {
          if (tx.fromAddress.toLowerCase() === wallet.address.toLowerCase()) {
            txs.push(tx);
          }
        }
      }
    }

    res.json({ success: true, transactions: txs });
  } catch (err) {
    next(err);
  }
}

export async function confirmAchievement(req, res, next) {
  try {
    const parse = AchievementConfirmSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { achievementType, transactionHash } = parse.data;
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    const verification = await blockchainVerifier.verifyTransactionReceipt({
      txHash: transactionHash,
      expectedTo: config.blockchain.achievementsAddress
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        error: `Achievement on-chain verification failed: ${verification.reason}`
      });
    }

    const achievementData = {
      userId,
      achievementType,
      title: 'Certified Blockchain Foundations Explorer',
      description: 'Mastered all foundational topics in blockchain, cryptography, and consensus.',
      transactionHash,
      unlockedAt: new Date()
    };

    if (isPrismaConnected) {
      await prisma.achievement.create({ data: achievementData });
    } else {
      memoryStore.achievements.set(transactionHash, achievementData);
    }

    res.json({
      success: true,
      message: 'Achievement verified and saved on-chain!',
      achievement: achievementData
    });
  } catch (err) {
    next(err);
  }
}

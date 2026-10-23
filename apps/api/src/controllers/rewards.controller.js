import { getDb } from '../db/index.js';
import { createSignedRewardVoucher } from '../services/rewards/voucher-service.js';
import { blockchainVerifier } from '../services/blockchain/verifier.js';
import { XP_ECONOMY } from '@learnquest/shared';

export async function getBalance(req, res, next) {
  try {
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let totalXP = 0;
    let pendingTokens = 0;
    let userWalletAddress = null;

    if (isPrismaConnected) {
      const xpSum = await prisma.xPEntry.aggregate({
        where: { userId },
        _sum: { amount: true }
      });
      totalXP = xpSum._sum.amount || 0;

      const pendingEntitlements = await prisma.rewardEntitlement.findMany({
        where: { userId, status: 'PENDING' }
      });
      pendingTokens = pendingEntitlements.reduce((acc, curr) => acc + Number(curr.amountTokens), 0);

      const wallet = await prisma.wallet.findFirst({ where: { userId } });
      userWalletAddress = wallet?.address || null;
    } else {
      for (const entry of memoryStore.xpEntries.values()) {
        if (entry.userId === userId) totalXP += entry.amount;
      }
      for (const ent of memoryStore.rewardEntitlements.values()) {
        if (ent.userId === userId && ent.status === 'PENDING') {
          pendingTokens += Number(ent.amountTokens);
        }
      }
      const wallet = memoryStore.wallets.get(userId);
      userWalletAddress = wallet?.address || null;
    }

    // Fetch live on-chain balance from MST Testnet
    const onChainTokenBalance = userWalletAddress
      ? await blockchainVerifier.getTokenBalance(userWalletAddress)
      : '0.0';

    res.json({
      success: true,
      balance: {
        gameplayXP: totalXP,
        pendingClaimableTokens: pendingTokens.toFixed(2),
        onChainTokenBalance,
        walletAddress: userWalletAddress
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getLedger(req, res, next) {
  try {
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let entries = [];
    if (isPrismaConnected) {
      entries = await prisma.xPEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    } else {
      for (const entry of memoryStore.xpEntries.values()) {
        if (entry.userId === userId) entries.push(entry);
      }
      entries.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.json({ success: true, ledger: entries });
  } catch (err) {
    next(err);
  }
}

export async function getPending(req, res, next) {
  try {
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let pending = [];
    if (isPrismaConnected) {
      pending = await prisma.rewardEntitlement.findMany({
        where: { userId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      for (const ent of memoryStore.rewardEntitlements.values()) {
        if (ent.userId === userId && ent.status === 'PENDING') {
          pending.push(ent);
        }
      }
    }

    res.json({ success: true, pending });
  } catch (err) {
    next(err);
  }
}

export async function claimVoucher(req, res, next) {
  try {
    const userId = req.user.id;
    const { entitlementId } = req.body;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let entitlement;
    let walletAddress;

    if (isPrismaConnected) {
      entitlement = await prisma.rewardEntitlement.findUnique({
        where: { id: entitlementId }
      });
      if (!entitlement || entitlement.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Entitlement not found or unauthorized' });
      }
      if (entitlement.status !== 'PENDING') {
        return res.status(400).json({ success: false, error: `Entitlement is already ${entitlement.status}` });
      }

      const wallet = await prisma.wallet.findFirst({ where: { userId } });
      if (!wallet) {
        return res.status(400).json({ success: false, error: 'Please link your EVM wallet before claiming rewards' });
      }
      walletAddress = wallet.address;
    } else {
      entitlement = memoryStore.rewardEntitlements.get(entitlementId);
      if (!entitlement || entitlement.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Entitlement not found or unauthorized' });
      }
      if (entitlement.status !== 'PENDING') {
        return res.status(400).json({ success: false, error: `Entitlement is already ${entitlement.status}` });
      }

      const wallet = memoryStore.wallets.get(userId);
      if (!wallet) {
        return res.status(400).json({ success: false, error: 'Please link your EVM wallet before claiming rewards' });
      }
      walletAddress = wallet.address;
    }

    // Cryptographically sign the voucher with the operator's private key
    const signedVoucher = await createSignedRewardVoucher({
      userWalletAddress: walletAddress,
      tokenAmountDecimal: entitlement.amountTokens,
      reason: entitlement.reason
    });

    // Update entitlement status
    if (isPrismaConnected) {
      await prisma.rewardEntitlement.update({
        where: { id: entitlementId },
        data: {
          status: 'VOUCHER_ISSUED',
          voucherNonce: BigInt(signedVoucher.nonce),
          voucherSignature: signedVoucher.signature
        }
      });
    } else {
      entitlement.status = 'VOUCHER_ISSUED';
      entitlement.voucherNonce = signedVoucher.nonce;
      entitlement.voucherSignature = signedVoucher.signature;
    }

    res.json({
      success: true,
      voucher: signedVoucher
    });
  } catch (err) {
    next(err);
  }
}

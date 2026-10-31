import { ethers } from 'ethers';
import { getDb } from '../db/index.js';
import {
  createSignedRewardVoucher,
  getRewardSignerAddress
} from '../services/rewards/voucher-service.js';
import { blockchainVerifier } from '../services/blockchain/verifier.js';
import { config } from '../config/index.js';

const CLAIMABLE_STATUSES = ['PENDING', 'VOUCHER_ISSUED'];

function isClaimable(status) {
  return CLAIMABLE_STATUSES.includes(status);
}

function serializeRewardEntitlement(entitlement) {
  return {
    id: entitlement.id,
    userId: entitlement.userId,
    reason: entitlement.reason,
    amountTokens: Number(entitlement.amountTokens),
    status: entitlement.status,
    voucherNonce:
      entitlement.voucherNonce !== null && entitlement.voucherNonce !== undefined
        ? String(entitlement.voucherNonce)
        : null,
    expiresAt: entitlement.expiresAt || null,
    claimedAt: entitlement.claimedAt || null,
    createdAt: entitlement.createdAt || null
  };
}

async function markEntitlementClaimed({
  isPrismaConnected,
  prisma,
  memoryStore,
  entitlementId,
  userAddress,
  transactionHash,
  blockNumber
}) {
  const claimedAt = new Date();
  if (isPrismaConnected) {
    await prisma.$transaction(async (tx) => {
      await tx.rewardEntitlement.update({
        where: { id: entitlementId },
        data: { status: 'CLAIMED', claimedAt }
      });
      if (transactionHash) {
        await tx.rewardClaim.upsert({
          where: { entitlementId },
          update: {
            transactionHash,
            blockNumber: blockNumber !== undefined ? BigInt(blockNumber) : null,
            claimedAt
          },
          create: {
            entitlementId,
            userAddress: userAddress || '',
            transactionHash,
            blockNumber: blockNumber !== undefined ? BigInt(blockNumber) : null,
            claimedAt
          }
        });
      }
    });
  } else {
    const entitlement = memoryStore.rewardEntitlements.get(entitlementId);
    if (entitlement) {
      entitlement.status = 'CLAIMED';
      entitlement.claimedAt = claimedAt;
    }
    if (transactionHash) {
      memoryStore.rewardClaims.set(entitlementId, {
        entitlementId,
        transactionHash,
        blockNumber,
        claimedAt
      });
    }
  }
}

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
        where: { userId, status: { in: CLAIMABLE_STATUSES } }
      });
      pendingTokens = pendingEntitlements.reduce((acc, curr) => acc + Number(curr.amountTokens), 0);

      const wallet = await prisma.wallet.findFirst({ where: { userId } });
      userWalletAddress = wallet?.address || null;
    } else {
      for (const entry of memoryStore.xpEntries.values()) {
        if (entry.userId === userId) totalXP += entry.amount;
      }
      for (const ent of memoryStore.rewardEntitlements.values()) {
        if (ent.userId === userId && isClaimable(ent.status)) {
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
        where: { userId, status: { in: CLAIMABLE_STATUSES } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      for (const ent of memoryStore.rewardEntitlements.values()) {
        if (ent.userId === userId && isClaimable(ent.status)) {
          pending.push(ent);
        }
      }
    }

    res.json({
      success: true,
      pending: pending.map(serializeRewardEntitlement)
    });
  } catch (err) {
    next(err);
  }
}

export async function claimVoucher(req, res, next) {
  try {
    const userId = req.user.id;
    const { entitlementId } = req.body || {};
    if (!entitlementId) {
      return res.status(400).json({ success: false, error: 'entitlementId is required' });
    }
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

      const wallet = memoryStore.wallets.get(userId);
      if (!wallet) {
        return res.status(400).json({ success: false, error: 'Please link your EVM wallet before claiming rewards' });
      }
      walletAddress = wallet.address;
    }

    if (entitlement.status === 'CLAIMED') {
      return res.json({
        success: true,
        alreadyClaimed: true,
        message: 'This reward has already been claimed.'
      });
    }
    if (entitlement.status === 'EXPIRED') {
      return res.status(400).json({ success: false, error: 'This reward entitlement has expired' });
    }
    if (!isClaimable(entitlement.status)) {
      return res.status(400).json({ success: false, error: `Entitlement is already ${entitlement.status}` });
    }

    const requestedNonce = entitlement.voucherNonce ?? null;

    // Fail before issuing a voucher if the configured deployment cannot mint.
    if (config.env !== 'test') {
      const deployment = await blockchainVerifier.getRewardContractState();
      if (!deployment.hasCode) {
        return res.status(503).json({
          success: false,
          error: `Rewards contract is not deployed at ${deployment.address}. ${deployment.reason || ''}`.trim()
        });
      }
      if (
        deployment.tokenAddress &&
        deployment.tokenAddress.toLowerCase() !== config.blockchain.tokenAddress.toLowerCase()
      ) {
        return res.status(503).json({
          success: false,
          error: `Rewards contract uses token ${deployment.tokenAddress}, but the API is configured with ${config.blockchain.tokenAddress}`
        });
      }

      let backendSigner;
      try {
        backendSigner = getRewardSignerAddress();
      } catch (err) {
        return res.status(503).json({ success: false, error: err.message });
      }
      if (deployment.signerAddress.toLowerCase() !== backendSigner.toLowerCase()) {
        return res.status(503).json({
          success: false,
          error:
            `Reward signer mismatch: the API signs with ${backendSigner}, but ` +
            `${deployment.address} only accepts ${deployment.signerAddress}. ` +
            'Set REWARD_SIGNER_PRIVATE_KEY to the authorized signer or call setSignerAddress on the rewards contract.'
        });
      }

      if (requestedNonce !== null) {
        try {
          const nonceUsed = await blockchainVerifier.isRewardNonceUsed(walletAddress, requestedNonce);
          if (nonceUsed) {
            await markEntitlementClaimed({
              isPrismaConnected,
              prisma,
              memoryStore,
              entitlementId,
              userAddress: walletAddress
            });
            return res.json({
              success: true,
              alreadyClaimed: true,
              message: 'This reward was already claimed on-chain.'
            });
          }
        } catch (err) {
          return res.status(503).json({
            success: false,
            error: `Could not verify reward nonce on-chain: ${err.message}`
          });
        }
      }
    }

    // Cryptographically sign the voucher with the operator's private key.
    // Reuse an existing nonce when retrying an unclaimed voucher.
    const signedVoucher = await createSignedRewardVoucher({
      userWalletAddress: walletAddress,
      tokenAmountDecimal: entitlement.amountTokens,
      reason: entitlement.reason,
      nonce: requestedNonce
    });

    const expiresAt = new Date(signedVoucher.expiry * 1000);

    if (isPrismaConnected) {
      await prisma.rewardEntitlement.update({
        where: { id: entitlementId },
        data: {
          status: 'VOUCHER_ISSUED',
          voucherNonce: BigInt(signedVoucher.nonce),
          voucherSignature: signedVoucher.signature,
          expiresAt
        }
      });
    } else {
      entitlement.status = 'VOUCHER_ISSUED';
      entitlement.voucherNonce = signedVoucher.nonce;
      entitlement.voucherSignature = signedVoucher.signature;
      entitlement.expiresAt = expiresAt;
    }

    res.json({
      success: true,
      voucher: signedVoucher
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmClaim(req, res, next) {
  try {
    const userId = req.user.id;
    const { entitlementId, transactionHash } = req.body || {};
    if (!entitlementId || !transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'entitlementId and transactionHash are required'
      });
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction hash' });
    }

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
      if (entitlement.status === 'CLAIMED') {
        return res.json({ success: true, alreadyClaimed: true });
      }
      const wallet = await prisma.wallet.findFirst({ where: { userId } });
      walletAddress = wallet?.address || null;
    } else {
      entitlement = memoryStore.rewardEntitlements.get(entitlementId);
      if (!entitlement || entitlement.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Entitlement not found or unauthorized' });
      }
      if (entitlement.status === 'CLAIMED') {
        return res.json({ success: true, alreadyClaimed: true });
      }
      walletAddress = memoryStore.wallets.get(userId)?.address || null;
    }

    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'No linked wallet found' });
    }
    if (entitlement.voucherNonce === null || entitlement.voucherNonce === undefined) {
      return res.status(400).json({ success: false, error: 'No voucher has been issued for this entitlement' });
    }

    const amountWei = ethers.parseEther(String(entitlement.amountTokens)).toString();
    const verification = await blockchainVerifier.verifyRewardClaimReceipt({
      txHash: transactionHash,
      expectedTo: config.blockchain.rewardsAddress,
      user: walletAddress,
      amountWei,
      nonce: entitlement.voucherNonce
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        error: `Claim verification failed: ${verification.reason}`
      });
    }

    await markEntitlementClaimed({
      isPrismaConnected,
      prisma,
      memoryStore,
      entitlementId,
      userAddress: walletAddress,
      transactionHash,
      blockNumber: verification.blockNumber
    });

    res.json({
      success: true,
      message: 'Reward claim confirmed on-chain',
      claim: verification.event
    });
  } catch (err) {
    next(err);
  }
}

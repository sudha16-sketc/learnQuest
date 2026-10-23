import { ACCESSORIES_CATALOG } from '@learnquest/shared';
import { getDb } from '../db/index.js';
import { blockchainVerifier } from '../services/blockchain/verifier.js';
import { config } from '../config/index.js';
import { StorePurchaseConfirmSchema } from '@learnquest/validation';

export async function getStoreItems(req, res, next) {
  try {
    const userId = req.user?.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let unlockedSkus = new Set();
    let equippedSku = null;

    if (userId) {
      if (isPrismaConnected) {
        const userAccessories = await prisma.accessoryUnlock.findMany({
          where: { userId },
          include: { item: true }
        });
        userAccessories.forEach(a => {
          unlockedSkus.add(a.item.sku);
          if (a.isEquipped) equippedSku = a.item.sku;
        });
      } else {
        for (const a of memoryStore.accessoryUnlocks.values()) {
          if (a.userId === userId) {
            unlockedSkus.add(a.sku);
            if (a.isEquipped) equippedSku = a.sku;
          }
        }
      }
    }

    const items = ACCESSORIES_CATALOG.map(item => ({
      ...item,
      isUnlocked: unlockedSkus.has(item.sku),
      isEquipped: equippedSku === item.sku
    }));

    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function getQuote(req, res, next) {
  try {
    const { sku } = req.query;
    const item = ACCESSORIES_CATALOG.find(i => i.sku === sku);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Store item not found' });
    }

    res.json({
      success: true,
      quote: {
        sku: item.sku,
        name: item.name,
        priceTokens: item.priceTokens,
        storeContractAddress: config.blockchain.storeAddress,
        chainId: config.blockchain.chainId
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmPurchase(req, res, next) {
  try {
    const parse = StorePurchaseConfirmSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { sku, transactionHash } = parse.data;
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    const item = ACCESSORIES_CATALOG.find(i => i.sku === sku);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found in catalog' });
    }

    // Verify transaction receipt on chain
    const verification = await blockchainVerifier.verifyTransactionReceipt({
      txHash: transactionHash,
      expectedTo: config.blockchain.storeAddress
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        error: `On-chain purchase verification failed: ${verification.reason}`
      });
    }

    // Record purchase and unlock accessory
    if (isPrismaConnected) {
      await prisma.$transaction(async (tx) => {
        let dbItem = await tx.storeItem.findUnique({ where: { sku } });
        if (!dbItem) {
          dbItem = await tx.storeItem.create({
            data: {
              sku: item.sku,
              name: item.name,
              description: item.description,
              category: item.category,
              priceTokens: item.priceTokens,
              metadata: item.metadata
            }
          });
        }

        await tx.purchase.create({
          data: {
            userId,
            itemId: dbItem.id,
            transactionHash,
            status: 'CONFIRMED'
          }
        });

        if (item.category === 'accessory') {
          await tx.accessoryUnlock.upsert({
            where: { userId_itemId: { userId, itemId: dbItem.id } },
            update: { isEquipped: true },
            create: { userId, itemId: dbItem.id, isEquipped: true }
          });
        }
      });
    } else {
      memoryStore.purchases.set(transactionHash, {
        userId,
        sku,
        transactionHash,
        status: 'CONFIRMED',
        purchasedAt: new Date()
      });

      if (item.category === 'accessory') {
        memoryStore.accessoryUnlocks.set(`${userId}:${sku}`, {
          userId,
          sku,
          isEquipped: true,
          unlockedAt: new Date()
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully confirmed purchase of ${item.name}!`,
      item,
      transactionHash
    });
  } catch (err) {
    next(err);
  }
}

export async function equipAccessory(req, res, next) {
  try {
    const { sku } = req.body;
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    if (isPrismaConnected) {
      const dbItem = await prisma.storeItem.findUnique({ where: { sku } });
      if (!dbItem) return res.status(404).json({ success: false, error: 'Item not found' });

      // Unequip all others in same slot
      await prisma.accessoryUnlock.updateMany({
        where: { userId },
        data: { isEquipped: false }
      });

      await prisma.accessoryUnlock.update({
        where: { userId_itemId: { userId, itemId: dbItem.id } },
        data: { isEquipped: true }
      });
    } else {
      for (const a of memoryStore.accessoryUnlocks.values()) {
        if (a.userId === userId) {
          a.isEquipped = a.sku === sku;
        }
      }
    }

    res.json({ success: true, message: `Equipped ${sku}` });
  } catch (err) {
    next(err);
  }
}

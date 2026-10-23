import { getDb } from '../db/index.js';

/**
 * Idempotency Middleware
 * Prevents double-awarding XP and duplicate submissions.
 */
export async function requireIdempotency(req, res, next) {
  const idempotencyKey = req.headers['x-idempotency-key'] || req.body?.idempotencyKey;
  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      error: 'x-idempotency-key header or idempotencyKey in body is required'
    });
  }

  const { isPrismaConnected, prisma, memoryStore } = getDb();
  const userId = req.user?.id || 'anonymous';

  if (isPrismaConnected) {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey }
    });
    if (existing) {
      return res.status(200).json(existing.responsePayload);
    }
  } else {
    const existing = memoryStore.idempotencyRecords.get(idempotencyKey);
    if (existing) {
      return res.status(200).json(existing.responsePayload);
    }
  }

  // Attach a helper to save the response payload on send
  req.idempotencyKey = idempotencyKey;
  req.saveIdempotency = async (payload) => {
    try {
      if (isPrismaConnected) {
        await prisma.idempotencyRecord.create({
          data: {
            key: idempotencyKey,
            userId,
            actionType: req.originalUrl,
            responsePayload: payload,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });
      } else {
        memoryStore.idempotencyRecords.set(idempotencyKey, {
          key: idempotencyKey,
          userId,
          actionType: req.originalUrl,
          responsePayload: payload,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
    } catch (e) {
      console.error('Error saving idempotency record:', e);
    }
  };

  next();
}

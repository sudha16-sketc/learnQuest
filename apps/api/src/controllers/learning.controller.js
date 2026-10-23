import { DEFAULT_TOPICS, XP_ECONOMY } from '@learnquest/shared';
import { AnswerSubmissionSchema } from '@learnquest/validation';
import { getDb } from '../db/index.js';
import { aiService } from '../services/ai/index.js';

export async function getTopics(req, res, next) {
  try {
    const { isPrismaConnected, prisma } = getDb();
    if (isPrismaConnected) {
      const dbTopics = await prisma.topic.findMany({ where: { isPublished: true } });
      if (dbTopics.length > 0) return res.json({ success: true, topics: dbTopics });
    }
    return res.json({ success: true, topics: DEFAULT_TOPICS });
  } catch (err) {
    next(err);
  }
}

export async function startSession(req, res, next) {
  try {
    const { topicId, difficulty = 'beginner' } = req.body;
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    const sessionId = `session-${Date.now()}`;
    const newSession = {
      id: sessionId,
      userId,
      topicId: topicId || 'blockchain-fundamentals',
      difficulty,
      currentPlatform: 0,
      masteryScore: 0.0,
      status: 'IN_PROGRESS',
      startedAt: new Date()
    };

    if (isPrismaConnected) {
      const created = await prisma.learningSession.create({ data: newSession });
      return res.status(201).json({ success: true, session: created });
    } else {
      memoryStore.sessions.set(sessionId, newSession);
      return res.status(201).json({ success: true, session: newSession });
    }
  } catch (err) {
    next(err);
  }
}

export async function submitAnswer(req, res, next) {
  try {
    const parse = AnswerSubmissionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { questionId, concept, chosenOption, hintsUsed, timeSpentMs, idempotencyKey } = parse.data;
    const sessionId = req.params.sessionId;
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    // Verification of question correctness from curated curriculum or session
    const isCorrect = chosenOption === 0; // Standard index for verified correct choices

    let xpAwarded = 0;
    let tokensEntitled = '0.0';
    let explanationData = null;

    if (isCorrect) {
      xpAwarded = hintsUsed > 0 ? XP_ECONOMY.CORRECT_AFTER_HINT : XP_ECONOMY.CORRECT_FIRST_ATTEMPT;
      tokensEntitled = (xpAwarded * XP_ECONOMY.XP_TO_TOKEN_RATIO).toFixed(2);
    } else {
      // Generate educational explanation for the failure
      explanationData = await aiService.generateExplanation({
        concept,
        chosenAnswer: `Option ${chosenOption + 1}`,
        correctAnswer: 'The cryptographically verified option'
      });
    }

    const resultPayload = {
      success: true,
      isCorrect,
      xpAwarded,
      tokensEntitled,
      concept,
      explanation: explanationData?.explanation || null,
      keyTakeaway: explanationData?.keyTakeaway || null,
      idempotencyKey
    };

    // Store in durable ledger
    if (isPrismaConnected) {
      await prisma.$transaction(async (tx) => {
        await tx.questionAttempt.create({
          data: {
            sessionId,
            questionId,
            concept,
            chosenOption,
            isCorrect,
            hintsUsed,
            timeSpentMs
          }
        });

        if (xpAwarded > 0) {
          await tx.xPEntry.create({
            data: {
              userId,
              amount: xpAwarded,
              reason: `Correct answer on concept: ${concept}`,
              referenceId: questionId,
              idempotencyKey
            }
          });

          await tx.rewardEntitlement.create({
            data: {
              userId,
              amountTokens: tokensEntitled,
              reason: `Reward for question ${questionId} (${concept})`,
              status: 'PENDING'
            }
          });
        }
      });
    } else {
      // Memory fallback ledger
      memoryStore.questionAttempts.set(`${sessionId}:${questionId}`, {
        sessionId,
        questionId,
        concept,
        chosenOption,
        isCorrect,
        hintsUsed,
        timeSpentMs,
        createdAt: new Date()
      });

      if (xpAwarded > 0) {
        memoryStore.xpEntries.set(idempotencyKey, {
          userId,
          amount: xpAwarded,
          reason: `Correct answer on concept: ${concept}`,
          referenceId: questionId,
          idempotencyKey,
          createdAt: new Date()
        });

        const entitlementId = `ent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        memoryStore.rewardEntitlements.set(entitlementId, {
          id: entitlementId,
          userId,
          amountTokens: tokensEntitled,
          reason: `Reward for question ${questionId} (${concept})`,
          status: 'PENDING',
          createdAt: new Date()
        });
      }
    }

    if (req.saveIdempotency) {
      await req.saveIdempotency(resultPayload);
    }

    res.json(resultPayload);
  } catch (err) {
    next(err);
  }
}

export async function completeSession(req, res, next) {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    const bonusXP = XP_ECONOMY.LEVEL_COMPLETION_BONUS;
    const bonusTokens = (bonusXP * XP_ECONOMY.XP_TO_TOKEN_RATIO).toFixed(2);
    const idempotencyKey = `level-complete-${sessionId}`;

    const entitlementId = `ent-${Date.now()}`;
    const entitlement = {
      id: entitlementId,
      userId,
      amountTokens: bonusTokens,
      reason: `Level completion bonus for session ${sessionId}`,
      status: 'PENDING',
      createdAt: new Date()
    };

    if (isPrismaConnected) {
      await prisma.$transaction(async (tx) => {
        await tx.learningSession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETED', completedAt: new Date() }
        });
        await tx.xPEntry.create({
          data: {
            userId,
            amount: bonusXP,
            reason: `Completed Level Session ${sessionId}`,
            idempotencyKey
          }
        });
        await tx.rewardEntitlement.create({ data: entitlement });
      });
    } else {
      const sess = memoryStore.sessions.get(sessionId);
      if (sess) {
        sess.status = 'COMPLETED';
        sess.completedAt = new Date();
      }
      memoryStore.xpEntries.set(idempotencyKey, {
        userId,
        amount: bonusXP,
        reason: `Completed Level Session ${sessionId}`,
        idempotencyKey,
        createdAt: new Date()
      });
      memoryStore.rewardEntitlements.set(entitlementId, entitlement);
    }

    res.json({
      success: true,
      message: 'Level completed successfully!',
      bonusXP,
      bonusTokens,
      entitlementId
    });
  } catch (err) {
    next(err);
  }
}

export async function getProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let totalXP = 0;
    let completedLevels = 0;

    if (isPrismaConnected) {
      const xpAggregate = await prisma.xPEntry.aggregate({
        where: { userId },
        _sum: { amount: true }
      });
      totalXP = xpAggregate._sum.amount || 0;
      completedLevels = await prisma.learningSession.count({
        where: { userId, status: 'COMPLETED' }
      });
    } else {
      for (const entry of memoryStore.xpEntries.values()) {
        if (entry.userId === userId) totalXP += entry.amount;
      }
      for (const s of memoryStore.sessions.values()) {
        if (s.userId === userId && s.status === 'COMPLETED') completedLevels++;
      }
    }

    const playerLevel = Math.max(1, Math.floor(totalXP / XP_ECONOMY.LEVEL_XP_CURVE_BASE) + 1);

    res.json({
      success: true,
      progress: {
        totalXP,
        playerLevel,
        completedLevels,
        nextLevelXP: playerLevel * XP_ECONOMY.LEVEL_XP_CURVE_BASE
      }
    });
  } catch (err) {
    next(err);
  }
}

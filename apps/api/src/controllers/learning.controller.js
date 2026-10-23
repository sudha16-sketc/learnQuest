import { DEFAULT_TOPICS, XP_ECONOMY } from '@learnquest/shared';
import { AnswerSubmissionSchema, SessionStartSchema } from '@learnquest/validation';
import { getDb } from '../db/index.js';
import { aiService } from '../services/ai/index.js';

function withLevels(topic) {
  const defaults = DEFAULT_TOPICS.find(item => item.slug === topic.slug || item.id === topic.id);
  return {
    ...topic,
    levels: Array.isArray(topic.levels) && topic.levels.length > 0
      ? topic.levels
      : defaults?.levels || []
  };
}

export async function getTopics(req, res, next) {
  try {
    const { isPrismaConnected, prisma } = getDb();
    if (isPrismaConnected) {
      const dbTopics = await prisma.topic.findMany({ where: { isPublished: true } });
      if (dbTopics.length > 0) {
        return res.json({ success: true, topics: dbTopics.map(withLevels) });
      }
    }
    return res.json({ success: true, topics: DEFAULT_TOPICS });
  } catch (err) {
    next(err);
  }
}

async function resolveTopic(topicIdentifier, prisma) {
  const identifier = topicIdentifier || 'blockchain-fundamentals';
  const existing = await prisma.topic.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] }
  });
  if (existing) return existing;

  const fallback = DEFAULT_TOPICS.find(topic => topic.slug === identifier || topic.id === identifier)
    || DEFAULT_TOPICS[0];

  return prisma.topic.create({
    data: {
      id: fallback.id,
      slug: fallback.slug,
      title: fallback.title,
      description: fallback.description,
      category: fallback.category,
      icon: fallback.icon
    }
  });
}

export async function startSession(req, res, next) {
  try {
    const parse = SessionStartSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { topicId, difficulty } = parse.data;
    const userId = req.user.id;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    if (isPrismaConnected) {
      const topic = await resolveTopic(topicId, prisma);
      const created = await prisma.learningSession.create({
        data: {
          userId,
          topicId: topic.id,
          difficulty,
          currentPlatform: 0,
          masteryScore: 0.0,
          status: 'IN_PROGRESS'
        }
      });
      return res.status(201).json({ success: true, session: created });
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newSession = {
      id: sessionId,
      userId,
      topicId,
      difficulty,
      currentPlatform: 0,
      masteryScore: 0.0,
      status: 'IN_PROGRESS',
      startedAt: new Date()
    };
    memoryStore.sessions.set(sessionId, newSession);
    return res.status(201).json({ success: true, session: newSession });
  } catch (err) {
    next(err);
  }
}

async function findSession({ isPrismaConnected, prisma, memoryStore, sessionId, userId }) {
  if (isPrismaConnected) {
    const session = await prisma.learningSession.findUnique({ where: { id: sessionId } });
    if (!session) return { error: { status: 404, message: 'Learning session not found' } };
    if (session.userId !== userId) return { error: { status: 403, message: 'You do not own this learning session' } };
    return { session };
  }

  const session = memoryStore.sessions.get(sessionId);
  if (!session) return { error: { status: 404, message: 'Learning session not found' } };
  if (session.userId !== userId) return { error: { status: 403, message: 'You do not own this learning session' } };
  return { session };
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
    const db = getDb();
    const { isPrismaConnected, prisma, memoryStore } = db;

    const sessionResult = await findSession({ ...db, sessionId, userId });
    if (sessionResult.error) {
      return res.status(sessionResult.error.status).json({ success: false, error: sessionResult.error.message });
    }

    const existingAttempt = isPrismaConnected
      ? await prisma.questionAttempt.findFirst({ where: { sessionId, questionId } })
      : memoryStore.questionAttempts.get(`${sessionId}:${questionId}`);

    if (existingAttempt) {
      return res.json({
        success: true,
        alreadyAnswered: true,
        isCorrect: existingAttempt.isCorrect,
        xpAwarded: 0,
        tokensEntitled: '0.00',
        concept: existingAttempt.concept,
        explanation: null,
        keyTakeaway: null,
        idempotencyKey
      });
    }

    const verifiedQuestion = aiService.resolveQuestionAnswer(questionId);
    if (!verifiedQuestion) {
      return res.status(409).json({
        success: false,
        error: 'This question is no longer available for verification. Please request a fresh set of questions.'
      });
    }

    const isCorrect = chosenOption === verifiedQuestion.correctOptionIndex;
    const resolvedConcept = verifiedQuestion.concept || concept;

    let xpAwarded = 0;
    let tokensEntitled = '0.0';
    let explanationData = null;

    if (isCorrect) {
      xpAwarded = hintsUsed > 0 ? XP_ECONOMY.CORRECT_AFTER_HINT : XP_ECONOMY.CORRECT_FIRST_ATTEMPT;
      tokensEntitled = (xpAwarded * XP_ECONOMY.XP_TO_TOKEN_RATIO).toFixed(2);
    } else {
      const correctAnswerText = verifiedQuestion.options[verifiedQuestion.correctOptionIndex];
      const chosenAnswerText = verifiedQuestion.options[chosenOption] || `Option ${chosenOption + 1}`;
      explanationData = await aiService.generateExplanation({
        concept: resolvedConcept,
        chosenAnswer: chosenAnswerText,
        correctAnswer: correctAnswerText
      });
    }

    const resultPayload = {
      success: true,
      isCorrect,
      xpAwarded,
      tokensEntitled,
      concept: resolvedConcept,
      correctOptionIndex: verifiedQuestion.correctOptionIndex,
      explanation: explanationData?.explanation || null,
      keyTakeaway: explanationData?.keyTakeaway || null,
      explanationSource: explanationData?.source || null,
      idempotencyKey
    };

    if (isPrismaConnected) {
      await prisma.$transaction(async (tx) => {
        await tx.questionAttempt.create({
          data: {
            sessionId,
            questionId,
            concept: resolvedConcept,
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
              reason: `Correct answer on concept: ${resolvedConcept}`,
              referenceId: questionId,
              idempotencyKey
            }
          });

          await tx.rewardEntitlement.create({
            data: {
              userId,
              amountTokens: tokensEntitled,
              reason: `Reward for question ${questionId} (${resolvedConcept})`,
              status: 'PENDING'
            }
          });
        }
      });
    } else {
      memoryStore.questionAttempts.set(`${sessionId}:${questionId}`, {
        sessionId,
        questionId,
        concept: resolvedConcept,
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
          reason: `Correct answer on concept: ${resolvedConcept}`,
          referenceId: questionId,
          idempotencyKey,
          createdAt: new Date()
        });

        const entitlementId = `ent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        memoryStore.rewardEntitlements.set(entitlementId, {
          id: entitlementId,
          userId,
          amountTokens: tokensEntitled,
          reason: `Reward for question ${questionId} (${resolvedConcept})`,
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
    const db = getDb();
    const { isPrismaConnected, prisma, memoryStore } = db;

    const sessionResult = await findSession({ ...db, sessionId, userId });
    if (sessionResult.error) {
      return res.status(sessionResult.error.status).json({ success: false, error: sessionResult.error.message });
    }

    if (sessionResult.session.status === 'COMPLETED') {
      return res.json({
        success: true,
        alreadyCompleted: true,
        message: 'Level was already completed.',
        bonusXP: 0,
        bonusTokens: '0.00',
        entitlementId: null
      });
    }

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
      sessionResult.session.status = 'COMPLETED';
      sessionResult.session.completedAt = new Date();
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
      for (const session of memoryStore.sessions.values()) {
        if (session.userId === userId && session.status === 'COMPLETED') completedLevels++;
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

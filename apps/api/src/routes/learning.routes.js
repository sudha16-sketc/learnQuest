import { Router } from 'express';
import { getTopics, startSession, submitAnswer, completeSession, getProgress } from '../controllers/learning.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { rewardsLimiter } from '../middleware/rate-limiter.js';

const router = Router();

router.get('/topics', getTopics);
router.post('/sessions', authenticate, startSession);
router.post('/sessions/:sessionId/answers', authenticate, rewardsLimiter, requireIdempotency, submitAnswer);
router.post('/sessions/:sessionId/complete', authenticate, rewardsLimiter, completeSession);
router.get('/progress', authenticate, getProgress);

export default router;

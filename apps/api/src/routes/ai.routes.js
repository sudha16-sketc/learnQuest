import { Router } from 'express';
import {
  generateQuestions,
  generateExplanation,
  generateHint,
  generateRemedialQuestion,
  getAIStatus
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/status', authenticate, getAIStatus);
router.post('/questions', authenticate, generateQuestions);
router.post('/explanations', authenticate, generateExplanation);
router.post('/hints', authenticate, generateHint);
router.post('/remedial', authenticate, generateRemedialQuestion);

export default router;

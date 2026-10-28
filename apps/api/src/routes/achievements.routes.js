import { Router } from 'express';
import {
  getAvailableAchievements,
  getMyAchievements,
  checkEligibility,
  issueAchievement,
  verifyAchievement
} from '../controllers/achievements.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', getAvailableAchievements);
router.get('/me', authenticate, getMyAchievements);
router.post('/eligibility', authenticate, checkEligibility);
router.post('/issue', authenticate, issueAchievement);
router.post('/verify', verifyAchievement);

export default router;

import { Router } from 'express';
import {
  createChallenge,
  getChallenges,
  getChallenge,
  checkChallengeEligibility,
  submitChallenge,
  getSubmissions,
  evaluateSubmission
} from '../controllers/sponsors.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/challenges', getChallenges);
router.get('/challenges/:id', getChallenge);
router.post('/challenges', authenticate, createChallenge);
router.post('/challenges/:id/eligibility', authenticate, checkChallengeEligibility);
router.post('/challenges/:id/submit', authenticate, submitChallenge);
router.get('/submissions', authenticate, getSubmissions);
router.post('/submissions/:submissionId/evaluate', authenticate, evaluateSubmission);

export default router;

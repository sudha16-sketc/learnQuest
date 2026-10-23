import { Router } from 'express';
import { register, login, getMe, requestWalletChallenge, linkWallet } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.post('/wallet-challenge', authenticate, requestWalletChallenge);
router.post('/link-wallet', authenticate, linkWallet);

export default router;

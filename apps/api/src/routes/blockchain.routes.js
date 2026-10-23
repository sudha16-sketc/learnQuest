import { Router } from 'express';
import { getBlockchainConfig, getTransactions, confirmAchievement } from '../controllers/blockchain.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/config', getBlockchainConfig);
router.get('/transactions', authenticate, getTransactions);
router.post('/achievements/confirm', authenticate, confirmAchievement);

export default router;

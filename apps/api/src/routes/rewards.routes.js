import { Router } from 'express';
import { getBalance, getLedger, getPending, claimVoucher } from '../controllers/rewards.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rewardsLimiter } from '../middleware/rate-limiter.js';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.get('/ledger', authenticate, getLedger);
router.get('/pending', authenticate, getPending);
router.post('/claim-voucher', authenticate, rewardsLimiter, claimVoucher);

export default router;

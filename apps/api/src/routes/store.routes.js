import { Router } from 'express';
import { getStoreItems, getQuote, confirmPurchase, equipAccessory } from '../controllers/store.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/items', authenticate, getStoreItems);
router.get('/quote', authenticate, getQuote);
router.post('/confirm', authenticate, confirmPurchase);
router.post('/equip', authenticate, equipAccessory);

export default router;

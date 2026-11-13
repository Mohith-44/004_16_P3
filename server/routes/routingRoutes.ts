import { Router } from 'express';
import {
  getRoutingRules,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
} from '../controllers/routingController.ts';
import { protect, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', protect, getRoutingRules);
router.post('/', protect, authorize('Admin', 'Routing Manager'), createRoutingRule);
router.put('/:id', protect, authorize('Admin', 'Routing Manager'), updateRoutingRule);
router.delete('/:id', protect, authorize('Admin', 'Routing Manager'), deleteRoutingRule);

export default router;

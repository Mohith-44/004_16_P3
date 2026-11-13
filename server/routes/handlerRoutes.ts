import { Router } from 'express';
import {
  getHandlers,
  createHandler,
  updateHandler,
  updateHandlerAvailability,
  updateHandlerCapacity,
} from '../controllers/handlerController.ts';
import { protect, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', protect, getHandlers);
router.post('/', protect, authorize('Admin', 'Routing Manager'), createHandler);
router.put('/:id', protect, authorize('Admin', 'Routing Manager', 'Handler'), updateHandler);
router.patch('/:id/availability', protect, authorize('Admin', 'Routing Manager', 'Handler'), updateHandlerAvailability);
router.patch('/:id/capacity', protect, authorize('Admin', 'Routing Manager', 'Handler'), updateHandlerCapacity);

export default router;

import { Router } from 'express';
import {
  getAnalyticsOverview,
  getCategoryAnalytics,
  getZoneAnalytics,
  getStatusAnalytics,
} from '../controllers/analyticsController.ts';
import { protect } from '../middleware/auth.ts';

const router = Router();

router.get('/overview', protect, getAnalyticsOverview);
router.get('/categories', protect, getCategoryAnalytics);
router.get('/zones', protect, getZoneAnalytics);
router.get('/status', protect, getStatusAnalytics);

export default router;

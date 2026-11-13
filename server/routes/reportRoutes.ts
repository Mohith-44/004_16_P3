import { Router } from 'express';
import {
  createReport,
  getReports,
  trackReport,
  getReportById,
  updateReport,
  updateReportStatus,
} from '../controllers/reportController.ts';
import { protect, optionalAuth, authorize } from '../middleware/auth.ts';

const router = Router();

router.post('/', optionalAuth, createReport);
router.get('/', protect, getReports);
router.get('/track/:reportId', trackReport);
router.get('/:id', protect, getReportById);
router.put('/:id', protect, authorize('Admin', 'Handler', 'Routing Manager'), updateReport);
router.patch('/:id/status', protect, authorize('Admin', 'Handler', 'Routing Manager'), updateReportStatus);

export default router;

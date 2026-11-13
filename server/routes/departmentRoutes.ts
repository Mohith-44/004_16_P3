import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.ts';
import { protect, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', getDepartments);
router.post('/', protect, authorize('Admin', 'Routing Manager'), createDepartment);
router.put('/:id', protect, authorize('Admin', 'Routing Manager'), updateDepartment);
router.delete('/:id', protect, authorize('Admin'), deleteDepartment);

export default router;

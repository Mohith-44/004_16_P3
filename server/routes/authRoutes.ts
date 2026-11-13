import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.ts';
import { protect } from '../middleware/auth.ts';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

export default router;

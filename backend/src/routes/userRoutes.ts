import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';
import { sanitizeMiddleware } from '../middleware/sanitizeMiddleware';

const router = Router();

router.patch(
  '/users/profile',
  authenticateUser,
  sanitizeMiddleware,
  userController.updateProfile
);

export default router;

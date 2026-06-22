import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

const generalRoles = ['student', 'coreTeam', 'faculty', 'contributor', 'admin'];

// Admin only: create manual announcements/alerts
router.post(
  '/notifications',
  authenticateUser,
  authorizeRoles('admin'),
  notificationController.createNotification
);

// Get paginated notification list (personal + global)
router.get(
  '/notifications',
  authenticateUser,
  authorizeRoles(...generalRoles),
  notificationController.getNotifications
);

// Bulk mark all notifications as read
router.patch(
  '/notifications/read-all',
  authenticateUser,
  authorizeRoles(...generalRoles),
  notificationController.markAllAsRead
);

// Mark single notification as read
router.patch(
  '/notifications/:id/read',
  authenticateUser,
  authorizeRoles(...generalRoles),
  notificationController.markAsRead
);

export default router;

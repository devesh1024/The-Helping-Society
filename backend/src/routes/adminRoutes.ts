import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Publicly authenticated route: any user can submit a report
router.post(
  '/reports',
  authenticateUser,
  adminController.createReport
);

// Admin-only protected endpoints
router.get(
  '/admin/stats',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.getDashboardStats
);

router.get(
  '/admin/users',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.getUsers
);

router.get(
  '/admin/users/pending-approval',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.getPendingApprovals
);

router.get(
  '/admin/users/:id',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.getUserById
);

router.patch(
  '/admin/users/:id/role',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.updateUserRole
);

router.patch(
  '/admin/users/:id/ban',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.banUser
);

router.patch(
  '/admin/users/:id/unban',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.unbanUser
);

router.patch(
  '/admin/users/:id/approve',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.approveUser
);

router.patch(
  '/admin/users/:id/reject',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.rejectUser
);

router.get(
  '/admin/reports',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.getReports
);

router.patch(
  '/admin/reports/:id/resolve',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.resolveReport
);

router.get(
  '/admin/audit-logs',
  authenticateUser,
  authorizeRoles('admin'),
  adminController.getAuditLogs
);

export default router;

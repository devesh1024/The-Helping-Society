import { Router } from 'express';
import * as supportController from '../controllers/supportController';
import { authenticateUser, authorizeRoles, authorizeOwnership } from '../middleware/authMiddleware';
import { sanitizeMiddleware } from '../middleware/sanitizeMiddleware';

const router = Router();

const generalRoles = ['student', 'coreTeam', 'faculty', 'admin', 'alumni'];

// Create support request
router.post(
  '/support-requests',
  authenticateUser,
  authorizeRoles(...generalRoles),
  supportController.createSupportRequest
);

// Get list of support requests
router.get(
  '/support-requests',
  authenticateUser,
  authorizeRoles(...generalRoles),
  supportController.getSupportRequests
);

// Get support request by ID
router.get(
  '/support-requests/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  supportController.getSupportRequestById
);

// Update support request
router.put(
  '/support-requests/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('SupportRequest', 'id'),
  supportController.updateSupportRequest
);

// Delete support request
router.delete(
  '/support-requests/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('SupportRequest', 'id'),
  supportController.deleteSupportRequest
);

// Admin-only approval/rejection operations
router.patch(
  '/support-requests/:id/approve',
  authenticateUser,
  authorizeRoles('admin'),
  supportController.approveSupportRequest
);

router.patch(
  '/support-requests/:id/reject',
  authenticateUser,
  authorizeRoles('admin'),
  supportController.rejectSupportRequest
);

// Resolve support request (Owner or Admin)
router.patch(
  '/support-requests/:id/resolve',
  authenticateUser,
  authorizeRoles(...generalRoles),
  supportController.resolveSupportRequest
);

// Support Request Replies routes
router.post(
  '/support-requests/:id/replies',
  authenticateUser,
  authorizeRoles(...generalRoles),
  sanitizeMiddleware,
  supportController.createSupportReply
);

router.get(
  '/support-requests/:id/replies',
  authenticateUser,
  authorizeRoles(...generalRoles),
  supportController.getSupportReplies
);

export default router;

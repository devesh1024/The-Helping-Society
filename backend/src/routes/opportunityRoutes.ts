import { Router } from 'express';
import * as opportunityController from '../controllers/opportunityController';
import { authenticateUser, authorizeRoles, authorizeOwnership } from '../middleware/authMiddleware';
import { sanitizeMiddleware } from '../middleware/sanitizeMiddleware';

const router = Router();

const generalRoles = ['student', 'coreTeam', 'faculty', 'contributor', 'admin'];
const posterRoles = ['contributor', 'admin'];

router.post(
  '/opportunities',
  authenticateUser,
  authorizeRoles(...posterRoles),
  sanitizeMiddleware,
  opportunityController.createOpportunity
);

router.get(
  '/opportunities',
  authenticateUser,
  authorizeRoles(...generalRoles),
  opportunityController.getOpportunities
);

router.get(
  '/opportunities/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  opportunityController.getOpportunityById
);

router.put(
  '/opportunities/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('Opportunity', 'id'),
  sanitizeMiddleware,
  opportunityController.updateOpportunity
);

router.delete(
  '/opportunities/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('Opportunity', 'id'),
  opportunityController.deleteOpportunity
);

export default router;

import { Router } from 'express';
import * as communityController from '../controllers/communityController';
import * as commentController from '../controllers/commentController';
import { authenticateUser, authorizeRoles, authorizeOwnership } from '../middleware/authMiddleware';

const router = Router();

const generalRoles = ['student', 'coreTeam', 'faculty', 'admin'];
const studentCreatorRoles = ['student', 'coreTeam'];

// === Lost & Found Routes ===
router.post(
  '/lost-found',
  authenticateUser,
  authorizeRoles(...studentCreatorRoles),
  communityController.createLostFound
);

router.get(
  '/lost-found',
  authenticateUser,
  authorizeRoles(...generalRoles),
  communityController.getLostFound
);

router.get(
  '/lost-found/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  communityController.getLostFoundById
);

router.put(
  '/lost-found/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('LostFoundPost', 'id'),
  communityController.updateLostFound
);

router.delete(
  '/lost-found/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('LostFoundPost', 'id'),
  communityController.deleteLostFound
);

router.patch(
  '/lost-found/:id/resolve',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('LostFoundPost', 'id'),
  communityController.resolveLostFound
);

// === Rooms Routes ===
router.post(
  '/rooms',
  authenticateUser,
  authorizeRoles(...studentCreatorRoles),
  communityController.createRoom
);

router.get(
  '/rooms',
  authenticateUser,
  authorizeRoles(...generalRoles),
  communityController.getRooms
);

router.get(
  '/rooms/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  communityController.getRoomById
);

router.put(
  '/rooms/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('RoomPost', 'id'),
  communityController.updateRoom
);

router.delete(
  '/rooms/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('RoomPost', 'id'),
  communityController.deleteRoom
);

// === Marketplace Routes ===
router.post(
  '/marketplace',
  authenticateUser,
  authorizeRoles(...studentCreatorRoles),
  communityController.createMarketplace
);

router.get(
  '/marketplace',
  authenticateUser,
  authorizeRoles(...generalRoles),
  communityController.getMarketplace
);

router.get(
  '/marketplace/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  communityController.getMarketplaceById
);

router.put(
  '/marketplace/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('MarketplacePost', 'id'),
  communityController.updateMarketplace
);

router.delete(
  '/marketplace/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('MarketplacePost', 'id'),
  communityController.deleteMarketplace
);

// === Comments Routes ===
router.post(
  '/comments',
  authenticateUser,
  authorizeRoles(...generalRoles),
  commentController.createComment
);

router.post(
  '/comments/:id/reply',
  authenticateUser,
  authorizeRoles(...generalRoles),
  commentController.createReply
);

router.put(
  '/comments/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('Comment', 'id'),
  commentController.updateComment
);

router.delete(
  '/comments/:id',
  authenticateUser,
  authorizeRoles(...generalRoles),
  authorizeOwnership('Comment', 'id'),
  commentController.deleteComment
);

router.get(
  '/comments',
  authenticateUser,
  authorizeRoles(...generalRoles),
  commentController.getCommentsByTarget
);

export default router;

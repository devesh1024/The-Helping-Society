import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Registration endpoints
router.post('/register/student', authController.registerStudent);
router.post('/register/faculty', authController.registerFaculty);
router.post('/register/contributor', authController.registerContributor);
router.post('/register/alumni', authController.registerAlumni);

// Verification and Credentials endpoints
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.rotateRefreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Profile endpoint
router.get('/me', authenticateUser, authController.getMe);

export default router;

import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = Router();

// Public Authentication Routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/reset-password', AuthController.resetPassword);
router.post('/logout', AuthController.logout);

// Protected Authentication Routes
router.get('/me', authenticateToken, AuthController.getMe);

export default router;

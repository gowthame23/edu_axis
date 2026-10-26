import express from 'express';
import { register, login, logout, getCurrentUser, changePassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser); // Protected route
router.post('/change-password', authMiddleware, changePassword); // Protected route

export default router;

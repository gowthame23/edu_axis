import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { sendMessage, getConversationWithUser, getConversations, markAsRead, deleteMessage, deleteConversation } from '../controllers/messageController.js';

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// Get all conversations
router.get('/conversations', getConversations);

// Create message (student -> teacher or teacher -> student)
router.post('/', sendMessage);

// Mark messages as read
router.post('/read', markAsRead);

// Delete a message
router.delete('/:messageId', deleteMessage);

// Delete entire conversation with a user
router.delete('/conversation/:otherUserId', deleteConversation);

// Get conversation (messages between current user and other user)
router.get('/:userId', getConversationWithUser);

export default router;

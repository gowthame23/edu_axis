import express from 'express';
import {
  submitFeedback,
  getCourseFeedback,
  getStudentFeedback,
  getModuleFeedback,
  getFeedbackDashboard,
  reviewFeedback
} from '../controllers/feedbackController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Submit feedback
router.post('/', submitFeedback);

// Get student's own feedback history
router.get('/student/:studentId', getStudentFeedback);

// Get course feedback
router.get('/course/:courseId', getCourseFeedback);

// Get module feedback
router.get('/module/:moduleId', getModuleFeedback);

// Get feedback dashboard (admin)
router.get('/dashboard', roleMiddleware('admin'), getFeedbackDashboard);

// Review feedback (admin)
router.put('/:feedbackId/review', roleMiddleware('admin'), reviewFeedback);

export default router;

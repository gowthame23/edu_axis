import express from 'express';
import {
  createQuiz,
  getQuiz,
  checkQuizPrerequisite,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResults,
  getStudentQuizAttempts
} from '../controllers/quizController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Create quiz (admin/teacher only)
router.post('/', roleMiddleware('teacher', 'admin'), createQuiz);

// Get quiz details
router.get('/:quizId', getQuiz);

// Check quiz prerequisite
router.get('/check/:quizId/:studentId', checkQuizPrerequisite);

// Start quiz attempt
router.post('/attempt/start', startQuizAttempt);

// Submit quiz answers
router.post('/attempt/submit', submitQuizAttempt);

// Get quiz results
router.get('/results/:attemptId', getQuizResults);

// Get student quiz attempts
router.get('/attempts/:studentId/:courseId', getStudentQuizAttempts);

export default router;

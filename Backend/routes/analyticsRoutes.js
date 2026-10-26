import express from 'express';
import {
  getStudentPerformance,
  updateStudentPerformance,
  getAtRiskStudents,
  getClassPerformanceReport,
  getPerformanceTrend
} from '../controllers/analyticsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get student performance (with optional courseId)
router.get('/student/:studentId/:courseId', getStudentPerformance);
router.get('/student/:studentId', getStudentPerformance);

// Update student performance (admin can trigger)
router.post('/update/:studentId/:courseId', roleMiddleware('admin'), updateStudentPerformance);

// Get at-risk students
router.get('/at-risk/:courseId', roleMiddleware('teacher', 'admin'), getAtRiskStudents);

// Get class performance report
router.get('/class-report/:courseId', roleMiddleware('teacher', 'admin'), getClassPerformanceReport);

// Get performance trend (with optional courseId)
router.get('/trend/:studentId/:courseId', getPerformanceTrend);
router.get('/trend/:studentId', getPerformanceTrend);

export default router;

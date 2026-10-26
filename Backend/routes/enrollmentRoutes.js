import express from 'express';
import {
  getStudentEnrollments,
  getAvailableCourses,
  enrollCourse,
  getCourseEnrollmentStats,
  updateEnrollment,
  dropCourse
} from '../controllers/enrollmentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get student enrollments
router.get('/student/:studentId', getStudentEnrollments);

// Get available courses for enrollment
router.get('/available/:studentId', getAvailableCourses);

// Enroll in a course
router.post('/enroll', enrollCourse);

// Get enrollment statistics
router.get('/stats/:courseId', getCourseEnrollmentStats);

// Update enrollment (grades, attendance, etc.)
router.put('/:enrollmentId', updateEnrollment);

// Drop a course
router.delete('/drop/:enrollmentId', dropCourse);

export default router;

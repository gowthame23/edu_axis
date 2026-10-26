import express from 'express';
import {
  getDashboard,
  getCourses,
  getCourseDetails,
  getGrades,
  getAttendance,
  getAssignments,
  submitAssignment,
  getSubmissionDetails,
  getTimetable,
  getSchedule,
  getAnnouncements,
  markAnnouncementAsRead,
  hideAnnouncement,
  clearAllAnnouncements,
  getFees,
  createFeeRazorpayOrder,
  verifyFeeRazorpayPayment,
  makePayment,
  downloadReceipt,
  getLibraryResources,
  createLeaveRequest,
  getMyLeaveRequests,
  getTeachers,
  getStudyMaterials
} from '../controllers/studentController.js';
import { 
  getStudentPerformance, 
  getPerformanceTrend,
  getGradeBreakdown
} from '../controllers/studentAnalyticsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { uploadSubmissionFiles } from '../config/multer.js';

const router = express.Router();

// Protect all student routes - require authentication and student role
router.use(authMiddleware);
router.use(roleMiddleware('student'));

// Dashboard
router.get('/dashboard', getDashboard);

// Courses
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseDetails);

// Grades
router.get('/grades', getGrades);

// Attendance
router.get('/attendance', getAttendance);

// Assignments
router.get('/assignments', getAssignments);
// Allow up to 5 files per submission under field name 'files'
router.post('/assignments/submit', uploadSubmissionFiles.array('files', 5), submitAssignment);
router.get('/assignments/:assignmentId/submission', getSubmissionDetails);

// Timetable
router.get('/timetable', getTimetable);
// Weekly schedule
router.get('/schedule', getSchedule);

// Announcements
router.get('/announcements', getAnnouncements);
router.patch('/announcements/:id/read', markAnnouncementAsRead);
router.delete('/announcements/:id', hideAnnouncement);
router.delete('/announcements', clearAllAnnouncements);

// Fees & Payments
router.get('/fees', getFees);
router.post('/payment/razorpay/order', createFeeRazorpayOrder);
router.post('/payment/razorpay/verify', verifyFeeRazorpayPayment);
router.post('/payment', makePayment);
router.get('/receipt/:paymentId', downloadReceipt);

// Library
router.get('/library', getLibraryResources);

// Leave Requests
router.post('/leave-requests', createLeaveRequest);
router.get('/leave-requests', getMyLeaveRequests);

// Teachers (for messaging)
router.get('/teachers', getTeachers);

// Study Materials
router.get('/study-materials', getStudyMaterials);

// Performance Analytics
router.get('/analytics/performance/:studentId', getStudentPerformance);
router.get('/analytics/trend/:studentId', getPerformanceTrend);
router.get('/analytics/breakdown/:studentId', getGradeBreakdown);

export default router;

import express from 'express';
import {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCourses,
  getTeacherSubjects,
  createCourse,
  updateCourse,
  deleteCourse,
  getClasses,
  getReports,
  getStats,
  getFees,
  createFee,
  updateFee,
  deleteFee,
  getPayments,
  createPayment,
  getPaymentStats,
  getPaymentTrends,
  exportPayments,
  sendFeeReminders,
  getClassOverview,
  getStudentAnalytics,
  getAtRiskStudents,
  getStudentDetails,
  getLeaveRequests,
  decideLeaveRequest,
  bulkImportCSV,
  getAvailablePlans,
  getCurrentSubscription,
  createSubscriptionRazorpayOrder,
  verifySubscriptionRazorpayPayment,
  upgradePlan
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { uploadCSVFile } from '../config/multer.js';

const router = express.Router();

  import { uploadLibraryFiles, uploadTimetableFiles } from '../config/multer.js';
  import { adminCreateLibraryResource, adminListLibraryResources, adminDeleteLibraryResource, adminListTimetables, adminCreateOrUpdateTimetable, adminUpdateTimetable, adminDeleteTimetable } from '../controllers/adminController.js';
// Protect all admin routes - require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/dashboard', getDashboard);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/courses', getCourses);
router.get('/teachers/:teacherId/subjects', getTeacherSubjects);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.get('/classes', getClasses);
router.get('/reports', getReports);

// Fee Management Routes
router.get('/fees', getFees);

  // Library management (admin)
  router.get('/library', adminListLibraryResources);
  router.post('/library', uploadLibraryFiles.single('file'), adminCreateLibraryResource);
  router.delete('/library/:id', adminDeleteLibraryResource);

// Timetable management (admin)
router.get('/timetables', adminListTimetables);
router.post('/timetables', uploadTimetableFiles.single('file'), adminCreateOrUpdateTimetable);
router.patch('/timetables/:id', adminUpdateTimetable);
router.delete('/timetables/:id', adminDeleteTimetable);
router.post('/fees', createFee);
router.put('/fees/:id', updateFee);
router.delete('/fees/:id', deleteFee);

// Payment Management Routes
router.get('/payments', getPayments);
router.post('/payments', createPayment);
router.get('/payments/stats', getPaymentStats);
router.get('/payments/trends', getPaymentTrends);
router.get('/payments/export', exportPayments);
router.post('/fees/reminders', sendFeeReminders);

// Class Management Routes
router.get('/class/overview', getClassOverview);
router.get('/class/students', getStudentAnalytics);
router.get('/class/at-risk', getAtRiskStudents);
router.get('/class/students/:id', getStudentDetails);

// Leave Request Management
router.get('/leave-requests', getLeaveRequests);
router.patch('/leave-requests/:id', decideLeaveRequest);
router.post('/bulk-import', uploadCSVFile.single('file'), bulkImportCSV);

// Subscription/Plan Management Routes
router.get('/subscription/plans', getAvailablePlans);
router.get('/subscription/current', getCurrentSubscription);
router.post('/subscription/razorpay/order', createSubscriptionRazorpayOrder);
router.post('/subscription/razorpay/verify', verifySubscriptionRazorpayPayment);
router.post('/subscription/upgrade', upgradePlan);

export default router;

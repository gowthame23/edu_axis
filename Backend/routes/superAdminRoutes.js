import express from 'express';
import {
  getSuperAdminDashboard,
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  updateSchoolStatus,
  updateSchoolSubscription,
  getPlatformStatistics,
  getSubscriptionAnalytics,
  getRevenueTrends,
  getSubscriptionsList,
  getPricingPlansSettings,
  publishPricingPlans
} from '../controllers/superAdminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and super admin role middleware to all routes
router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

// Dashboard and statistics
router.get('/dashboard', getSuperAdminDashboard);
router.get('/statistics', getPlatformStatistics);

// Platform settings (dynamic pricing)
router.get('/settings/pricing-plans', getPricingPlansSettings);
router.post('/settings/pricing-plans/publish', publishPricingPlans);

// Subscription and revenue analytics (Phase 1)
router.get('/analytics/subscriptions', getSubscriptionAnalytics);
router.get('/analytics/revenue-trends', getRevenueTrends);
router.get('/analytics/subscriptions-list', getSubscriptionsList);

// School management
router.route('/schools')
  .get(getAllSchools)
  .post(createSchool);

router.route('/schools/:id')
  .get(getSchoolById)
  .put(updateSchool)
  .delete(deleteSchool);

// School status and subscription management
router.patch('/schools/:id/status', updateSchoolStatus);
router.patch('/schools/:id/subscription', updateSchoolSubscription);

export default router;

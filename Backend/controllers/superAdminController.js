import School from '../models/School.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import PricingPlan from '../models/PricingPlan.js';
import AuditLog from '../models/AuditLog.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const STUDENT_BILLING_INR = {
  currency: 'INR',
  starter: {
    name: 'Starter',
    maxStudents: 300,
    monthlyFee: 1999
  },
  growth: {
    name: 'Growth',
    maxStudents: 1000,
    monthlyFee: 4999
  },
  scale: {
    name: 'Scale',
    baseMonthlyFee: 4999,
    includedStudents: 1000,
    additionalPerStudent: 8
  }
};

const getBillingForStudentCount = (studentCount = 0) => {
  const normalized = Math.max(0, Number(studentCount) || 0);

  if (normalized <= STUDENT_BILLING_INR.starter.maxStudents) {
    return {
      tier: 'starter',
      monthlyCharge: STUDENT_BILLING_INR.starter.monthlyFee
    };
  }

  if (normalized <= STUDENT_BILLING_INR.growth.maxStudents) {
    return {
      tier: 'growth',
      monthlyCharge: STUDENT_BILLING_INR.growth.monthlyFee
    };
  }

  const extraStudents = normalized - STUDENT_BILLING_INR.scale.includedStudents;
  return {
    tier: 'scale',
    monthlyCharge: STUDENT_BILLING_INR.scale.baseMonthlyFee + (extraStudents * STUDENT_BILLING_INR.scale.additionalPerStudent)
  };
};

const DEFAULT_DYNAMIC_PLANS = [
  {
    code: 'basic',
    name: 'Basic',
    description: 'Perfect for small schools',
    monthlyPrice: 2999,
    annualPrice: 29990,
    maxStudents: 500,
    maxTeachers: 50,
    features: [{ label: 'Up to 500 students' }, { label: 'Up to 50 teachers' }, { label: 'Email support' }],
    displayOrder: 1,
    isActive: true
  },
  {
    code: 'premium',
    name: 'Premium',
    description: 'For growing schools',
    monthlyPrice: 5999,
    annualPrice: 59990,
    maxStudents: 2000,
    maxTeachers: 200,
    features: [{ label: 'Up to 2000 students' }, { label: 'Up to 200 teachers' }, { label: 'Priority email & phone support' }],
    displayOrder: 2,
    isActive: true
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale institutions',
    monthlyPrice: 9999,
    annualPrice: 99990,
    maxStudents: null,
    maxTeachers: null,
    features: [
      { label: 'Unlimited students & teachers' },
      { label: 'Custom API access' },
      { label: 'Dedicated account manager' },
      { label: '24/7 priority support' }
    ],
    displayOrder: 3,
    isActive: true
  }
];

const ensureDefaultPricingPlans = async () => {
  const count = await PricingPlan.countDocuments();
  if (count > 0) return;
  await PricingPlan.insertMany(DEFAULT_DYNAMIC_PLANS);
};

const normalizeFeatures = (features = []) => {
  if (!Array.isArray(features)) return [];
  return features
    .map((feature) => {
      if (typeof feature === 'string') return { label: feature.trim() };
      return { label: (feature?.label || '').trim() };
    })
    .filter((feature) => feature.label.length > 0);
};

// @desc    Get super admin dashboard statistics
// @route   GET /api/superadmin/dashboard
// @access  Super Admin
export const getSuperAdminDashboard = catchAsync(async (req, res) => {
  // Get all schools with their stats
  const schools = await School.find().sort({ createdAt: -1 });
  
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === 'active').length;
  const pendingSchools = schools.filter(s => s.status === 'pending').length;
  const suspendedSchools = schools.filter(s => s.status === 'suspended').length;

  // Calculate totals across all schools
  const totalStudents = schools.reduce((sum, school) => sum + school.stats.totalStudents, 0);
  const totalTeachers = schools.reduce((sum, school) => sum + school.stats.totalTeachers, 0);
  const totalAdmins = schools.reduce((sum, school) => sum + school.stats.totalAdmins, 0);
  const totalCourses = schools.reduce((sum, school) => sum + school.stats.totalCourses, 0);

  // Subscription distribution
  const subscriptionStats = {
    trial: schools.filter(s => s.subscription.plan === 'trial').length,
    basic: schools.filter(s => s.subscription.plan === 'basic').length,
    premium: schools.filter(s => s.subscription.plan === 'premium').length,
    enterprise: schools.filter(s => s.subscription.plan === 'enterprise').length
  };

  // Recent schools
  const recentSchools = schools.slice(0, 5).map(school => ({
    _id: school._id,
    name: school.name,
    code: school.code,
    status: school.status,
    subscription: {
      plan: school.subscription.plan
    },
    stats: {
      totalStudents: school.stats.totalStudents,
      totalTeachers: school.stats.totalTeachers
    },
    createdAt: school.createdAt
  }));

  res.json({
    success: true,
    data: {
      totalSchools,
      activeSchools,
      pendingSchools,
      suspendedSchools,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalCourses,
      subscriptionStats,
      recentSchools,
      schools: schools.map(school => {
        const billing = getBillingForStudentCount(school.stats?.totalStudents || 0);
        return {
          _id: school._id,
          name: school.name,
          code: school.code,
          email: school.email,
          phone: school.phone,
          status: school.status,
          subscription: {
            plan: school.subscription.plan,
            endDate: school.subscription.endDate
          },
          stats: school.stats,
          createdAt: school.createdAt,
          billingPreview: {
            currency: STUDENT_BILLING_INR.currency,
            tier: billing.tier,
            monthlyCharge: billing.monthlyCharge
          }
        };
      })
    }
  });
});

// @desc    Get all schools
// @route   GET /api/superadmin/schools
// @access  Super Admin
export const getAllSchools = catchAsync(async (req, res) => {
  const { status, plan, search } = req.query;
  
  let query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (plan) {
    query['subscription.plan'] = plan;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const schools = await School.find(query).sort({ createdAt: -1 });
  
  res.json({
    success: true,
    count: schools.length,
    data: schools
  });
});

// @desc    Get single school details
// @route   GET /api/superadmin/schools/:id
// @access  Super Admin
export const getSchoolById = catchAsync(async (req, res) => {
  const school = await School.findById(req.params.id);
  
  if (!school) {
    throw new AppError('School not found', 404);
  }
  
  // Get detailed stats
  const [students, teachers, admins, courses, assignments] = await Promise.all([
    User.find({ schoolId: school._id, role: 'student' }).select('name email studentId grade status'),
    User.find({ schoolId: school._id, role: 'teacher' }).select('name email teacherId subject status'),
    User.find({ schoolId: school._id, role: 'admin' }).select('name email status'),
    Course.find({ schoolId: school._id }).select('name code teacher students'),
    Assignment.countDocuments({ schoolId: school._id })
  ]);
  
  res.json({
    success: true,
    data: {
      school,
      details: {
        students,
        teachers,
        admins,
        courses,
        totalAssignments: assignments
      }
    }
  });
});

// @desc    Create new school
// @route   POST /api/superadmin/schools
// @access  Super Admin
export const createSchool = catchAsync(async (req, res) => {
  const {
    name,
    code,
    email,
    phone,
    address,
    website,
    principal,
    subscription,
    adminUser
  } = req.body;
  
  // Check if school code already exists
  const existingSchool = await School.findOne({ code: code.toUpperCase() });
  if (existingSchool) {
    throw new AppError('School code already exists', 400);
  }
  
  // Check if email already exists
  const existingEmail = await School.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new AppError('School email already exists', 400);
  }
  
  const school = await School.create({
    name,
    code: code.toUpperCase(),
    email: email.toLowerCase(),
    phone,
    address,
    website,
    principal,
    subscription: subscription || {
      plan: 'trial',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      maxStudents: 100,
      maxTeachers: 10
    },
    status: 'active'
  });
  
  // Create initial admin user if provided
  let createdAdmin = null;
  if (adminUser && adminUser.name && adminUser.email && adminUser.password) {
    try {
      createdAdmin = await User.create({
        name: adminUser.name,
        email: adminUser.email.toLowerCase(),
        password: adminUser.password,
        role: 'admin',
        schoolId: school._id,
        phone: adminUser.phone || phone,
        status: 'active'
      });
      
      // Update school stats
      school.stats.totalAdmins = 1;
      await school.save();
    } catch (adminError) {
      // If admin creation fails, still return school but with a warning
      console.error('Admin creation failed:', adminError);
      return res.status(201).json({
        success: true,
        message: 'School created successfully, but admin creation failed',
        data: school,
        warning: 'Admin user could not be created: ' + adminError.message
      });
    }
  }
  
  res.status(201).json({
    success: true,
    message: createdAdmin ? 'School and admin created successfully' : 'School created successfully',
    data: {
      school,
      admin: createdAdmin ? createdAdmin.toJSON() : null
    }
  });
});

// @desc    Update school
// @route   PUT /api/superadmin/schools/:id
// @access  Super Admin
export const updateSchool = catchAsync(async (req, res) => {
  const school = await School.findById(req.params.id);
  
  if (!school) {
    throw new AppError('School not found', 404);
  }
  
  const allowedUpdates = [
    'name', 'email', 'phone', 'address', 'website', 'principal',
    'status', 'subscription', 'settings'
  ];
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      if (key === 'subscription' && typeof req.body[key] === 'object') {
        school.subscription = { ...school.subscription.toObject(), ...req.body[key] };
      } else if (key === 'address' && typeof req.body[key] === 'object') {
        school.address = { ...school.address, ...req.body[key] };
      } else if (key === 'settings' && typeof req.body[key] === 'object') {
        school.settings = { ...school.settings.toObject(), ...req.body[key] };
      } else {
        school[key] = req.body[key];
      }
    }
  });
  
  await school.save();
  
  res.json({
    success: true,
    message: 'School updated successfully',
    data: school
  });
});

// @desc    Delete school
// @route   DELETE /api/superadmin/schools/:id
// @access  Super Admin
export const deleteSchool = catchAsync(async (req, res) => {
  const school = await School.findById(req.params.id);
  
  if (!school) {
    throw new AppError('School not found', 404);
  }
  
  // Check if school has users
  const userCount = await User.countDocuments({ schoolId: school._id });
  if (userCount > 0) {
    throw new AppError(
      `Cannot delete school. It has ${userCount} users. Please delete or reassign users first.`,
      400
    );
  }
  
  await school.deleteOne();
  
  res.json({
    success: true,
    message: 'School deleted successfully'
  });
});

// @desc    Update school status
// @route   PATCH /api/superadmin/schools/:id/status
// @access  Super Admin
export const updateSchoolStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  
  if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
    throw new AppError('Invalid status value', 400);
  }
  
  const school = await School.findById(req.params.id);
  
  if (!school) {
    throw new AppError('School not found', 404);
  }
  
  school.status = status;
  await school.save();
  
  // Keep user account statuses in sync with school status changes
  if (status === 'suspended') {
    await User.updateMany(
      { schoolId: school._id },
      { status: 'suspended' }
    );
  }

  // When re-activating a school, bring back users who were suspended by school suspension
  if (status === 'active') {
    await User.updateMany(
      { schoolId: school._id, status: 'suspended' },
      { status: 'active' }
    );
  }

  // Optional: when school is marked inactive, set currently active users to inactive
  if (status === 'inactive') {
    await User.updateMany(
      { schoolId: school._id, status: 'active' },
      { status: 'inactive' }
    );
  }

  // Recalculate school active-user stats after bulk status updates
  const [activeStudents, activeTeachers, activeAdmins] = await Promise.all([
    User.countDocuments({ schoolId: school._id, role: 'student', status: 'active' }),
    User.countDocuments({ schoolId: school._id, role: 'teacher', status: 'active' }),
    User.countDocuments({ schoolId: school._id, role: 'admin', status: 'active' })
  ]);

  school.stats.totalStudents = activeStudents;
  school.stats.totalTeachers = activeTeachers;
  school.stats.totalAdmins = activeAdmins;
  await school.save();
  
  res.json({
    success: true,
    message: `School ${status} successfully`,
    data: school
  });
});

// @desc    Update school subscription
// @route   PATCH /api/superadmin/schools/:id/subscription
// @access  Super Admin
export const updateSchoolSubscription = catchAsync(async (req, res) => {
  const { plan, endDate, maxStudents, maxTeachers, features } = req.body;
  
  const school = await School.findById(req.params.id);
  
  if (!school) {
    throw new AppError('School not found', 404);
  }
  
  if (plan) school.subscription.plan = plan;
  if (endDate) school.subscription.endDate = endDate;
  if (maxStudents) school.subscription.maxStudents = maxStudents;
  if (maxTeachers) school.subscription.maxTeachers = maxTeachers;
  if (features) school.subscription.features = { ...school.subscription.features, ...features };
  
  await school.save();
  
  res.json({
    success: true,
    message: 'Subscription updated successfully',
    data: school
  });
});

// @desc    Get dynamic pricing plans for platform settings
// @route   GET /api/superadmin/settings/pricing-plans
// @access  Super Admin
export const getPricingPlansSettings = catchAsync(async (req, res) => {
  await ensureDefaultPricingPlans();

  const plans = await PricingPlan.find().sort({ displayOrder: 1 });

  res.json({
    success: true,
    data: {
      safeguards: {
        confirmationText: 'CONFIRM_PRICING_UPDATE',
        applyModes: ['new_subscriptions_only', 'next_renewal_all']
      },
      plans
    }
  });
});

// @desc    Publish pricing plans with safeguards
// @route   POST /api/superadmin/settings/pricing-plans/publish
// @access  Super Admin
export const publishPricingPlans = catchAsync(async (req, res) => {
  const { plans, applyMode = 'new_subscriptions_only', confirmText, reason = '' } = req.body;

  if (confirmText !== 'CONFIRM_PRICING_UPDATE') {
    throw new AppError('Confirmation text mismatch. Use CONFIRM_PRICING_UPDATE', 400);
  }

  if (!Array.isArray(plans) || plans.length === 0) {
    throw new AppError('No pricing plans provided for publish', 400);
  }

  if (!['new_subscriptions_only', 'next_renewal_all'].includes(applyMode)) {
    throw new AppError('Invalid apply mode selected', 400);
  }

  await ensureDefaultPricingPlans();

  const existingPlans = await PricingPlan.find();
  const existingMap = new Map(existingPlans.map((plan) => [plan.code, plan]));
  const validCodes = ['basic', 'premium', 'enterprise'];

  let impactedSchools = 0;
  const updateResults = [];

  for (const incomingPlan of plans) {
    const code = String(incomingPlan.code || '').toLowerCase();
    if (!validCodes.includes(code)) {
      throw new AppError(`Invalid plan code: ${incomingPlan.code}`, 400);
    }

    const monthlyPrice = Number(incomingPlan.monthlyPrice);
    const annualPrice = Number(incomingPlan.annualPrice);
    const maxStudents = incomingPlan.maxStudents === null || incomingPlan.maxStudents === '' ? null : Number(incomingPlan.maxStudents);
    const maxTeachers = incomingPlan.maxTeachers === null || incomingPlan.maxTeachers === '' ? null : Number(incomingPlan.maxTeachers);

    if (Number.isNaN(monthlyPrice) || monthlyPrice < 0) {
      throw new AppError(`Invalid monthly price for ${code}`, 400);
    }
    if (Number.isNaN(annualPrice) || annualPrice < 0) {
      throw new AppError(`Invalid annual price for ${code}`, 400);
    }
    if (maxStudents !== null && (Number.isNaN(maxStudents) || maxStudents < 0)) {
      throw new AppError(`Invalid max students for ${code}`, 400);
    }
    if (maxTeachers !== null && (Number.isNaN(maxTeachers) || maxTeachers < 0)) {
      throw new AppError(`Invalid max teachers for ${code}`, 400);
    }

    const existingPlan = existingMap.get(code);
    const historyEntry = existingPlan
      ? {
          version: existingPlan.version,
          monthlyPrice: existingPlan.monthlyPrice,
          annualPrice: existingPlan.annualPrice,
          maxStudents: existingPlan.maxStudents,
          maxTeachers: existingPlan.maxTeachers,
          changedAt: new Date(),
          changedBy: req.user?._id,
          reason: reason || 'Platform pricing publish'
        }
      : null;

    const updated = await PricingPlan.findOneAndUpdate(
      { code },
      {
        $set: {
          name: incomingPlan.name || code.charAt(0).toUpperCase() + code.slice(1),
          description: incomingPlan.description || '',
          monthlyPrice,
          annualPrice,
          maxStudents,
          maxTeachers,
          features: normalizeFeatures(incomingPlan.features),
          isActive: incomingPlan.isActive !== false,
          displayOrder: Number(incomingPlan.displayOrder || 0),
          'publishPolicy.applyMode': applyMode,
          'publishPolicy.lastPublishedAt': new Date(),
          'publishPolicy.lastPublishedBy': req.user?._id
        },
        ...(historyEntry ? { $push: { versionHistory: historyEntry }, $inc: { version: 1 } } : { $setOnInsert: { version: 1 } })
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    updateResults.push({
      code: updated.code,
      monthlyPrice: updated.monthlyPrice,
      annualPrice: updated.annualPrice,
      version: updated.version
    });

    await AuditLog.create({
      userId: req.user?._id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PRICING_PLAN_UPDATED',
      resource: 'PricingPlan',
      resourceId: updated._id,
      resourceName: updated.code,
      changes: {
        before: existingPlan
          ? {
              monthlyPrice: existingPlan.monthlyPrice,
              annualPrice: existingPlan.annualPrice,
              maxStudents: existingPlan.maxStudents,
              maxTeachers: existingPlan.maxTeachers,
              version: existingPlan.version
            }
          : null,
        after: {
          monthlyPrice: updated.monthlyPrice,
          annualPrice: updated.annualPrice,
          maxStudents: updated.maxStudents,
          maxTeachers: updated.maxTeachers,
          version: updated.version,
          applyMode
        }
      },
      status: 'success'
    });
  }

  if (applyMode === 'next_renewal_all') {
    const activePlanMap = new Map(updateResults.map((item) => [item.code, item]));
    const eligibleSchools = await School.find({
      status: { $in: ['active', 'inactive'] },
      'subscription.plan': { $in: validCodes }
    });

    for (const school of eligibleSchools) {
      const pricing = activePlanMap.get(school.subscription.plan);
      if (!pricing) continue;

      school.billing.monthlyPrice = pricing.monthlyPrice;
      school.billing.annualPrice = pricing.annualPrice;

      if (school.subscription.plan !== 'enterprise') {
        const publishedPlan = plans.find((plan) => String(plan.code || '').toLowerCase() === school.subscription.plan);
        if (publishedPlan && publishedPlan.maxStudents !== undefined) {
          school.subscription.maxStudents = publishedPlan.maxStudents === null || publishedPlan.maxStudents === ''
            ? null
            : Number(publishedPlan.maxStudents);
        }
      }

      await school.save();
      impactedSchools += 1;
    }
  }

  await AuditLog.create({
    userId: req.user?._id,
    userName: req.user?.name,
    userRole: req.user?.role,
    action: 'PRICING_PUBLISHED',
    resource: 'PlatformSettings',
    resourceName: 'DynamicPricingPlans',
    changes: {
      before: null,
      after: {
        applyMode,
        plans: updateResults,
        impactedSchools,
        reason
      }
    },
    status: 'success'
  });

  res.json({
    success: true,
    message: 'Pricing plans published successfully',
    data: {
      applyMode,
      impactedSchools,
      plans: updateResults,
      safeguards: {
        confirmationRequired: true,
        immutableBillingHistory: true,
        auditLogged: true
      }
    }
  });
});

// @desc    Get platform statistics
// @route   GET /api/superadmin/statistics
// @access  Super Admin
export const getPlatformStatistics = catchAsync(async (req, res) => {
  const schools = await School.find();
  
  // Calculate total users across all schools
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalTeachers = await User.countDocuments({ role: 'teacher' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  
  // Calculate total resources
  const totalCourses = await Course.countDocuments();
  const totalAssignments = await Assignment.countDocuments();
  const totalAttendance = await Attendance.countDocuments();
  
  // Growth metrics (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newSchoolsThisMonth = await School.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });
  const newUsersThisMonth = await User.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });
  
  const schoolsByPlan = {
    trial: schools.filter(s => s.subscription?.plan === 'trial').length,
    basic: schools.filter(s => s.subscription?.plan === 'basic').length,
    premium: schools.filter(s => s.subscription?.plan === 'premium').length,
    enterprise: schools.filter(s => s.subscription?.plan === 'enterprise').length
  };

  const schoolsByStatus = {
    active: schools.filter(s => s.status === 'active').length,
    inactive: schools.filter(s => s.status === 'inactive').length,
    suspended: schools.filter(s => s.status === 'suspended').length
  };

  const averageStudentsPerSchool = schools.length > 0 ? Math.round(totalStudents / schools.length) : 0;
  const averageTeachersPerSchool = schools.length > 0 ? Math.round(totalTeachers / schools.length) : 0;
  const averageCoursesPerSchool = schools.length > 0 ? Math.round(totalCourses / schools.length) : 0;
  
  res.json({
    success: true,
    data: {
      schools: {
        total: schools.length,
        ...schoolsByStatus,
        byPlan: schoolsByPlan
      },
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        admins: totalAdmins,
        averageStudentsPerSchool,
        averageTeachersPerSchool
      },
      resources: {
        courses: totalCourses,
        assignments: totalAssignments,
        attendanceRecords: totalAttendance,
        averageCoursesPerSchool
      },
      growth: {
        newSchoolsThisMonth,
        newUsersThisMonth
      }
    }
  });
});
// @desc    Get subscription analytics (MRR, ARR, active subscriptions, plan breakdown)
// @route   GET /api/superadmin/analytics/subscriptions
// @access  Super Admin
export const getSubscriptionAnalytics = catchAsync(async (req, res) => {
  try {
    const schools = await School.find({ status: { $ne: 'suspended' } });
    
    // Calculate subscription metrics
    let totalMRR = 0;  // Monthly Recurring Revenue
    let totalARR = 0;  // Annual Recurring Revenue
    const activeSubscriptions = schools.filter(s => s.subscription.plan !== 'trial' && s.billing.paymentStatus === 'active').length;
    const overduPayments = schools.filter(s => s.billing.paymentStatus === 'overdue').length;
    
    // Plan breakdown
    const planBreakdown = {
      trial: { count: 0, revenue: 0 },
      basic: { count: 0, revenue: 0 },
      premium: { count: 0, revenue: 0 },
      enterprise: { count: 0, revenue: 0 }
    };
    
    // Calculate MRR and ARR
    schools.forEach(school => {
      const plan = school.subscription.plan;
      planBreakdown[plan].count++;
      
      // Calculate month's revenue
      if (school.billing.billingCycle === 'monthly') {
        totalMRR += school.billing.monthlyPrice || 0;
        totalARR += (school.billing.monthlyPrice || 0) * 12;
      } else if (school.billing.billingCycle === 'annual') {
        totalMRR += (school.billing.annualPrice || 0) / 12;
        totalARR += school.billing.annualPrice || 0;
      }
      
      // Plan-wise revenue
      if (school.billing.billingCycle === 'monthly') {
        planBreakdown[plan].revenue += school.billing.monthlyPrice || 0;
      } else {
        planBreakdown[plan].revenue += (school.billing.annualPrice || 0) / 12;
      }
    });
    
    res.json({
      success: true,
      data: {
        metrics: {
          totalMRR: Math.round(totalMRR * 100) / 100,    // Monthly revenue
          totalARR: Math.round(totalARR * 100) / 100,    // Annual revenue
          activeSubscriptions,
          overduPayments,
          totalSchools: schools.length,
          trialSchools: planBreakdown.trial.count,
          paidSchools: activeSubscriptions + overduPayments
        },
        planBreakdown: planBreakdown,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Subscription analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @desc    Get revenue trends (last 6-12 months)
// @route   GET /api/superadmin/analytics/revenue-trends
// @access  Super Admin
export const getRevenueTrends = catchAsync(async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsNum = parseInt(months) || 6;
    
    // Get all schools and their payment history
    const schools = await School.find({ status: { $ne: 'suspended' } });
    
    // Generate monthly data for last N months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = [];
    
    for (let i = monthsNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      let monthlyRevenue = 0;
      let subscriptionCount = 0;
      
      // Calculate revenue for this month
      schools.forEach(school => {
        // Check if subscription was active in this month
        const subStartDate = new Date(school.subscription.startDate);
        const paymentDate = school.billing.lastPaymentDate ? new Date(school.billing.lastPaymentDate) : subStartDate;
        
        if (subStartDate.getFullYear() < year || 
            (subStartDate.getFullYear() === year && subStartDate.getMonth() <= month)) {
          
          if (school.billing.billingCycle === 'monthly') {
            monthlyRevenue += school.billing.monthlyPrice || 0;
          } else if (school.billing.billingCycle === 'annual') {
            monthlyRevenue += (school.billing.annualPrice || 0) / 12;
          }
          
          if (school.subscription.plan !== 'trial') {
            subscriptionCount++;
          }
        }
      });
      
      trendData.push({
        month: monthNames[month],
        revenue: Math.round(monthlyRevenue * 100) / 100,
        subscriptions: subscriptionCount
      });
    }
    
    res.json({
      success: true,
      data: {
        trends: trendData,
        currency: 'INR',
        period: `Last ${monthsNum} months`
      }
    });
  } catch (error) {
    console.error('Revenue trends error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @desc    Get subscription list with payment status
// @route   GET /api/superadmin/analytics/subscriptions-list
// @access  Super Admin
export const getSubscriptionsList = catchAsync(async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentStatus = 'all', plan = 'all' } = req.query;
    
    const query = { status: { $ne: 'suspended' } };
    
    if (paymentStatus !== 'all') {
      query['billing.paymentStatus'] = paymentStatus;
    }
    
    if (plan !== 'all') {
      query['subscription.plan'] = plan;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const schools = await School.find(query)
      .select('name code email subscription billing stats status createdAt')
      .sort({ 'billing.nextPaymentDate': 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await School.countDocuments(query);
    
    // Format subscription data
    const subscriptionsList = schools.map(school => ({
      _id: school._id,
      name: school.name,
      code: school.code,
      email: school.email,
      status: school.status,
      plan: school.subscription.plan,
      startDate: school.subscription.startDate,
      endDate: school.subscription.endDate,
      maxStudents: school.subscription.maxStudents,
      currentStudents: school.stats.totalStudents,
      monthlyPrice: school.billing.monthlyPrice || 0,
      annualPrice: school.billing.annualPrice || 0,
      billingCycle: school.billing.billingCycle,
      paymentStatus: school.billing.paymentStatus,
      lastPaymentDate: school.billing.lastPaymentDate,
      nextPaymentDate: school.billing.nextPaymentDate,
      failedPaymentAttempts: school.billing.failedPaymentAttempts,
      monthlyRevenue: school.billing.billingCycle === 'monthly' 
        ? school.billing.monthlyPrice 
        : (school.billing.annualPrice || 0) / 12
    }));
    
    res.json({
      success: true,
      data: {
        subscriptions: subscriptionsList,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Subscriptions list error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
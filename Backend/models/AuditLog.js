import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: String,
  userRole: String,
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE',
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_DELETED',
      'ENROLLMENT_CREATED', 'ENROLLMENT_DELETED',
      'GRADE_SUBMITTED', 'ATTENDANCE_MARKED',
      'FEE_CREATED', 'PAYMENT_RECORDED',
      'LEAVE_APPROVED', 'LEAVE_REJECTED',
      'ANNOUNCEMENT_POSTED', 'ANNOUNCEMENT_DELETED',
      'PRICING_PLAN_UPDATED', 'PRICING_PUBLISHED'
    ]
  },
  resource: {
    type: String,
    enum: [
      'User', 'Course', 'Enrollment', 'Grade', 'Attendance',
      'Fee', 'Payment', 'Leave', 'Announcement', 'Quiz',
      'Module', 'Feedback', 'Submission', 'Timetable',
      'PricingPlan', 'PlatformSettings'
    ],
    required: true
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceName: String,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 7776000 // Auto-delete after 90 days
  }
}, { timestamps: false });

export default mongoose.model('AuditLog', auditLogSchema);

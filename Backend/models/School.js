import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    minlength: [3, 'School name must be at least 3 characters long']
  },
  code: {
    type: String,
    required: [true, 'School code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'School code must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'School email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  allowedEmailDomains: {
    type: [String],
    default: [],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'School phone is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  principal: {
    name: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'basic', 'premium', 'enterprise'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    maxStudents: {
      type: Number,
      default: 100
    },
    maxTeachers: {
      type: Number,
      default: 10
    },
    features: {
      messaging: { type: Boolean, default: true },
      library: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      grades: { type: Boolean, default: true },
      fees: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false }
    }
  },
  billing: {
    pricingModel: {
      type: String,
      enum: ['per_student', 'per_course', 'flat_fee'],
      default: 'per_student'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    monthlyPrice: {
      type: Number,
      default: 0
    },
    annualPrice: {
      type: Number,
      default: 0
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly'
    },
    paymentStatus: {
      type: String,
      enum: ['active', 'overdue', 'failed', 'cancelled'],
      default: 'active'
    },
    lastPaymentDate: {
      type: Date,
      default: null
    },
    nextPaymentDate: {
      type: Date,
      default: null
    },
    failedPaymentAttempts: {
      type: Number,
      default: 0
    },
    custom: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 },
    totalAdmins: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 }
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    academicYearStart: {
      type: String,
      default: 'September'
    },
    gradeSystem: {
      type: String,
      enum: ['letter', 'numeric', 'percentage'],
      default: 'letter'
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
// Note: code field already has unique index from schema definition
schoolSchema.index({ status: 1 });
schoolSchema.index({ 'subscription.plan': 1 });
schoolSchema.index({ allowedEmailDomains: 1 });

// Methods
schoolSchema.methods.isSubscriptionActive = function() {
  if (!this.subscription.endDate) return true;
  return new Date() < this.subscription.endDate;
};

schoolSchema.methods.canAddStudent = function() {
  return this.stats.totalStudents < this.subscription.maxStudents;
};

schoolSchema.methods.canAddTeacher = function() {
  return this.stats.totalTeachers < this.subscription.maxTeachers;
};

const School = mongoose.model('School', schoolSchema);

export default School;

import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema({
  label: { type: String, trim: true, required: true }
}, { _id: false });

const pricingPlanSchema = new mongoose.Schema({
  code: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  annualPrice: {
    type: Number,
    required: true,
    min: 0
  },
  maxStudents: {
    type: Number,
    default: null,
    min: 0
  },
  maxTeachers: {
    type: Number,
    default: null,
    min: 0
  },
  features: {
    type: [featureSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  publishPolicy: {
    applyMode: {
      type: String,
      enum: ['new_subscriptions_only', 'next_renewal_all'],
      default: 'new_subscriptions_only'
    },
    lastPublishedAt: {
      type: Date,
      default: null
    },
    lastPublishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  versionHistory: {
    type: [
      {
        version: Number,
        monthlyPrice: Number,
        annualPrice: Number,
        maxStudents: Number,
        maxTeachers: Number,
        changedAt: Date,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reason: String
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);

export default PricingPlan;

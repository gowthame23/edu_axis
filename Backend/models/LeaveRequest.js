import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterRole: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'casual', 'earned', 'maternity', 'paternity', 'emergency', 'personal', 'other'],
    default: 'other'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    min: 1
  },
  reason: {
    type: String,
    trim: true,
    required: [true, 'Reason is required'],
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewRemarks: {
    type: String,
    trim: true,
    maxlength: 300
  }
}, {
  timestamps: true
});

// Pre-save to calculate number of days
leaveRequestSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    // Normalize time
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    this.days = diff > 0 ? diff : 1;
  }
  next();
});

leaveRequestSchema.index({ requesterId: 1, startDate: -1 });
leaveRequestSchema.index({ status: 1, startDate: -1 });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
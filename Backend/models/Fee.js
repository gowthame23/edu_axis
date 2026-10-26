import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Fee title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Fee amount is required'],
    min: [0, 'Fee amount cannot be negative']
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer', 'Annual'],
    default: 'Annual'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  appliesTo: {
    type: String,
    enum: ['all', 'grade-specific'],
    default: 'all'
  },
  grades: [{
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  }] // Which grades this fee applies to
}, {
  timestamps: true
});

const Fee = mongoose.model('Fee', feeSchema);

export default Fee;

import mongoose from 'mongoose';
// Remarkind the schema for student remarks made by teachers or admins
const remarkSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  type: {
    type: String,
    enum: ['academic', 'behavioral', 'achievement', 'concern', 'general'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  date: {
    type: Date,
    default: Date.now
  },
  isPositive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
remarkSchema.index({ studentId: 1, date: -1 });

const Remark = mongoose.model('Remark', remarkSchema);

export default Remark;

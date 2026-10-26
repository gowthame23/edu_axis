import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
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
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  maxScore: {
    type: Number,
    default: 100
  },
  type: {
    type: String,
    enum: ['test', 'quiz', 'assignment', 'midterm', 'final', 'project'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer', 'Annual'],
    default: 'Annual'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
gradeSchema.index({ studentId: 1 });
gradeSchema.index({ studentId: 1, subject: 1 });

const Grade = mongoose.model('Grade', gradeSchema);

export default Grade;

import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'pending', 'waitlisted'],
    default: 'active'
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'Incomplete', null],
    default: null
  },
  marks: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  attendance: {
    totalClasses: { type: Number, default: 0 },
    classesAttended: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  completedModules: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    completedAt: Date
  }],
  enrollmentReason: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1, courseId: 1, schoolId: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);

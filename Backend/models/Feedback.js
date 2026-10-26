import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for anonymous feedback
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  type: {
    type: String,
    enum: ['course'],
    required: true,
    default: 'course'
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    contentQuality: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    teacherPerformance: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    materialRelevance: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    difficulty: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  comments: {
    type: String,
    trim: true
  },
  strengths: [String], // What was good
  areasForImprovement: [String], // What needs improvement
  suggestions: String,
  isAnonymous: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'acted-upon'],
    default: 'submitted'
  },
  adminResponse: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);

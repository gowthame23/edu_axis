import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  duration: {
    type: Number, // in minutes
    required: true,
    default: 30
  },
  passingScore: {
    type: Number,
    required: true,
    default: 70,
    min: 0,
    max: 100
  },
  questions: [{
    id: mongoose.Schema.Types.ObjectId,
    question: String,
    type: {
      type: String,
      enum: ['multiple-choice', 'short-answer', 'essay', 'true-false'],
      default: 'multiple-choice'
    },
    options: [String], // For multiple choice
    correctAnswer: String,
    marks: { type: Number, default: 1 },
    explanation: String
  }],
  totalMarks: {
    type: Number,
    required: true,
    default: 100
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  showAnswers: {
    type: Boolean,
    default: true
  },
  prerequisiteModuleId: mongoose.Schema.Types.ObjectId,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);

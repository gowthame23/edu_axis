import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
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
  score: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  percentageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'in-progress', 'submitted'],
    default: 'in-progress'
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    studentAnswer: String,
    isCorrect: Boolean,
    marksObtained: Number
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number, // in minutes
  attemptNumber: {
    type: Number,
    default: 1
  },
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);

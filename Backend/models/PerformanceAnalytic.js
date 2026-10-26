import mongoose from 'mongoose';

const performanceAnalyticSchema = new mongoose.Schema({
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
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  assignments: {
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    scores: [Number]
  },
  tests: {
    quizzesTaken: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 0 },
    scores: [Number]
  },
  attendance: {
    totalClasses: { type: Number, default: 0 },
    classesAttended: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  classData: {
    classAverage: { type: Number, default: 0 },
    classMedian: { type: Number, default: 0 },
    studentRank: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 }
  },
  riskFactors: [String], // e.g., ['Low Attendance', 'Failing Tests', 'Late Submissions']
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  trend: {
    type: String,
    enum: ['improving', 'stable', 'declining'],
    default: 'stable'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('PerformanceAnalytic', performanceAnalyticSchema);

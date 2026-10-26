import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  content: {
    type: String,
    default: ''
  },
  materialUrl: String,
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  prerequisites: [mongoose.Schema.Types.ObjectId], // References to other module IDs
  hasQuiz: {
    type: Boolean,
    default: false
  },
  quizId: mongoose.Schema.Types.ObjectId,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Module', moduleSchema);

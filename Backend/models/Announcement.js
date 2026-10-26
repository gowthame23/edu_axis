import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [10, 'Content must be at least 10 characters long']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'teacher'],
    default: 'admin'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'specific'],
    default: 'all'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  grade: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hiddenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for faster queries
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ createdAt: -1 });

announcementSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;

import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long']
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  // Grade and section for targeting students
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'All'],
    default: 'All'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  totalMarks: {
    type: Number,
    default: 100,
    min: 1
  },
  attachments: [{
    name: String,          // Original filename
    filename: String,      // Stored filename on server
    path: String,          // URL path to access file
    size: Number,          // File size in bytes
    mimetype: String,      // MIME type
    url: String            // For backward compatibility with URL-based attachments
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
assignmentSchema.index({ grade: 1, section: 1, status: 1 });
assignmentSchema.index({ teacherId: 1 });

// Virtual to check if overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status === 'active';
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;

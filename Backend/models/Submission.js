import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true
  },
  files: [{
    name: String,
    filename: String,
    path: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  attachments: [{
    name: String,
    filename: String,
    path: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late'],
    default: 'submitted'
  },
  marks: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    trim: true
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure one submission per student per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;

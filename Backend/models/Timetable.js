import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  // Target audience
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  section: {
    type: String,
    required: false,
    enum: ['A', 'B', 'C', 'D', 'E', 'All'],
    default: 'All'
  },
  
  // Academic details
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    default: 'Fall'
  },

  // Timetable file (PDF/image)
  file: {
    path: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number },
    mimetype: { type: String }
  },

  // Effective dates
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for quick lookups
timetableSchema.index({ grade: 1, section: 1, isActive: 1 });
timetableSchema.index({ academicYear: 1, semester: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
    default: 'present'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by (teacher ID) is required']
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ courseId: 1, date: -1 });

// Compound index to prevent duplicate attendance for same student, course, and date
attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;

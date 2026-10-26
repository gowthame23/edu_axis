import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  grade: { type: String, required: true },
  subject: { type: String, required: true },
  dayOfWeek: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true }, // HH:MM
  endTime: { type: String, required: true },   // HH:MM
  room: { type: String },
}, { timestamps: true });

scheduleSchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 });
scheduleSchema.index({ courseId: 1, dayOfWeek: 1, startTime: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
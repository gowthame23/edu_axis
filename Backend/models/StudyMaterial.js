import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
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
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  grade: {
    type: Number,
    required: [true, 'Grade is required'],
    min: 1,
    max: 12
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

studyMaterialSchema.index({ grade: 1, courseId: 1 });
studyMaterialSchema.index({ uploadedBy: 1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
export default StudyMaterial;

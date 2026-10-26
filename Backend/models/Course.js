import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    minlength: [2, 'Course name must be at least 2 characters long']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Course code must be at least 3 characters long']
  },
  description: {
    type: String,
    trim: true
  },
  teacher: {
    type: String,
    default: 'TBD'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: {
    type: Number,
    default: 0,
    min: [0, 'Number of students cannot be negative']
  },
  credits: {
    type: Number,
    required: true,
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6'],
    default: 3
  },
  semester: {
    type: String,
    enum: ['Annual', 'Fall', 'Spring', 'Summer'],
    default: 'Annual'
  },
  grade: {
    type: Number,
    required: [true, 'Grade is required'],
    min: [1, 'Grade must be at least 1'],
    max: [12, 'Grade cannot exceed 12']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
courseSchema.index({ teacherId: 1 });
courseSchema.index({ schoolId: 1, grade: 1, status: 1, createdAt: -1 });
courseSchema.index({ schoolId: 1, name: 'text', code: 'text', description: 'text' });
// Note: code field already has unique: true which creates an index automatically

// Post-save hook to update school stats
courseSchema.post('save', async function(doc) {
  if (doc.schoolId) {
    try {
      const School = mongoose.model('School');
      const school = await School.findById(doc.schoolId);
      
      if (school) {
        const Course = mongoose.model('Course');
        const totalCourses = await Course.countDocuments({ schoolId: doc.schoolId, status: 'active' });
        
        school.stats.totalCourses = totalCourses;
        await school.save();
      }
    } catch (error) {
      console.error('Error updating school stats:', error);
    }
  }
});

// Post-remove hook to update school stats when course is deleted
courseSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.schoolId) {
    try {
      const School = mongoose.model('School');
      const school = await School.findById(doc.schoolId);
      
      if (school) {
        const Course = mongoose.model('Course');
        const totalCourses = await Course.countDocuments({ schoolId: doc.schoolId, status: 'active' });
        
        school.stats.totalCourses = totalCourses;
        await school.save();
      }
    } catch (error) {
      console.error('Error updating school stats:', error);
    }
  }
});

const Course = mongoose.model('Course', courseSchema);

export default Course;

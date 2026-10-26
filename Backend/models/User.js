import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'admin', 'superadmin'],
    default: 'student'
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: function() { return this.role !== 'superadmin'; },
    index: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Student-specific fields
  grade: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    required: function() { return this.role === 'student'; }
  },
  teacherId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Teacher-specific fields
  subject: {
    type: String,
    trim: true
  },
  gradesTeaching: [{
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

userSchema.index({ schoolId: 1, role: 1, status: 1, createdAt: -1 });
userSchema.index({ schoolId: 1, grade: 1, role: 1 });
userSchema.index({ schoolId: 1, name: 'text', email: 'text', subject: 'text' });

// Pre-save hook to hash password and generate IDs
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate student/teacher IDs
  if (this.isNew) {
    if (this.role === 'student' && !this.studentId) {
      this.studentId = `STU${Date.now()}`;
    } else if (this.role === 'teacher' && !this.teacherId) {
      this.teacherId = `TCH${Date.now()}`;
    }
  }
  
  next();
});

// Post-save hook to update school stats
userSchema.post('save', async function(doc) {
  if (doc.schoolId && doc.role !== 'superadmin') {
    try {
      const School = mongoose.model('School');
      const school = await School.findById(doc.schoolId);
      
      if (school) {
        // Count users by role for this school
        const User = mongoose.model('User');
        const students = await User.countDocuments({ schoolId: doc.schoolId, role: 'student', status: 'active' });
        const teachers = await User.countDocuments({ schoolId: doc.schoolId, role: 'teacher', status: 'active' });
        const admins = await User.countDocuments({ schoolId: doc.schoolId, role: 'admin', status: 'active' });
        
        school.stats.totalStudents = students;
        school.stats.totalTeachers = teachers;
        school.stats.totalAdmins = admins;
        
        await school.save();
      }
    } catch (error) {
      console.error('Error updating school stats:', error);
    }
  }
});

// Post-remove hook to update school stats when user is deleted
userSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.schoolId && doc.role !== 'superadmin') {
    try {
      const School = mongoose.model('School');
      const school = await School.findById(doc.schoolId);
      
      if (school) {
        // Count users by role for this school
        const User = mongoose.model('User');
        const students = await User.countDocuments({ schoolId: doc.schoolId, role: 'student', status: 'active' });
        const teachers = await User.countDocuments({ schoolId: doc.schoolId, role: 'teacher', status: 'active' });
        const admins = await User.countDocuments({ schoolId: doc.schoolId, role: 'admin', status: 'active' });
        
        school.stats.totalStudents = students;
        school.stats.totalTeachers = teachers;
        school.stats.totalAdmins = admins;
        
        await school.save();
      }
    } catch (error) {
      console.error('Error updating school stats:', error);
    }
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = { 
    _id: this._id,
    email: this.email,
    role: this.role
  };
  
  // Add schoolId for non-superadmin users
  if (this.role !== 'superadmin' && this.schoolId) {
    payload.schoolId = this.schoolId;
  }
  
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  return token;
};

// Method to hide password in JSON responses
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  // Add id as string version of _id for frontend compatibility
  user.id = user._id.toString();
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;

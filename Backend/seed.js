import mongoose from 'mongoose';
import dotenv from 'dotenv';
import School from './models/School.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Announcement from './models/Announcement.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database!');

    // Check if school already exists
    let school = await School.findOne({ code: 'SCH001' });
    if (!school) {
      school = await School.create({
        name: 'Greenwood High School',
        code: 'SCH001',
        email: 'info@greenwood.edu',
        phone: '+1 234 567 8900',
        allowedEmailDomains: ['greenwood.edu'],
        address: {
          street: '123 Education Lane',
          city: 'Springfield',
          state: 'IL',
          country: 'USA',
          zipCode: '62701'
        },
        status: 'active'
      });
      console.log('Created sample School: Greenwood High School (Code: SCH001)');
    } else {
      console.log('School SCH001 already exists.');
    }

    // Seed Super Admin
    let superAdmin = await User.findOne({ email: 'superadmin@eduaxis.com' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'System SuperAdmin',
        email: 'superadmin@eduaxis.com',
        password: 'password123',
        role: 'superadmin',
        phone: '+1 000 000 0000'
      });
      console.log('Created Super Admin: superadmin@eduaxis.com / password123');
    }

    // Seed School Admin
    let admin = await User.findOne({ email: 'admin@greenwood.edu' });
    if (!admin) {
      admin = await User.create({
        name: 'School Admin',
        email: 'admin@greenwood.edu',
        password: 'password123',
        role: 'admin',
        schoolId: school._id,
        phone: '+1 234 567 8901'
      });
      console.log('Created Admin: admin@greenwood.edu / password123');
    }

    // Seed Teacher
    let teacher = await User.findOne({ email: 'teacher@greenwood.edu' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Prof. John Smith',
        email: 'teacher@greenwood.edu',
        password: 'password123',
        role: 'teacher',
        schoolId: school._id,
        subject: 'Mathematics',
        gradesTeaching: ['9', '10', '11', '12'],
        phone: '+1 234 567 8902'
      });
      console.log('Created Teacher: teacher@greenwood.edu / password123');
    }

    // Seed Student
    let student = await User.findOne({ email: 'student@greenwood.edu' });
    if (!student) {
      student = await User.create({
        name: 'Alice Johnson',
        email: 'student@greenwood.edu',
        password: 'password123',
        role: 'student',
        schoolId: school._id,
        grade: '10',
        section: 'A',
        phone: '+1 234 567 8903'
      });
      console.log('Created Student: student@greenwood.edu / password123');
    }

    // Seed sample Course
    let course = await Course.findOne({ code: 'MATH101', schoolId: school._id });
    if (!course) {
      await Course.create({
        name: 'Advanced Mathematics',
        code: 'MATH101',
        description: 'Comprehensive study of Algebra and Calculus',
        schoolId: school._id,
        teacher: teacher.name,
        teacherId: teacher._id,
        grade: '10',
        credits: 4
      });
      console.log('Created sample course: MATH101');
    }

    // Seed sample Announcement
    let announcement = await Announcement.findOne({ schoolId: school._id });
    if (!announcement) {
      await Announcement.create({
        title: 'Welcome to EduAxis!',
        content: 'The new academic semester portal is now active.',
        schoolId: school._id,
        createdBy: admin._id,
        createdByRole: 'admin',
        priority: 'high',
        targetAudience: 'all'
      });
      console.log('Created welcome announcement.');
    }

    console.log('\n--- SEED COMPLETE ---');
    console.log('You can now log in with:');
    console.log('Admin:      admin@greenwood.edu      / password123 (School Code: SCH001)');
    console.log('Teacher:    teacher@greenwood.edu    / password123 (School Code: SCH001)');
    console.log('Student:    student@greenwood.edu    / password123 (School Code: SCH001)');
    console.log('SuperAdmin: superadmin@eduaxis.com   / password123 (URL: /system-access)');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedDatabase();

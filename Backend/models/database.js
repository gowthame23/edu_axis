import User from './User.js';
import Course from './Course.js';
import Assignment from './Assignment.js';
import Announcement from './Announcement.js';
import Attendance from './Attendance.js';

// Initialize database with schema-based models
const users = [
  new User({
    id: '1',
    name: 'John Doe',
    email: 'student@eduaxis.com',
    password: 'student123',
    role: 'student',
    phone: '+1234567890',
    dateOfBirth: '2005-01-15',
    studentId: 'STU2025001'
  }),
  new User({
    id: '2',
    name: 'Prof. Smith',
    email: 'teacher@eduaxis.com',
    password: 'teacher123',
    role: 'teacher',
    phone: '+1234567891',
    dateOfBirth: '1985-05-20',
    teacherId: 'TCH001'
  }),
  new User({
    id: '3',
    name: 'Admin User',
    email: 'admin@eduaxis.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567892',
    dateOfBirth: '1980-03-10'
  })
];

const courses = [
  new Course({
    id: '1',
    name: 'Mathematics',
    code: 'MATH101',
    teacher: 'Dr. Smith',
    teacherId: '2',
    students: 45,
    description: 'Advanced Mathematics',
    credits: 4
  }),
  new Course({
    id: '2',
    name: 'Physics',
    code: 'PHY101',
    teacher: 'Prof. Johnson',
    teacherId: '2',
    students: 42,
    description: 'Physics Fundamentals',
    credits: 4
  }),
  new Course({
    id: '3',
    name: 'Chemistry',
    code: 'CHEM101',
    teacher: 'Dr. Williams',
    teacherId: '2',
    students: 38,
    description: 'Chemistry Basics',
    credits: 3
  }),
  new Course({
    id: '4',
    name: 'English',
    code: 'ENG101',
    teacher: 'Ms. Davis',
    teacherId: '2',
    students: 50,
    description: 'English Literature',
    credits: 3
  })
];

const assignments = [
  new Assignment({
    id: '1',
    title: 'Math Assignment 1',
    subject: 'Mathematics',
    courseId: '1',
    dueDate: '2025-10-30',
    status: 'pending',
    studentId: '1',
    teacherId: '2',
    description: 'Solve problems from chapter 5'
  }),
  new Assignment({
    id: '2',
    title: 'Physics Lab Report',
    subject: 'Physics',
    courseId: '2',
    dueDate: '2025-10-28',
    status: 'submitted',
    studentId: '1',
    teacherId: '2',
    description: 'Lab report on Newton\'s laws'
  }),
  new Assignment({
    id: '3',
    title: 'English Essay',
    subject: 'English',
    courseId: '4',
    dueDate: '2025-11-05',
    status: 'pending',
    studentId: '1',
    teacherId: '2',
    description: 'Essay on Shakespeare'
  })
];

const announcements = [
  new Announcement({
    id: '1',
    title: 'Midterm Exams Schedule',
    content: 'Exams start from November 1st',
    date: '2025-10-20',
    createdBy: '3',
    createdByRole: 'admin',
    priority: 'high'
  }),
  new Announcement({
    id: '2',
    title: 'Holiday Notice',
    content: 'School closed on October 31st',
    date: '2025-10-15',
    createdBy: '3',
    createdByRole: 'admin',
    priority: 'normal'
  })
];

const attendanceRecords = [];

// Database operations
export const db = {
  users,
  courses,
  assignments,
  announcements,
  attendanceRecords,
  
  // User operations
  findUserByEmail: (email) => users.find(u => u.email === email),
  findUserById: (id) => users.find(u => u.id === id),
  addUser: (userData) => {
    const user = new User(userData);
    const validation = user.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    users.push(user);
    return user;
  },
  updateUser: (id, updates) => {
    const user = users.find(u => u.id === id);
    if (user) {
      user.update(updates);
      return user;
    }
    return null;
  },
  deleteUser: (id) => {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users.splice(index, 1);
      return true;
    }
    return false;
  },
  
  // Course operations
  findCourseById: (id) => courses.find(c => c.id === id),
  findCoursesByTeacher: (teacherId) => courses.filter(c => c.teacherId === teacherId),
  addCourse: (courseData) => {
    const course = new Course(courseData);
    const validation = course.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    courses.push(course);
    return course;
  },
  updateCourse: (id, updates) => {
    const course = courses.find(c => c.id === id);
    if (course) {
      course.update(updates);
      return course;
    }
    return null;
  },
  
  // Assignment operations
  findAssignmentsByStudent: (studentId) => assignments.filter(a => a.studentId === studentId),
  findAssignmentsByCourse: (courseId) => assignments.filter(a => a.courseId === courseId),
  addAssignment: (assignmentData) => {
    const assignment = new Assignment(assignmentData);
    const validation = assignment.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    assignments.push(assignment);
    return assignment;
  },
  
  // Announcement operations
  getActiveAnnouncements: () => announcements.filter(a => a.isActive && !a.isExpired()),
  addAnnouncement: (announcementData) => {
    const announcement = new Announcement(announcementData);
    const validation = announcement.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    announcements.push(announcement);
    return announcement;
  },
  
  // Attendance operations
  markAttendance: (attendanceData) => {
    const attendance = new Attendance(attendanceData);
    const validation = attendance.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    attendanceRecords.push(attendance);
    return attendance;
  },
  getAttendanceByStudent: (studentId) => attendanceRecords.filter(a => a.studentId === studentId)
};


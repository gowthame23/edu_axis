// Imports
import User from '../models/User.js';
import Course from '../models/Course.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import Grade from '../models/Grade.js';
import Remark from '../models/Remark.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LibraryResource from '../models/LibraryResource.js';
import Timetable from '../models/Timetable.js';
import School from '../models/School.js';
import PricingPlan from '../models/PricingPlan.js';
import { assertSameSchoolStudent } from '../middleware/tenantGuards.js';
import { cacheKey, delCacheByPattern, getOrSetCache } from '../services/cacheService.js';
import { getRazorpayClient, getRazorpayPublicKey, toPaise, verifyRazorpaySignature } from '../services/razorpayService.js';

const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseCSVBuffer = (buffer) => {
  const csvText = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = (cols[idx] || '').trim();
    });
    records.push(row);
  }

  return records;
};

// Library resource admin management
export const adminCreateLibraryResource = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { title, description, author, category, tags, grade = 'All', courseId, linkUrl } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const resource = new LibraryResource({
      schoolId: req.schoolId,
      title,
      description: description || '',
      author: author || '',
      category: category || 'General',
      tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean)) : [],
      grade: String(grade || 'All'),
      courseId: courseId || undefined,
      isExternal: !!linkUrl,
      linkUrl: linkUrl || '',
      createdBy: adminId,
      isActive: true
    });

    if (req.file) {
      resource.file = {
        path: `/uploads/library/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    }

    await resource.save();
    res.status(201).json({ success: true, message: 'Resource created', resource });
  } catch (error) {
    console.error('Admin create library resource error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminListLibraryResources = async (req, res) => {
  try {
    const resources = await LibraryResource.find({ schoolId: req.schoolId }).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    console.error('Admin list library resources error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===== Timetable Management (Admin) =====
export const adminListTimetables = async (req, res) => {
  try {
    const { grade, section, academicYear, semester, isActive } = req.query;
    const query = { schoolId: req.schoolId };
    if (grade) query.grade = String(grade);
    if (section) query.section = String(section);
    if (academicYear) query.academicYear = String(academicYear);
    if (semester) query.semester = String(semester);
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';
    const items = await Timetable.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, timetables: items });
  } catch (error) {
    console.error('Admin list timetables error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminCreateOrUpdateTimetable = async (req, res) => {
  try {
    const { grade, section, academicYear = '2025-2026', semester = 'Fall', effectiveFrom, effectiveTo, isActive = true } = req.body;
    if (!grade) return res.status(400).json({ success: false, message: 'grade is required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'file is required' });
    const sectionValue = section && section !== '' ? String(section) : 'All';

    // Upsert timetable with file
    const doc = await Timetable.findOneAndUpdate(
      { schoolId: req.schoolId, grade: String(grade), section: sectionValue, academicYear: String(academicYear), semester: String(semester) },
      {
        $set: {
          schoolId: req.schoolId,
          file: {
            path: `/uploads/timetables/${req.file.filename}`,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
          },
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
          isActive: !!isActive
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, message: 'Timetable uploaded', timetable: doc });
  } catch (error) {
    console.error('Admin create/update timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminUpdateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { effectiveFrom, effectiveTo, isActive } = req.body;
    const updates = {};
    if (effectiveFrom) updates.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo) updates.effectiveTo = new Date(effectiveTo);
    if (typeof isActive !== 'undefined') updates.isActive = !!isActive;

    const doc = await Timetable.findOneAndUpdate({ _id: id, schoolId: req.schoolId }, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, message: 'Timetable updated', timetable: doc });
  } catch (error) {
    console.error('Admin update timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminDeleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    await Timetable.findOneAndDelete({ _id: id, schoolId: req.schoolId });
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (error) {
    console.error('Admin delete timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const adminDeleteLibraryResource = async (req, res) => {
  try {
    const { id } = req.params;
    await LibraryResource.findOneAndDelete({ _id: id, schoolId: req.schoolId });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('Admin delete library resource error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get admin dashboard data
export const getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalCourses] = await Promise.all([
      User.countDocuments({ role: 'student', schoolId: req.schoolId }),
      User.countDocuments({ role: 'teacher', schoolId: req.schoolId }),
      Course.countDocuments({ schoolId: req.schoolId })
    ]);

    res.json({
      overview: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalClasses: 28,
        activeUsers: totalStudents + totalTeachers
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get system stats
export const getStats = async (req, res) => {
  try {
    const [students, teachers, courses] = await Promise.all([
      User.countDocuments({ role: 'student', schoolId: req.schoolId }),
      User.countDocuments({ role: 'teacher', schoolId: req.schoolId }),
      Course.countDocuments({ schoolId: req.schoolId })
    ]);

    res.json({
      stats: {
        students,
        teachers,
        courses,
        classes: 28,
        attendance: 94,
        revenue: 2500000
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const { role, q } = req.query;
    const key = cacheKey('admin-users', [req.schoolId, role || 'all', q || '']);

    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        const filter = { schoolId: req.schoolId };
        if (role && role !== 'all') filter.role = role;
        if (q && q.trim()) {
          filter.$or = [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ];
        }

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
        return { users };
      },
      120
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, role, password, phone, dateOfBirth, grade, section } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const userData = {
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: (role || 'student').toLowerCase(),
      schoolId: req.schoolId, // Add school context from auth middleware
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    // Add student-specific fields
    if (grade) userData.grade = grade;
    if (section) userData.section = section;

    const newUser = await User.create(userData);

    await delCacheByPattern(`admin-users:${req.schoolId}:*`);

    res.json({
      success: true,
      message: 'User created successfully',
      user: newUser.toJSON()
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.email) updates.email = updates.email.toLowerCase();
    if (updates.role) updates.role = updates.role.toLowerCase();
    if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, schoolId: req.schoolId },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await delCacheByPattern(`admin-users:${req.schoolId}:*`);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ _id: id, schoolId: req.schoolId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await delCacheByPattern(`admin-users:${req.schoolId}:*`);

    res.json({
      success: true,
      message: 'User deleted successfully',
      id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get leave requests (admin)
export const getLeaveRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = { schoolId: req.schoolId };
    if (status !== 'all') filter.status = status;
    const requests = await LeaveRequest.find(filter)
      .populate('requesterId', 'name email role grade section')
      .sort({ createdAt: -1 });
    res.json({ success: true, leaveRequests: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Decide a leave request (approve/reject)
export const decideLeaveRequest = async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { action, remarks } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const lr = await LeaveRequest.findOne({ _id: id, schoolId: req.schoolId });
    if (!lr) return res.status(404).json({ success: false, message: 'Leave request not found' });

    lr.status = action === 'approve' ? 'approved' : 'rejected';
    lr.reviewedBy = admin._id;
    lr.reviewedAt = new Date();
    lr.reviewRemarks = remarks || '';
    await lr.save();

    // Populate requesterId and return the updated document
    const populatedLR = await LeaveRequest.findOne({ _id: id, schoolId: req.schoolId })
      .populate('requesterId', 'name email role grade section')
      .populate('reviewedBy', 'name');

    // Emit updates
    const io = req.app.get('io');
    if (io) {
      io.emit('leaveRequestUpdated', {
        id: lr._id,
        status: lr.status,
        reviewedBy: { id: String(admin._id), name: admin.name },
        reviewedAt: lr.reviewedAt,
        reviewRemarks: lr.reviewRemarks
      });
    }

    res.json({ success: true, message: `Leave ${lr.status}`, leaveRequest: populatedLR });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const bulkImportCSV = async (req, res) => {
  try {
    const { type = 'students' } = req.body;
    const importType = String(type).toLowerCase();

    if (!['students', 'teachers', 'courses'].includes(importType)) {
      return res.status(400).json({ success: false, message: 'Invalid import type' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const records = parseCSVBuffer(req.file.buffer);
    if (records.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV is empty or has invalid format' });
    }

    const summary = {
      type: importType,
      totalRows: records.length,
      created: 0,
      skipped: 0,
      errors: []
    };

    for (let index = 0; index < records.length; index++) {
      const row = records[index];
      const rowNumber = index + 2;

      try {
        if (importType === 'courses') {
          const name = row.name;
          const code = (row.code || '').toUpperCase();
          const grade = Number(row.grade);

          if (!name || !code || !Number.isFinite(grade)) {
            summary.skipped += 1;
            summary.errors.push({ row: rowNumber, reason: 'Course requires name, code, and numeric grade' });
            continue;
          }

          const exists = await Course.findOne({ schoolId: req.schoolId, code });
          if (exists) {
            summary.skipped += 1;
            summary.errors.push({ row: rowNumber, reason: `Course code ${code} already exists` });
            continue;
          }

          let teacherId = row.teacherid || '';
          let teacherName = row.teacher || 'TBD';

          if (!teacherId && row.teacheremail) {
            const teacherUser = await User.findOne({
              schoolId: req.schoolId,
              role: 'teacher',
              email: row.teacheremail.toLowerCase()
            });
            if (teacherUser) {
              teacherId = teacherUser._id;
              teacherName = teacherUser.name;
            }
          }

          await Course.create({
            schoolId: req.schoolId,
            name,
            code,
            description: row.description || '',
            teacher: teacherName,
            teacherId: teacherId || undefined,
            credits: Number(row.credits) || 3,
            grade,
            semester: row.semester || 'Annual'
          });

          summary.created += 1;
          continue;
        }

        const role = importType === 'students' ? 'student' : 'teacher';
        const name = row.name;
        const email = (row.email || '').toLowerCase();
        const password = row.password || 'ChangeMe123';

        if (!name || !email) {
          summary.skipped += 1;
          summary.errors.push({ row: rowNumber, reason: 'User requires name and email' });
          continue;
        }

        if (role === 'student' && !row.grade) {
          summary.skipped += 1;
          summary.errors.push({ row: rowNumber, reason: 'Student requires grade' });
          continue;
        }

        const exists = await User.findOne({ email });
        if (exists) {
          summary.skipped += 1;
          summary.errors.push({ row: rowNumber, reason: `Email ${email} already exists` });
          continue;
        }

        const userData = {
          name,
          email,
          password,
          role,
          schoolId: req.schoolId,
          phone: row.phone || undefined,
          dateOfBirth: row.dateofbirth ? new Date(row.dateofbirth) : undefined,
          grade: role === 'student' ? String(row.grade) : undefined,
          subject: role === 'teacher' ? (row.subject || undefined) : undefined,
          gradesTeaching: role === 'teacher' && row.gradesteaching
            ? row.gradesteaching.split('|').map((g) => g.trim()).filter(Boolean)
            : undefined
        };

        await User.create(userData);
        summary.created += 1;
      } catch (error) {
        summary.skipped += 1;
        summary.errors.push({ row: rowNumber, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed: ${summary.created} created, ${summary.skipped} skipped`,
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Bulk import failed', error: error.message });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ schoolId: req.schoolId }).sort({ createdAt: -1 });
    
    // Calculate enrolled student count for each course based on grade
    const coursesWithStudentCount = await Promise.all(courses.map(async (course) => {
      // Count all active students registered in the same grade as the course
      const studentCount = await User.countDocuments({
        schoolId: req.schoolId,
        role: 'student',
        grade: String(course.grade),
        status: 'active'
      });
      
      return {
        ...course.toObject(),
        students: studentCount
      };
    }));
    
    res.json({ courses: coursesWithStudentCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTeacherSubjects = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate teacher exists and belongs to this school
    const teacher = await User.findOne({
      _id: teacherId,
      schoolId: req.schoolId,
      role: 'teacher',
      status: 'active'
    }).select('name email teacherId phone');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get all courses/subjects taught by this teacher
    const courses = await Course.find({
      schoolId: req.schoolId,
      teacherId: teacherId
    }).sort({ grade: 1, name: 1 });

    // Calculate student count for each course
    const coursesWithDetails = await Promise.all(courses.map(async (course) => {
      const studentCount = await User.countDocuments({
        schoolId: req.schoolId,
        role: 'student',
        grade: String(course.grade),
        status: 'active'
      });

      return {
        _id: course._id,
        name: course.name,
        code: course.code,
        description: course.description,
        grade: course.grade,
        credits: course.credits,
        semester: course.semester,
        status: course.status,
        students: studentCount,
        createdAt: course.createdAt
      };
    }));

    // Group subjects by similar names (case-insensitive) for counting
    const subjectGroups = {};
    coursesWithDetails.forEach(course => {
      const normalizedName = course.name.toLowerCase().trim();
      if (!subjectGroups[normalizedName]) {
        subjectGroups[normalizedName] = {
          displayName: course.name,
          count: 0,
          courses: []
        };
      }
      subjectGroups[normalizedName].count++;
      subjectGroups[normalizedName].courses.push(course);
    });

    const groupedSubjects = Object.values(subjectGroups);

    res.json({
      success: true,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
        phone: teacher.phone
      },
      subjects: coursesWithDetails,
      groupedSubjects: groupedSubjects,
      totalSubjects: coursesWithDetails.length,
      activeSubjects: coursesWithDetails.filter(c => c.status === 'active').length,
      uniqueSubjects: groupedSubjects.length
    });
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { name, code, description, teacher, teacherId: providedTeacherId, credits, grade, semester } = req.body;

    // Prefer explicit teacherId if provided, otherwise resolve by name
    let teacherId = providedTeacherId || null;
    if (!teacherId && teacher && teacher !== 'TBD' && teacher.trim() !== '') {
      const teacherUser = await User.findOne({ name: teacher, role: 'teacher', schoolId: req.schoolId });
      if (teacherUser) teacherId = teacherUser._id;
    }

    const newCourse = await Course.create({
      schoolId: req.schoolId,
      name,
      code,
      teacherId,
      teacher: teacher || 'TBD',
      description,
      credits,
      grade,
      semester: semester || 'Annual'
    });

    res.json({
      success: true,
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If teacherId provided explicitly, keep it. Otherwise, if teacher name provided, resolve to teacherId
    if (updates.teacherId) {
      // keep provided teacherId
    } else if (updates.teacher && updates.teacher !== 'TBD' && updates.teacher.trim() !== '') {
      const teacherUser = await User.findOne({ name: updates.teacher, role: 'teacher', schoolId: req.schoolId });
      if (teacherUser) {
        updates.teacherId = teacherUser._id;
      }
    }

    const course = await Course.findOneAndUpdate(
      { _id: id, schoolId: req.schoolId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOneAndDelete({ _id: id, schoolId: req.schoolId });
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all classes
export const getClasses = async (req, res) => {
  res.json({
    classes: [
      { id: 1, name: 'Class 10-A', students: 45, teacher: 'Prof. Smith' },
      { id: 2, name: 'Class 10-B', students: 42, teacher: 'Prof. Johnson' },
      { id: 3, name: 'Class 11-A', students: 40, teacher: 'Dr. Williams' }
    ]
  });
};

// Get reports
export const getReports = async (req, res) => {
  res.json({
    reports: {
      attendance: { overall: 94, trend: 'up' },
      performance: { average: 85, trend: 'stable' },
      fees: { collected: 75, pending: 25 }
    }
  });
};

// ================= FEE MANAGEMENT =================

// Get all fees
export const getFees = async (req, res) => {
  try {
    const fees = await Fee.find({ schoolId: req.schoolId }).sort({ createdAt: -1 });
    res.json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create new fee
export const createFee = async (req, res) => {
  try {
    const { title, amount, description, dueDate, academicYear, semester, appliesTo, grades } = req.body;

    if (!title || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, amount, and due date are required' });
    }

    const newFee = await Fee.create({
      schoolId: req.schoolId,
      title,
      amount,
      description,
      dueDate: new Date(dueDate),
      academicYear,
      semester,
      appliesTo: appliesTo || 'all',
      grades: appliesTo === 'grade-specific' ? grades : []
    });

    await delCacheByPattern(`student-fees:${req.schoolId}:*`);

    res.json({ success: true, message: 'Fee created successfully', fee: newFee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update fee
export const updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const updatedFee = await Fee.findOneAndUpdate(
      { _id: id, schoolId: req.schoolId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedFee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    await delCacheByPattern(`student-fees:${req.schoolId}:*`);

    res.json({ success: true, message: 'Fee updated successfully', fee: updatedFee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete fee
export const deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if fee exists
    const fee = await Fee.findOne({ _id: id, schoolId: req.schoolId });
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    // Check if there are any completed payments for this fee
    const completedPayments = await Payment.countDocuments({ 
      schoolId: req.schoolId,
      feeId: id, 
      status: 'completed' 
    });

    if (completedPayments > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete fee. ${completedPayments} student(s) have already paid this fee.`,
        paymentsCount: completedPayments
      });
    }

    // Delete the fee
    await Fee.findOneAndDelete({ _id: id, schoolId: req.schoolId });

    // Also delete any pending/failed payments for this fee
    await Payment.deleteMany({ schoolId: req.schoolId, feeId: id, status: { $in: ['pending', 'failed'] } });

    await delCacheByPattern(`student-fees:${req.schoolId}:*`);

    res.json({ 
      success: true, 
      message: 'Fee deleted successfully', 
      id 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ================= PAYMENT MANAGEMENT =================

// Get all payments with filters
export const getPayments = async (req, res) => {
  try {
    const { studentName, paymentMethod, status, startDate, endDate } = req.query;
    const query = { schoolId: req.schoolId };

    // Filter by student name
    if (studentName && studentName.trim()) {
      query.$or = [
        { studentName: { $regex: studentName.trim(), $options: 'i' } },
        { studentEmail: { $regex: studentName.trim(), $options: 'i' } }
      ];
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'name email phone studentId')
      .populate('feeId', 'title amount')
      .sort({ paymentDate: -1 });

    const dedupedPayments = (() => {
      const completedRazorpayPayments = payments.filter(
        (payment) => payment.status === 'completed' && payment.razorpayPaymentId
      );

      const latestByEntity = new Map();
      for (const payment of completedRazorpayPayments) {
        const key = payment.paymentType === 'subscription'
          ? `subscription:${String(payment.schoolId)}`
          : `fee:${String(payment.studentId || '')}:${String(payment.feeId || payment.feeTitle || '')}`;

        if (!latestByEntity.has(key)) {
          latestByEntity.set(key, payment);
        }
      }

      return Array.from(latestByEntity.values());
    })();

    // Calculate stats
    const totalAmount = dedupedPayments.reduce((sum, p) => sum + p.amount, 0);
    const completedPayments = dedupedPayments.filter(p => p.status === 'completed').length;

    res.json({
      success: true,
      payments: dedupedPayments,
      stats: {
        total: dedupedPayments.length,
        completed: completedPayments,
        totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create payment (for testing or manual entry)
export const createPayment = async (req, res) => {
  try {
    const { studentId, feeId, amount, paymentMethod, transactionId, remarks } = req.body;

    if (!studentId || !feeId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, Fee ID, amount, and payment method are required' 
      });
    }

    // Get student and fee details
    const student = await assertSameSchoolStudent(studentId, req.schoolId, {
      notFoundMessage: 'Student not found',
      forbiddenMessage: 'Student is not in your school'
    });
    const fee = await Fee.findOne({ _id: feeId, schoolId: req.schoolId });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    const newPayment = await Payment.create({
      schoolId: req.schoolId,
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      feeId,
      feeTitle: fee.title,
      amount,
      paymentMethod,
      transactionId,
      remarks,
      status: 'completed'
    });

    res.json({ success: true, message: 'Payment recorded successfully', payment: newPayment });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
  try {
    // Get total number of payments (both completed and pending)
    const totalPayments = await Payment.countDocuments({ schoolId: req.schoolId });
    
    // Get completed payments count
    const completedPayments = await Payment.countDocuments({ schoolId: req.schoolId, status: 'completed' });
    
    // Get total amount from completed payments
    const totalAmount = await Payment.aggregate([
      { $match: { schoolId: req.schoolId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get payment breakdown by method
    const paymentsByMethod = await Payment.aggregate([
      { $match: { schoolId: req.schoolId, status: 'completed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    // Calculate total expected fees (for all active fees)
    const allFees = await Fee.find({ schoolId: req.schoolId });
    const allStudents = await User.find({ schoolId: req.schoolId, role: 'student' });
    
    let totalExpectedAmount = 0;
    let totalExpectedPayments = 0;  // Total number of expected payments
    
    for (const fee of allFees) {
      let applicableStudentCount = 0;
      
      if (fee.appliesTo === 'all') {
        applicableStudentCount = allStudents.length;
      } else if (fee.appliesTo === 'specific' && fee.grades && fee.grades.length > 0) {
        applicableStudentCount = allStudents.filter(student => 
          fee.grades.includes(student.grade?.toString())
        ).length;
      }
      
      totalExpectedAmount += fee.amount * applicableStudentCount;
      totalExpectedPayments += applicableStudentCount;  // Each student = 1 expected payment
    }

    const collectedAmount = totalAmount[0]?.total || 0;
    const outstandingAmount = Math.max(0, totalExpectedAmount - collectedAmount);

    res.json({
      success: true,
      data: {
        total: totalExpectedPayments,  // Expected number of payments
        completed: completedPayments,
        totalAmount: collectedAmount,
        expectedAmount: totalExpectedAmount,
        outstandingAmount: outstandingAmount,
        byMethod: paymentsByMethod
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get monthly payment trends for charts
export const getPaymentTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsNum = parseInt(months) || 6;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);

    // Get completed payments grouped by month
    const completedPayments = await Payment.aggregate([
      {
        $match: {
          schoolId: req.schoolId,
          status: 'completed',
          paymentDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          collected: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get all fees (not just in date range, to capture all outstanding amounts)
    const fees = await Fee.find({
      schoolId: req.schoolId
    });

    // Get all students in the school for fee calculation
    const allStudents = await User.find({ schoolId: req.schoolId, role: 'student' });

    // Calculate total expected fees per month and overall outstanding
    const expectedByMonth = {};
    let totalOutstanding = 0;
    
    for (const fee of fees) {
      const feeDate = new Date(fee.dueDate);
      const monthKey = `${feeDate.getFullYear()}-${feeDate.getMonth() + 1}`;
      
      // Determine how many students this fee applies to
      let applicableStudentCount = 0;
      
      if (fee.appliesTo === 'all') {
        // Fee applies to all students
        applicableStudentCount = allStudents.length;
      } else if (fee.appliesTo === 'specific' && fee.grades && fee.grades.length > 0) {
        // Fee applies to specific grades
        applicableStudentCount = allStudents.filter(student => 
          fee.grades.includes(student.grade?.toString())
        ).length;
      }
      
      // Calculate total expected for this fee (fee amount × number of students)
      const totalExpected = fee.amount * applicableStudentCount;
      expectedByMonth[monthKey] = (expectedByMonth[monthKey] || 0) + totalExpected;
      totalOutstanding += totalExpected;
    }
    
    // Get total collected amount across all time
    const totalCollectedResult = await Payment.aggregate([
      { $match: { schoolId: req.schoolId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCollected = totalCollectedResult[0]?.total || 0;
    const remainingOutstanding = Math.max(0, totalOutstanding - totalCollected);

    // Format data for frontend charts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = [];
    
    for (let i = monthsNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${month}`;
      
      // Find collected amount for this month
      const monthData = completedPayments.find(
        p => p._id.year === year && p._id.month === month
      );
      
      const collected = monthData ? monthData.collected : 0;
      const expected = expectedByMonth[monthKey] || 0;
      
      // For current month, show all remaining outstanding
      // For past months, show what was expected vs collected for that month
      let pending;
      if (i === 0) {
        // Current/most recent month - show all outstanding
        pending = remainingOutstanding;
      } else {
        // Historical months - show month-specific pending
        pending = Math.max(0, expected - collected);
      }
      
      trendData.push({
        month: monthNames[date.getMonth()],
        collected: collected,
        pending: pending
      });
    }

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Payment trends error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Export payments to CSV
export const exportPayments = async (req, res) => {
  try {
    const { type = 'payments', studentName, paymentMethod, status, startDate, endDate } = req.query;
    const exportType = String(type).toLowerCase();
    const formatDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    const toCsv = (columns, rows) => {
      const header = columns.map((c) => escapeCsv(c.label)).join(',');
      const body = rows.map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','));
      return [header, ...body].join('\n');
    };

    let columns = [];
    let rows = [];

    if (exportType === 'students') {
      const students = await User.find({ schoolId: req.schoolId, role: 'student' })
        .select('name email phone studentId grade status createdAt')
        .sort({ createdAt: -1 })
        .lean();
      columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'grade', label: 'Grade' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created Date' }
      ];
      rows = students.map((s) => ({
        ...s,
        createdAt: formatDate(s.createdAt)
      }));
    } else if (exportType === 'teachers') {
      const teachers = await User.find({ schoolId: req.schoolId, role: 'teacher' })
        .select('name email phone teacherId subject gradesTeaching status createdAt')
        .sort({ createdAt: -1 })
        .lean();
      columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'teacherId', label: 'Teacher ID' },
        { key: 'subject', label: 'Subject' },
        { key: 'gradesTeaching', label: 'Grades Teaching' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created Date' }
      ];
      rows = teachers.map((t) => ({
        ...t,
        gradesTeaching: Array.isArray(t.gradesTeaching) ? t.gradesTeaching.join('|') : '',
        createdAt: formatDate(t.createdAt)
      }));
    } else if (exportType === 'courses') {
      const courses = await Course.find({ schoolId: req.schoolId })
        .select('name code grade teacher credits semester status description createdAt')
        .sort({ createdAt: -1 })
        .lean();
      columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'grade', label: 'Grade' },
        { key: 'teacher', label: 'Teacher' },
        { key: 'credits', label: 'Credits' },
        { key: 'semester', label: 'Semester' },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Description' },
        { key: 'createdAt', label: 'Created Date' }
      ];
      rows = courses.map((c) => ({
        ...c,
        createdAt: formatDate(c.createdAt)
      }));
    } else if (exportType === 'attendance') {
      const attendanceRows = await Attendance.find({ schoolId: req.schoolId })
        .populate('studentId', 'name email studentId')
        .populate('courseId', 'name code')
        .populate('markedBy', 'name')
        .sort({ date: -1 })
        .lean();
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'studentEmail', label: 'Student Email' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'courseName', label: 'Course' },
        { key: 'courseCode', label: 'Course Code' },
        { key: 'status', label: 'Status' },
        { key: 'markedBy', label: 'Marked By' },
        { key: 'remarks', label: 'Remarks' }
      ];
      rows = attendanceRows.map((a) => ({
        date: formatDate(a.date),
        studentName: a.studentId?.name || '',
        studentEmail: a.studentId?.email || '',
        studentId: a.studentId?.studentId || '',
        courseName: a.courseId?.name || '',
        courseCode: a.courseId?.code || '',
        status: a.status,
        markedBy: a.markedBy?.name || '',
        remarks: a.remarks || ''
      }));
    } else if (exportType === 'grades') {
      const gradeRows = await Grade.find({ schoolId: req.schoolId })
        .populate('studentId', 'name email studentId')
        .populate('courseId', 'name')
        .sort({ date: -1 })
        .lean();
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'studentEmail', label: 'Student Email' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'subject', label: 'Subject' },
        { key: 'course', label: 'Course' },
        { key: 'score', label: 'Score' },
        { key: 'maxScore', label: 'Max Score' },
        { key: 'percentage', label: 'Percentage' },
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title' },
        { key: 'semester', label: 'Semester' },
        { key: 'remarks', label: 'Remarks' }
      ];
      rows = gradeRows.map((g) => ({
        date: formatDate(g.date),
        studentName: g.studentId?.name || '',
        studentEmail: g.studentId?.email || '',
        studentId: g.studentId?.studentId || '',
        subject: g.subject,
        course: g.courseId?.name || '',
        score: g.score,
        maxScore: g.maxScore,
        percentage: g.maxScore ? ((g.score / g.maxScore) * 100).toFixed(2) : '',
        type: g.type,
        title: g.title,
        semester: g.semester,
        remarks: g.remarks || ''
      }));
    } else {
      const query = { schoolId: req.schoolId };

      if (studentName && studentName.trim()) {
        query.$or = [
          { studentName: { $regex: studentName.trim(), $options: 'i' } },
          { studentEmail: { $regex: studentName.trim(), $options: 'i' } }
        ];
      }
      if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;
      if (status && status !== 'all') query.status = status;
      if (startDate || endDate) {
        query.paymentDate = {};
        if (startDate) query.paymentDate.$gte = new Date(startDate);
        if (endDate) query.paymentDate.$lte = new Date(endDate);
      }

      const payments = await Payment.find(query)
        .populate('studentId', 'studentId')
        .sort({ paymentDate: -1 })
        .lean();
      columns = [
        { key: 'receiptNumber', label: 'Receipt Number' },
        { key: 'date', label: 'Date' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'studentEmail', label: 'Student Email' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'feeTitle', label: 'Fee Title' },
        { key: 'amount', label: 'Amount' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'transactionId', label: 'Transaction ID' },
        { key: 'status', label: 'Status' },
        { key: 'remarks', label: 'Remarks' }
      ];
      rows = payments.map((p) => ({
        receiptNumber: p.receiptNumber,
        date: formatDate(p.paymentDate),
        studentName: p.studentName,
        studentEmail: p.studentEmail,
        studentId: p.studentId?.studentId || '',
        feeTitle: p.feeTitle,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId || '',
        status: p.status,
        remarks: p.remarks || ''
      }));
    }

    const csv = toCsv(columns, rows);
    const filename = `${exportType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Send fee reminder emails
export const sendFeeReminders = async (req, res) => {
  try {
    const { feeId } = req.body;

    if (!feeId) {
      return res.status(400).json({ success: false, message: 'Fee ID is required' });
    }

    const fee = await Fee.findOne({ _id: feeId, schoolId: req.schoolId });
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    // Get all students who haven't paid
    const allStudents = await User.find({ schoolId: req.schoolId, role: 'student', status: 'active' });
    const paidStudentIds = await Payment.find({ 
      schoolId: req.schoolId,
      feeId, 
      status: 'completed' 
    }).distinct('studentId');

    const unpaidStudents = allStudents.filter(
      s => !paidStudentIds.some(id => id.toString() === s._id.toString())
    );

    // TODO: Send actual emails here
    // For now, just return the list
    const reminders = unpaidStudents.map(s => ({
      studentId: s._id,
      name: s.name,
      email: s.email,
      feeTitle: fee.title,
      amount: fee.amount,
      dueDate: fee.dueDate
    }));

    res.json({
      success: true,
      message: `Reminders prepared for ${reminders.length} students`,
      reminders,
      count: reminders.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==================== CLASS MANAGEMENT APIs ====================

// Get class overview with statistics
export const getClassOverview = async (req, res) => {
  try {
    const students = await User.find({ schoolId: req.schoolId, role: 'student', status: 'active' })
      .select('name email grade studentId createdAt');

    // Calculate grade-wise statistics
    const gradeStats = {};
    for (let i = 1; i <= 12; i++) {
      const gradeStudents = students.filter(s => s.grade === String(i));
      gradeStats[i] = {
        total: gradeStudents.length
      };
    }

    // Overall statistics
    const totalStudents = students.length;

    res.json({
      success: true,
      data: {
        totalStudents,
        gradeStats,
        recentEnrollments: students
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(s => ({
            id: s._id,
            name: s.name,
            studentId: s.studentId,
            grade: s.grade,
            enrolledDate: s.createdAt
          }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get detailed student analytics
export const getStudentAnalytics = async (req, res) => {
  try {
    const { grade, search, performanceLevel, attendanceRange } = req.query;
    
    // Build query
    let query = { schoolId: req.schoolId, role: 'student', status: 'active' };
    
    if (grade && grade !== 'all') {
      query.grade = grade;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('name email grade studentId phone dateOfBirth createdAt')
      .sort({ grade: 1, name: 1 });

    // Get payment, attendance, and grade data for each student
    const studentsWithAnalytics = await Promise.all(students.map(async (student) => {
      // Get payment statistics
      const payments = await Payment.find({ schoolId: req.schoolId, studentId: student._id });
      const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
      const pendingPayments = payments.filter(p => p.status === 'pending').length;

      // Calculate real attendance percentage
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const attendanceRecords = await Attendance.find({
        schoolId: req.schoolId,
        studentId: student._id,
        date: { $gte: thirtyDaysAgo }
      });
      
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      
      // Calculate real average score from grades
      const grades = await Grade.find({ schoolId: req.schoolId, studentId: student._id });
      
      // Check if we have enough data to calculate meaningful metrics
      const hasEnoughAttendanceData = totalDays >= 5;
      const hasEnoughGradeData = grades.length >= 3;
      
      // Calculate attendance only if we have enough data, otherwise show N/A
      const attendance = hasEnoughAttendanceData 
        ? (totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0)
        : null; // null indicates "No data yet"
      
      const averageScore = hasEnoughGradeData
        ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length)
        : null; // null indicates "No data yet"

      // Determine performance level
      let performanceLevel = 'No Data';
      if (averageScore !== null) {
        if (averageScore >= 90) performanceLevel = 'Excellent';
        else if (averageScore >= 75) performanceLevel = 'Good';
        else if (averageScore >= 60) performanceLevel = 'Average';
        else performanceLevel = 'Needs Improvement';
      }

      // Check if at-risk - only if we have sufficient data
      const isAtRisk = (hasEnoughAttendanceData && attendance < 75) || 
                       (hasEnoughGradeData && averageScore < 60);

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        grade: student.grade,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        enrolledDate: student.createdAt,
        attendance: attendance !== null ? attendance : 0, // Display 0 but don't use for risk calculation
        averageScore: averageScore !== null ? averageScore : 0, // Display 0 but don't use for risk calculation
        performanceLevel: performanceLevel,
        totalPaid: totalPaid,
        pendingPayments: pendingPayments,
        isAtRisk: isAtRisk,
        hasEnoughData: hasEnoughAttendanceData || hasEnoughGradeData // New field to indicate data sufficiency
      };
    }));

    // Apply filters
    let filtered = studentsWithAnalytics;

    if (performanceLevel && performanceLevel !== 'all') {
      filtered = filtered.filter(s => s.performanceLevel === performanceLevel);
    }

    if (attendanceRange) {
      const [min, max] = attendanceRange.split('-').map(Number);
      filtered = filtered.filter(s => s.attendance >= min && s.attendance <= max);
    }

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get at-risk students
export const getAtRiskStudents = async (req, res) => {
  try {
    const students = await User.find({ schoolId: req.schoolId, role: 'student', status: 'active' })
      .select('name email grade studentId')
      .sort({ grade: 1, name: 1 });

    const atRiskStudents = await Promise.all(students.map(async (student) => {
      // Calculate real attendance percentage
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const attendanceRecords = await Attendance.find({
        schoolId: req.schoolId,
        studentId: student._id,
        date: { $gte: thirtyDaysAgo }
      });
      
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      
      // Calculate real average score
      const grades = await Grade.find({ schoolId: req.schoolId, studentId: student._id });
      
      // IMPORTANT: Only calculate risk if there's sufficient data
      // Minimum threshold: at least 5 attendance records OR at least 3 grades
      const hasEnoughAttendanceData = totalDays >= 5;
      const hasEnoughGradeData = grades.length >= 3;
      
      // Skip students without sufficient data - they're not at risk, just new/no assessments yet
      if (!hasEnoughAttendanceData && !hasEnoughGradeData) {
        return null;
      }

      const attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      const averageScore = grades.length > 0 
        ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length)
        : 0;

      // Only flag attendance as low if we have enough data
      const isLowAttendance = hasEnoughAttendanceData && attendance < 75;
      // Only flag performance as low if we have enough data
      const isLowPerformance = hasEnoughGradeData && averageScore < 60;
      
      const isAtRisk = isLowAttendance || isLowPerformance;

      if (!isAtRisk) return null;

      const reasons = [];
      if (isLowAttendance) reasons.push(`Low Attendance (${attendance}%)`);
      if (isLowPerformance) reasons.push(`Low Performance (${averageScore}%)`);

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        grade: student.grade,
        attendance: attendance,
        averageScore: averageScore,
        reasons: reasons,
        severity: isLowAttendance && isLowPerformance ? 'High' : 'Medium'
      };
    }));

    const filtered = atRiskStudents.filter(s => s !== null);

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get individual student details with comprehensive data
export const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({ _id: id, schoolId: req.schoolId, role: 'student' })
      .select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get payment history
    const payments = await Payment.find({ schoolId: req.schoolId, studentId: id })
      .populate('feeId', 'title amount dueDate semester')
      .sort({ createdAt: -1 });

    // Get fee obligations
    const allFees = await Fee.find({
      schoolId: req.schoolId,
      $or: [
        { appliesTo: 'all' },
        { appliesTo: 'grade-specific', grades: student.grade }
      ],
      status: 'active'
    });

    const feeDetails = allFees.map(fee => {
      const payment = payments.find(p => p.feeId?._id.toString() === fee._id.toString());
      return {
        feeId: fee._id,
        title: fee.title,
        amount: fee.amount,
        dueDate: fee.dueDate,
        semester: fee.semester,
        status: payment?.status || 'pending',
        paidAmount: payment?.amount || 0,
        paidDate: payment?.createdAt
      };
    });

    // Get real grades data
    const grades = await Grade.find({ schoolId: req.schoolId, studentId: id }).sort({ date: -1 });
    
    // Calculate average score
    const averageScore = grades.length > 0 
      ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length)
      : 0;

    // Calculate subject-wise performance and trends
    const subjectMap = new Map();
    grades.forEach(grade => {
      if (!subjectMap.has(grade.subject)) {
        subjectMap.set(grade.subject, []);
      }
      subjectMap.get(grade.subject).push({
        score: (grade.score / grade.maxScore) * 100,
        date: grade.date
      });
    });

    const subjects = Array.from(subjectMap.entries()).map(([name, scores]) => {
      const avgScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
      
      // Determine trend: compare recent scores with older ones
      let trend = 'stable';
      if (scores.length >= 2) {
        const recentAvg = scores.slice(0, Math.ceil(scores.length / 2))
          .reduce((sum, s) => sum + s.score, 0) / Math.ceil(scores.length / 2);
        const olderAvg = scores.slice(Math.ceil(scores.length / 2))
          .reduce((sum, s) => sum + s.score, 0) / (scores.length - Math.ceil(scores.length / 2));
        
        if (recentAvg > olderAvg + 5) trend = 'up';
        else if (recentAvg < olderAvg - 5) trend = 'down';
      }
      
      return { name, score: avgScore, trend };
    });

    // Get recent tests
    const recentTests = grades.slice(0, 5).map(g => ({
      name: g.title,
      score: g.score,
      date: g.date,
      total: g.maxScore
    }));

    // Get real attendance data
    const allAttendance = await Attendance.find({ schoolId: req.schoolId, studentId: id }).sort({ date: -1 });
    
    // Overall attendance
    const totalDays = allAttendance.length;
    const presentDays = allAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const overallAttendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // This month attendance
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const thisMonthRecords = allAttendance.filter(a => a.date >= thisMonthStart);
    const thisMonthPresent = thisMonthRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const thisMonthAttendance = thisMonthRecords.length > 0 
      ? Math.round((thisMonthPresent / thisMonthRecords.length) * 100)
      : 0;

    // Last month attendance
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);
    
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setDate(0);
    
    const lastMonthRecords = allAttendance.filter(a => a.date >= lastMonthStart && a.date < thisMonthStart);
    const lastMonthPresent = lastMonthRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const lastMonthAttendance = lastMonthRecords.length > 0
      ? Math.round((lastMonthPresent / lastMonthRecords.length) * 100)
      : 0;

    // Monthly attendance data for last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      
      const monthRecords = allAttendance.filter(a => a.date >= monthStart && a.date <= monthEnd);
      const monthPresent = monthRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      const monthPercentage = monthRecords.length > 0
        ? Math.round((monthPresent / monthRecords.length) * 100)
        : 0;
      
      monthlyData.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        percentage: monthPercentage
      });
    }

    // Get remarks
    const remarks = await Remark.find({ schoolId: req.schoolId, studentId: id })
      .populate('teacherId', 'name')
      .populate('adminId', 'name')
      .sort({ date: -1 })
      .limit(10);

    const performanceData = {
      attendance: overallAttendance,
      averageScore: averageScore,
      subjects: subjects,
      recentTests: recentTests
    };

    const attendanceData = {
      overall: overallAttendance,
      thisMonth: thisMonthAttendance,
      lastMonth: lastMonthAttendance,
      monthlyData: monthlyData
    };

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          grade: student.grade,
          phone: student.phone,
          dateOfBirth: student.dateOfBirth,
          enrolledDate: student.createdAt,
          status: student.status
        },
        performance: performanceData,
        attendance: attendanceData,
        fees: feeDetails,
        payments: payments.map(p => ({
          id: p._id,
          feeTitle: p.feeId?.title || 'N/A',
          amount: p.amount,
          status: p.status,
          method: p.method,
          transactionId: p.transactionId,
          date: p.createdAt
        })),
        remarks: remarks.map(r => ({
          id: r._id,
          type: r.type,
          content: r.content,
          date: r.date,
          isPositive: r.isPositive,
          by: r.teacherId?.name || r.adminId?.name || 'System'
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get available subscription plans
// @route   GET /api/administrator/subscription/plans
// @access  Admin
export const getAvailablePlans = async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .select('code name monthlyPrice annualPrice description features maxStudents maxTeachers');

    const normalizedPlans = plans.map((plan) => ({
      id: plan.code,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.map((feature) => feature.label) : [],
      limitations: []
    }));

    const fallbackPlans = [
      {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 2999,
        annualPrice: 29990,
        description: 'Perfect for small schools',
        features: ['Up to 500 students', 'Up to 50 teachers', 'Email support'],
        limitations: []
      },
      {
        id: 'premium',
        name: 'Premium',
        monthlyPrice: 5999,
        annualPrice: 59990,
        description: 'For growing schools',
        features: ['Up to 2000 students', 'Up to 200 teachers', 'Priority email & phone support'],
        limitations: []
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 9999,
        annualPrice: 99990,
        description: 'For large-scale institutions',
        features: ['Unlimited students & teachers', 'Custom API access', 'Dedicated account manager'],
        limitations: []
      }
    ];

    res.json({
      success: true,
      data: { plans: normalizedPlans.length > 0 ? normalizedPlans : fallbackPlans }
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get current school subscription details
// @route   GET /api/administrator/subscription/current
// @access  Admin
export const getCurrentSubscription = async (req, res) => {
  try {
    const school = await School.findById(req.schoolId);
    
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const currentPlan = school.subscription.plan;
    const daysRemaining = school.subscription.endDate 
      ? Math.ceil((new Date(school.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      success: true,
      data: {
        currentPlan: currentPlan,
        startDate: school.subscription.startDate,
        endDate: school.subscription.endDate,
        maxStudents: school.subscription.maxStudents,
        totalStudents: school.stats.totalStudents,
        billingCycle: school.billing.billingCycle,
        monthlyPrice: school.billing.monthlyPrice,
        annualPrice: school.billing.annualPrice,
        paymentStatus: school.billing.paymentStatus,
        lastPaymentDate: school.billing.lastPaymentDate,
        nextPaymentDate: school.billing.nextPaymentDate,
        daysRemaining: daysRemaining,
        isTrialExpired: currentPlan === 'trial' && daysRemaining < 0
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Process plan upgrade/payment
// @route   POST /api/administrator/subscription/upgrade
// @access  Admin
export const createSubscriptionRazorpayOrder = async (req, res) => {
  try {
    if (!req.schoolId) {
      return res.status(401).json({ success: false, message: 'School ID not found in session' });
    }

    const { newPlan, billingCycle = 'monthly', paymentMethod = 'credit_card' } = req.body;
    const validPlans = ['basic', 'premium', 'enterprise'];

    if (!validPlans.includes(newPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    let pricing = await PricingPlan.findOne({ code: newPlan, isActive: true });
    if (!pricing) {
      const fallbackPricing = {
        basic: { monthlyPrice: 2999, annualPrice: 29990, maxStudents: 500 },
        premium: { monthlyPrice: 5999, annualPrice: 59990, maxStudents: 2000 },
        enterprise: { monthlyPrice: 9999, annualPrice: 99990, maxStudents: null }
      };
      pricing = fallbackPricing[newPlan];
    }

    if (!pricing) {
      return res.status(400).json({ success: false, message: 'Selected plan is not available' });
    }

    const school = await School.findById(req.schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const amountToPay = billingCycle === 'annual' ? pricing.annualPrice : pricing.monthlyPrice;

    const paymentMethodMap = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      net_banking: 'Bank Transfer',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
      'Credit Card': 'Credit Card',
      'Debit Card': 'Debit Card',
      'Bank Transfer': 'Bank Transfer',
      UPI: 'UPI'
    };

    await Payment.updateMany(
      {
        schoolId: req.schoolId,
        paymentType: 'subscription',
        status: 'pending'
      },
      {
        $set: {
          status: 'failed',
          remarks: 'Superseded by a new Razorpay order attempt'
        }
      }
    );

    const pendingPayment = await Payment.create({
      schoolId: req.schoolId,
      studentId: null,
      studentName: school.name,
      amount: amountToPay,
      paymentMethod: paymentMethodMap[paymentMethod] || 'Credit Card',
      status: 'pending',
      paymentType: 'subscription',
      feeTitle: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} Plan - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
      description: `Subscription payment for ${newPlan} plan|${billingCycle}`
    });

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: toPaise(amountToPay),
      currency: 'INR',
      receipt: String(pendingPayment._id),
      notes: {
        paymentId: String(pendingPayment._id),
        schoolId: String(req.schoolId),
        paymentType: 'subscription',
        planCode: newPlan,
        billingCycle
      }
    });

    pendingPayment.razorpayOrderId = order.id;
    await pendingPayment.save();

    res.json({
      success: true,
      message: 'Razorpay order created',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: getRazorpayPublicKey(),
      paymentId: pendingPayment._id,
      schoolName: school.name,
      planName: newPlan
    });
  } catch (error) {
    console.error('Create subscription razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating Razorpay order',
      error: error.message
    });
  }
};

export const verifySubscriptionRazorpayPayment = async (req, res) => {
  try {
    if (!req.schoolId) {
      return res.status(401).json({ success: false, message: 'School ID not found in session' });
    }

    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, newPlan, billingCycle = 'monthly' } = req.body;

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !newPlan) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      schoolId: req.schoolId,
      paymentType: 'subscription',
      status: 'pending'
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Pending subscription payment not found' });
    }

    if (payment.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Order mismatch' });
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const validPlans = ['basic', 'premium', 'enterprise'];
    if (!validPlans.includes(newPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    let pricing = await PricingPlan.findOne({ code: newPlan, isActive: true });
    if (!pricing) {
      const fallbackPricing = {
        basic: { monthlyPrice: 2999, annualPrice: 29990, maxStudents: 500 },
        premium: { monthlyPrice: 5999, annualPrice: 59990, maxStudents: 2000 },
        enterprise: { monthlyPrice: 9999, annualPrice: 99990, maxStudents: null }
      };
      pricing = fallbackPricing[newPlan];
    }

    const school = await School.findById(req.schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    payment.status = 'completed';
    payment.transactionId = razorpayPaymentId;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.paymentDate = new Date();
    await payment.save();

    school.subscription.plan = newPlan;
    school.subscription.startDate = startDate;
    school.subscription.endDate = endDate;
    school.subscription.maxStudents = pricing?.maxStudents;
    school.billing.monthlyPrice = pricing?.monthlyPrice;
    school.billing.annualPrice = pricing?.annualPrice;
    school.billing.billingCycle = billingCycle;
    school.billing.paymentStatus = 'active';
    school.billing.lastPaymentDate = new Date();
    school.billing.nextPaymentDate = endDate;
    school.billing.failedPaymentAttempts = 0;
    await school.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('plan:upgraded', {
        schoolId: req.schoolId,
        schoolName: school.name,
        newPlan,
        amount: payment.amount,
        billingCycle,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Successfully upgraded to ${newPlan} plan`,
      data: {
        plan: newPlan,
        startDate,
        endDate,
        amountPaid: payment.amount,
        billingCycle,
        paymentId: payment._id
      }
    });
  } catch (error) {
    console.error('Verify subscription razorpay payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying subscription payment',
      error: error.message
    });
  }
};

export const upgradePlan = async (req, res) => {
  try {
    // Validate request data
    if (!req.schoolId) {
      return res.status(401).json({ success: false, message: 'School ID not found in session' });
    }

    const { newPlan, billingCycle = 'monthly', transactionId } = req.body;

    // Validate plan
    const validPlans = ['basic', 'premium', 'enterprise'];
    if (!validPlans.includes(newPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    let pricing = await PricingPlan.findOne({ code: newPlan, isActive: true });
    if (!pricing) {
      const fallbackPricing = {
        basic: { monthlyPrice: 2999, annualPrice: 29990, maxStudents: 500 },
        premium: { monthlyPrice: 5999, annualPrice: 59990, maxStudents: 2000 },
        enterprise: { monthlyPrice: 9999, annualPrice: 99990, maxStudents: null }
      };
      pricing = fallbackPricing[newPlan];
    }

    if (!pricing) {
      return res.status(400).json({ success: false, message: 'Selected plan is not available' });
    }

    const amountToPay = billingCycle === 'annual' ? pricing.annualPrice : pricing.monthlyPrice;

    const school = await School.findById(req.schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create payment record
    const paymentMethodMap = {
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'net_banking': 'Bank Transfer',
      'upi': 'UPI',
      'bank_transfer': 'Bank Transfer',
      'Credit Card': 'Credit Card',
      'Debit Card': 'Debit Card',
      'Bank Transfer': 'Bank Transfer',
      'UPI': 'UPI'
    };

    const mappedPaymentMethod = paymentMethodMap[req.body.paymentMethod] || 'Credit Card';

    const paymentData = {
      schoolId: req.schoolId,
      studentId: null,
      studentName: school.name,
      amount: amountToPay,
      paymentMethod: mappedPaymentMethod,
      paymentDate: new Date(),
      status: 'completed',
      paymentType: 'subscription',
      feeTitle: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} Plan - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
      description: `Subscription payment for ${newPlan} plan`
    };

    if (transactionId) {
      paymentData.transactionId = transactionId;
    }

    const payment = new Payment(paymentData);
    await payment.save();

    // Update school subscription
    school.subscription.plan = newPlan;
    school.subscription.startDate = startDate;
    school.subscription.endDate = endDate;
    school.subscription.maxStudents = pricing.maxStudents;
    school.billing.monthlyPrice = pricing.monthlyPrice;
    school.billing.annualPrice = pricing.annualPrice;
    school.billing.billingCycle = billingCycle;
    school.billing.paymentStatus = 'active';
    school.billing.lastPaymentDate = new Date();
    school.billing.nextPaymentDate = endDate;
    school.billing.failedPaymentAttempts = 0;

    await school.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('plan:upgraded', {
        schoolId: req.schoolId,
        schoolName: school.name,
        newPlan: newPlan,
        amount: amountToPay,
        billingCycle: billingCycle,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Successfully upgraded to ${newPlan} plan`,
      data: {
        plan: newPlan,
        startDate: startDate,
        endDate: endDate,
        amountPaid: amountToPay,
        billingCycle: billingCycle,
        paymentId: payment._id
      }
    });
  } catch (error) {
    console.error('Plan upgrade error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing plan upgrade', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

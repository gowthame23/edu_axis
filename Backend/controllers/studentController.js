import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import Submission from '../models/Submission.js';
import Timetable from '../models/Timetable.js';
import LeaveRequest from '../models/LeaveRequest.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Schedule from '../models/Schedule.js';
import Grade from '../models/Grade.js';
import { assertSameSchoolStudent } from '../middleware/tenantGuards.js';
import { cacheKey, delCacheByPattern, getOrSetCache } from '../services/cacheService.js';
import { getRazorpayClient, getRazorpayPublicKey, toPaise, verifyRazorpaySignature } from '../services/razorpayService.js';

const CACHE_TTL = {
  DASHBOARD: 180,
  COURSES: 300,
  ANNOUNCEMENTS: 120,
  FEES: 90,
  LIBRARY: 300,
  TEACHERS: 300
};

// Get student dashboard data
export const getDashboard = async (req, res) => {
  try {
    const studentId = req.user?._id;
    const schoolId = req.schoolId;

    const key = cacheKey('student-dashboard', [schoolId, studentId]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        const student = await User.findOne({
          _id: studentId,
          role: 'student',
          schoolId
        }).select('_id grade');

        if (!student) {
          return {
            status: 404,
            body: {
              success: false,
              message: 'Student not found'
            }
          };
        }

        const [pendingAssignments, totalCourses, totalAttendance, presentCount, completedAssignments, totalAssignments, grades] = await Promise.all([
          Assignment.countDocuments({ schoolId, grade: String(student.grade), status: 'active' }),
          Course.countDocuments({ schoolId, status: 'active', grade: Number(student.grade) }),
          Attendance.countDocuments({ schoolId, studentId: student._id }),
          Attendance.countDocuments({ schoolId, studentId: student._id, status: 'present' }),
          Submission.countDocuments({ schoolId, studentId: student._id, status: { $in: ['submitted', 'graded'] } }),
          Assignment.countDocuments({ schoolId, grade: String(student.grade), status: 'active' }),
          Grade.find({ schoolId, studentId: student._id }).select('score').lean()
        ]);

        const attendancePercentage = totalAttendance > 0
          ? Math.round((presentCount / totalAttendance) * 100)
          : 0;

        let averageGrade = 0;
        if (grades.length > 0) {
          const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
          averageGrade = Math.round(totalScore / grades.length);
        }

        return {
          status: 200,
          body: {
            success: true,
            stats: {
              totalCourses,
              attendance: attendancePercentage,
              completedAssignments,
              totalAssignments,
              pendingAssignments,
              averageGrade,
              totalGrades: grades.length
            }
          }
        };
      },
      CACHE_TTL.DASHBOARD
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.status(payload.status).json(payload.body);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student courses
export const getCourses = async (req, res) => {
  try {
    // Determine student from auth context only
    const studentId = req.user?._id;
    const schoolId = req.schoolId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const key = cacheKey('student-courses', [schoolId, studentId]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        const student = await User.findOne({ _id: studentId, schoolId, role: 'student' }).select('grade').lean();
        if (!student) {
          return { status: 404, body: { success: false, message: 'Student not found' } };
        }

        const courses = await Course.find({
          schoolId,
          status: 'active',
          grade: Number(student.grade)
        })
          .populate('teacherId', 'name email')
          .lean();

        return { status: 200, body: { success: true, courses } };
      },
      CACHE_TTL.COURSES
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.status(payload.status).json(payload.body);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get student grades
export const getGrades = async (req, res) => {
  try {
    const studentId = req.user?._id;
    const schoolId = req.schoolId;

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    // Pull graded submissions for this student and join assignment/course where available
    const gradedSubmissions = await Submission.find({
      schoolId,
      studentId,
      status: 'graded'
    })
      .populate({
        path: 'assignmentId',
        select: 'title totalMarks subject courseId',
        populate: { path: 'courseId', select: 'name code' }
      })
      .sort({ gradedAt: -1, updatedAt: -1 });

    const grades = gradedSubmissions.map((submission) => {
      const a = submission.assignmentId || {};
      const course = a.courseId || {};
      const subjectName = course.name || a.subject || 'N/A';
      const totalMarks = a.totalMarks || 100;
      return {
        _id: submission._id,
        subject: subjectName,
        assignment: a.title || 'Assignment',
        marks: submission.marks ?? 0,
        totalMarks: totalMarks,
        total: totalMarks,
        grade: calculateGrade(submission.marks ?? 0, totalMarks),
        date: submission.gradedAt || submission.updatedAt || submission.createdAt,
        createdAt: submission.gradedAt || submission.updatedAt || submission.createdAt,
        courseCode: course.code || undefined,
        feedback: submission.feedback || undefined,
        courseId: course,
        assignmentId: { title: a.title },
        course: subjectName,
      };
    });

    res.json({ success: true, grades });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper function to calculate grade
function calculateGrade(marks, total) {
  const percentage = (marks / total) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  return 'F';
}

// Get student attendance
export const getAttendance = async (req, res) => {
  try {
    const studentId = req.user?._id;
    const schoolId = req.schoolId;

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    const attendanceRecords = await Attendance.find({ schoolId, studentId })
      .populate('courseId', 'name code')
      .sort({ date: -1 });

    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'present').length;
    const absent = attendanceRecords.filter(a => a.status === 'absent').length;
    const late = attendanceRecords.filter(a => a.status === 'late').length;
    const excused = attendanceRecords.filter(a => a.status === 'excused').length;

    res.json({
      success: true,
      attendance: {
        overall: total > 0 ? Math.round((present / total) * 100) : 0,
        present,
        absent,
        late,
        excused,
        total,
        records: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student assignments
export const getAssignments = async (req, res) => {
  try {
    const studentId = req.user?._id;
    const schoolId = req.schoolId;

    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }

    // Load student to determine grade
    const student = await User.findOne({ _id: studentId, schoolId, role: 'student' });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Assignments targeted to student's grade (and active)
    const assignments = await Assignment.find({ 
        schoolId,
        grade: String(student.grade),
        status: 'active'
      })
      .populate('courseId', 'name code')
      .populate('teacherId', 'name')
      .sort({ dueDate: -1, createdAt: -1 });
    
    // Get all submissions for this student
    const submissions = await Submission.find({ 
      schoolId,
      studentId: student._id 
    }).select('assignmentId status marks submittedAt gradedAt');

    // Create a map of assignmentId -> submission
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignmentId.toString()] = {
        status: sub.status,
        marks: sub.marks,
        submittedAt: sub.submittedAt,
        gradedAt: sub.gradedAt
      };
    });

    // Attach submission info to each assignment
    const assignmentsWithSubmissions = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      const submission = submissionMap[assignment._id.toString()];
      
      if (submission) {
        assignmentObj.submissionStatus = submission.status;
        assignmentObj.submittedAt = submission.submittedAt;
        assignmentObj.marks = submission.marks;
        assignmentObj.gradedAt = submission.gradedAt;
      } else {
        assignmentObj.submissionStatus = 'pending';
      }
      
      return assignmentObj;
    });
    
    res.json({ 
      success: true,
      assignments: assignmentsWithSubmissions 
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get student timetable
export const getTimetable = async (req, res) => {
  try {
    const student = req.user; // User is already loaded by auth middleware
    const schoolId = req.schoolId;

    // Find active timetable for student's grade and section (or grade-wide 'All')
    const now = new Date();
    const sectionValue = student.section ? String(student.section) : 'All';

    // Prefer section-specific if available
    let timetableDoc = await Timetable.findOne({
      schoolId,
      grade: student.grade,
      section: sectionValue,
      isActive: true,
      effectiveFrom: { $lte: now },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gte: now } }
      ]
    });

    // Fallback to 'All' if no section-specific timetable
    if (!timetableDoc && sectionValue !== 'All') {
      timetableDoc = await Timetable.findOne({
        schoolId,
        grade: student.grade,
        section: 'All',
        isActive: true,
        effectiveFrom: { $lte: now },
        $or: [
          { effectiveTo: null },
          { effectiveTo: { $gte: now } }
        ]
      });
    }

    if (!timetableDoc) {
      return res.json({ 
        success: true,
        timetable: null,
        message: 'No timetable uploaded yet for your class'
      });
    }

    res.json({ 
      success: true,
      timetable: {
        grade: timetableDoc.grade,
        section: timetableDoc.section,
        academicYear: timetableDoc.academicYear,
        semester: timetableDoc.semester,
        file: timetableDoc.file,
        effectiveFrom: timetableDoc.effectiveFrom,
        effectiveTo: timetableDoc.effectiveTo
      }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Weekly class schedule for student (by grade and enrolled courses)
export const getSchedule = async (req, res) => {
  try {
    const student = req.user;
    const schoolId = req.schoolId;
    if (!student) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Find active courses for the student's grade
    const courses = await Course.find({ schoolId, status: 'active', grade: Number(student.grade) }).select('_id name grade');
    const courseIds = courses.map(c => c._id);

    const entries = await Schedule.find({ schoolId, courseId: { $in: courseIds } })
      .populate('courseId', 'name code grade')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, entries });
  } catch (error) {
    console.error('Get student schedule error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a leave request (student)
export const createLeaveRequest = async (req, res) => {
  try {
    const student = req.user;
    const { startDate, endDate, reason, type } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'startDate, endDate and reason are required' });
    }

    // Server-side validation for date logic
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (start < today) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
    }

    const lr = await LeaveRequest.create({
      schoolId: req.schoolId,
      requesterId: student._id,
      requesterRole: 'student',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      type: type || 'other'
    });

    // Notify admins via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('leaveRequestCreated', {
        id: lr._id,
        requester: { id: String(student._id), name: student.name, role: 'student' },
        startDate: lr.startDate,
        endDate: lr.endDate,
        days: lr.days,
        type: lr.type,
        status: lr.status
      });
    }

    res.json({ success: true, message: 'Leave request submitted', leaveRequest: lr });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get own leave requests (student)
export const getMyLeaveRequests = async (req, res) => {
  try {
    const studentId = req.user._id;
    const items = await LeaveRequest.find({ schoolId: req.schoolId, requesterId: studentId, requesterRole: 'student' })
      .sort({ createdAt: -1 });
    res.json({ success: true, leaveRequests: items });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get announcements
export const getAnnouncements = async (req, res) => {
  try {
    const student = req.user; // Loaded by auth middleware

    const key = cacheKey('student-announcements', [req.schoolId, student._id, student.grade]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        const announcements = await Announcement.find({
          schoolId: req.schoolId,
          isActive: true,
          hiddenBy: { $ne: student._id },
          $or: [
            { targetAudience: 'all' },
            { targetAudience: 'students' }
          ],
          $and: [
            {
              $or: [
                { grade: { $exists: false } },
                { grade: null },
                { grade: String(student.grade) }
              ]
            },
            {
              $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
              ]
            }
          ]
        })
          .populate('createdBy', 'name')
          .populate('courseId', 'name code')
          .sort({ priority: -1, createdAt: -1 })
          .limit(20)
          .lean();

        return {
          success: true,
          announcements
        };
      },
      CACHE_TTL.ANNOUNCEMENTS
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(payload);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get fees for student
export const getFees = async (req, res) => {
  try {
    const studentId = req.user._id; // Get from authenticated user
    const student = req.user; // Already loaded by middleware

    const key = cacheKey('student-fees', [req.schoolId, studentId, student.grade]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        const activeFees = await Fee.find({
          schoolId: req.schoolId,
          status: 'active',
          $or: [
            { appliesTo: 'all' },
            { appliesTo: 'grade-specific', grades: student.grade }
          ]
        }).sort({ dueDate: 1 }).lean();

        const payments = await Payment.find({ schoolId: req.schoolId, studentId }).sort({ paymentDate: -1 }).lean();

        const activeFeeIds = new Set(activeFees.map((fee) => String(fee._id)));
        const completedActiveFeePayments = payments.filter(
          (payment) => payment.status === 'completed' && payment.feeId && activeFeeIds.has(String(payment.feeId))
        );

        const paidByFeeId = new Map();
        for (const payment of completedActiveFeePayments) {
          const feeKey = String(payment.feeId);
          const existing = paidByFeeId.get(feeKey) || 0;
          paidByFeeId.set(feeKey, existing + Number(payment.amount || 0));
        }

        const totalFeeAmount = activeFees.reduce((sum, fee) => sum + fee.amount, 0);
        const totalPaid = activeFees.reduce((sum, fee) => {
          const feePaidAmount = paidByFeeId.get(String(fee._id)) || 0;
          return sum + Math.min(Number(fee.amount || 0), feePaidAmount);
        }, 0);
        const pending = Math.max(0, totalFeeAmount - totalPaid);

        const now = new Date();
        const lateFeesAmount = activeFees
          .filter((fee) => new Date(fee.dueDate) < now)
          .reduce((sum, fee) => {
            const paidForThisFee = payments.find((payment) => String(payment.feeId) === String(fee._id) && payment.status === 'completed');
            if (!paidForThisFee) {
              const daysLate = Math.floor((now - new Date(fee.dueDate)) / (1000 * 60 * 60 * 24));
              return sum + (daysLate * 10);
            }
            return sum;
          }, 0);

        return {
          success: true,
          studentGrade: student.grade,
          studentSection: student.section,
          fees: activeFees,
          payments: (() => {
            const completedPayments = payments.filter((payment) => payment.status === 'completed');
            const latestByFeeKey = new Map();

            for (const payment of completedPayments) {
              const feeKey = payment.feeId
                ? String(payment.feeId)
                : `title:${String(payment.feeTitle || '')}`;

              if (!latestByFeeKey.has(feeKey)) {
                latestByFeeKey.set(feeKey, payment);
              }
            }

            return Array.from(latestByFeeKey.values());
          })(),
          summary: {
            totalFees: totalFeeAmount,
            totalPaid,
            pending,
            lateFee: lateFeesAmount,
            lateFees: lateFeesAmount,
            totalDue: Math.max(0, pending + lateFeesAmount)
          }
        };
      },
      CACHE_TTL.FEES
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(payload);
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Make payment
export const createFeeRazorpayOrder = async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = req.user;
    const { feeId, amount, paymentMethod = 'Online Payment', remarks } = req.body;

    if (!studentId || !feeId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Fee ID, and amount are required'
      });
    }

    const fee = await Fee.findOne({ _id: feeId, schoolId: req.schoolId });
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    const existingPayment = await Payment.findOne({
      schoolId: req.schoolId,
      studentId,
      feeId,
      status: 'completed'
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'This fee has already been paid'
      });
    }

    const now = new Date();
    const dueDate = new Date(fee.dueDate);
    let lateFee = 0;
    if (now > dueDate) {
      const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      lateFee = daysLate * 10;
    }

    const totalAmount = Number(amount) + lateFee;

    await Payment.updateMany(
      {
        schoolId: req.schoolId,
        studentId,
        feeId,
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
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      feeId,
      feeTitle: fee.title,
      amount: totalAmount,
      paymentMethod,
      status: 'pending',
      remarks: remarks || (lateFee > 0 ? `Includes late fee: ₹${lateFee}` : undefined)
    });

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: toPaise(totalAmount),
      currency: 'INR',
      receipt: String(pendingPayment._id),
      notes: {
        paymentId: String(pendingPayment._id),
        schoolId: String(req.schoolId),
        studentId: String(studentId),
        feeId: String(feeId),
        paymentType: 'fee'
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
      feeTitle: fee.title,
      studentName: student.name,
      studentEmail: student.email
    });
  } catch (error) {
    console.error('Create fee razorpay order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const verifyFeeRazorpayPayment = async (req, res) => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay verification fields' });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      schoolId: req.schoolId,
      studentId: req.user._id,
      status: 'pending'
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Pending payment not found' });
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

    payment.status = 'completed';
    payment.transactionId = razorpayPaymentId;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.paymentDate = new Date();
    await payment.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('payment:created', {
        schoolId: req.schoolId,
        payment: {
          _id: payment._id,
          studentName: payment.studentName,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          feeTitle: payment.feeTitle,
          paymentDate: payment.paymentDate
        }
      });
    }

    await delCacheByPattern(`student-fees:${req.schoolId}:${req.user._id}:*`);
    await delCacheByPattern(`student-dashboard:${req.schoolId}:${req.user._id}`);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    console.error('Verify fee razorpay payment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const makePayment = async (req, res) => {
  try {
    const studentId = req.user._id; // Get from authenticated user
    const student = req.user; // User already loaded by middleware
    const { feeId, amount, paymentMethod, transactionId, remarks } = req.body;

    if (!studentId || !feeId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, Fee ID, amount, and payment method are required' 
      });
    }
    const fee = await Fee.findOne({ _id: feeId, schoolId: req.schoolId });

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({ 
      schoolId: req.schoolId,
      studentId, 
      feeId, 
      status: 'completed' 
    });

    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        message: 'This fee has already been paid' 
      });
    }

    // Calculate late fee if applicable
    const now = new Date();
    const dueDate = new Date(fee.dueDate);
    let lateFee = 0;
    
    if (now > dueDate) {
      const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      lateFee = daysLate * 10; // $10 per day
    }

    const totalAmount = parseFloat(amount) + lateFee;

    const payment = await Payment.create({
      schoolId: req.schoolId,
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      feeId,
      feeTitle: fee.title,
      amount: totalAmount,
      paymentMethod,
      transactionId,
      status: 'completed',
      remarks: remarks || (lateFee > 0 ? `Includes late fee: ₹${lateFee}` : undefined)
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Broadcast to all admin users in the school
      io.emit('payment:created', {
        schoolId: req.schoolId,
        payment: {
          _id: payment._id,
          studentName: payment.studentName,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          feeTitle: payment.feeTitle,
          paymentDate: payment.paymentDate
        }
      });
    }

    // TODO: Send email notification

    await delCacheByPattern(`student-fees:${req.schoolId}:${studentId}:*`);
    await delCacheByPattern(`student-dashboard:${req.schoolId}:${studentId}`);

    res.json({
      success: true,
      message: 'Payment successful',
      payment,
      lateFee
    });
  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Download receipt
export const downloadReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ _id: paymentId, schoolId: req.schoolId, studentId: req.user._id })
      .populate('studentId', 'name email phone studentId')
      .populate('feeId', 'title amount description');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Return payment data for frontend to generate PDF
    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        date: payment.paymentDate,
        student: {
          name: payment.studentName,
          email: payment.studentEmail,
          id: payment.studentId?.studentId
        },
        fee: {
          title: payment.feeTitle,
          amount: payment.feeId?.amount || payment.amount
        },
        payment: {
          amount: payment.amount,
          method: payment.paymentMethod,
          transactionId: payment.transactionId,
          status: payment.status
        },
        remarks: payment.remarks
      }
    });
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get course details
export const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;
    const student = req.user;

    const course = await Course.findOne({ _id: id, schoolId, status: 'active', grade: Number(student.grade) })
      .populate('teacherId', 'name email');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Get assignments for this course
    const assignments = await Assignment.find({ 
      schoolId,
      courseId: id,
      status: 'active'
    }).sort({ dueDate: -1 }).limit(5);

    // Get announcements for this course
    const announcements = await Announcement.find({
      schoolId,
      courseId: id,
      isActive: true
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        recentAssignments: assignments,
        recentAnnouncements: announcements
      }
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Submit assignment
export const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user._id;
    const schoolId = req.schoolId;
    const { assignmentId, content, comments } = req.body; // Added 'comments'

    if (!assignmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assignment ID is required' 
      });
    }

    // Check if assignment exists
    const assignment = await Assignment.findOne({ _id: assignmentId, schoolId, grade: String(req.user.grade), status: 'active' });
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({ 
      schoolId,
      assignmentId, 
      studentId 
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assignment already submitted. Contact your teacher to resubmit.' 
      });
    }

    // Enforce due date: block submissions after due date
    const now = new Date();
    if (assignment.dueDate && now > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Submission closed. The due date has passed.'
      });
    }

    // Build attachments list from uploaded files and optional link fields
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          name: file.originalname,
          filename: file.filename,
          path: `/uploads/submissions/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    }
    // Optional single link
    if (req.body.link) {
      attachments.push({ url: req.body.link, name: 'Link' });
    }
    // Optional links as JSON array
    if (req.body.links) {
      try {
        const parsed = JSON.parse(req.body.links);
        if (Array.isArray(parsed)) {
          parsed.forEach((u) => {
            if (typeof u === 'string') attachments.push({ url: u });
            else if (u && typeof u === 'object') attachments.push(u);
          });
        }
      } catch (_) {}
    }

    // 5. Create submission
    const submission = await Submission.create({
      schoolId,
      assignmentId,
      studentId,
      content: content || '',
      comments: comments || '',
      files: attachments,
      attachments: attachments, // For backward compatibility
      status: 'submitted',
      submittedAt: new Date()
    });

    // 6. Populate details for response
    await submission.populate('assignmentId');
    await submission.populate('assignmentId.courseId');
    await submission.populate('gradedBy', 'name');

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get submission details for a specific assignment
export const getSubmissionDetails = async (req, res) => {
  try {
    const studentId = req.user._id;
    const schoolId = req.schoolId;
    const { assignmentId } = req.params;

    const submission = await Submission.findOne({ 
      schoolId,
      assignmentId, 
      studentId 
    })
      .populate('assignmentId', 'title description dueDate totalMarks')
      .populate('gradedBy', 'name');

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'No submission found for this assignment' 
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get submission details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Library resources (catalog mode)
export const getLibraryResources = async (req, res) => {
  try {
    const student = req.user;
    const studentGrade = String(student.grade || 'All');
    const { search, category, tag } = req.query || {};

    const LibraryResource = (await import('../models/LibraryResource.js')).default;

    const query = { schoolId: req.schoolId, isActive: true, $and: [] };
    query.$and.push({ $or: [ { grade: 'All' }, { grade: studentGrade } ] });
    if (category) query.$and.push({ category });
    if (tag) query.$and.push({ tags: tag });
    if (search) query.$and.push({ $text: { $search: search } });
    if (!query.$and.length) delete query.$and;

    const key = cacheKey('student-library', [req.schoolId, student._id, studentGrade, search, category, tag]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        const resources = await LibraryResource.find(query)
          .select('_id title author category isExternal linkUrl file tags')
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        const availableResources = resources.map((resource) => ({
          _id: resource._id,
          title: resource.title,
          author: resource.author,
          category: resource.category,
          available: 1,
          downloadUrl: resource.isExternal ? resource.linkUrl : (resource.file?.path || ''),
          fileType: resource.isExternal ? 'link' : (resource.file?.mimetype || 'file'),
          tags: resource.tags
        }));

        return {
          success: true,
          library: {
            availableResources,
            borrowedBooks: [],
            overdueItems: 0
          }
        };
      },
      CACHE_TTL.LIBRARY
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(payload);
  } catch (error) {
    console.error('Get library resources error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get teachers for messaging
export const getTeachers = async (req, res) => {
  try {
    const studentId = req.user._id;
    const schoolId = req.schoolId;
    
    const key = cacheKey('student-teachers', [schoolId, studentId]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        const student = await assertSameSchoolStudent(studentId, schoolId, {
          notFoundMessage: 'Student not found',
          forbiddenMessage: 'Student is not in your school'
        });

        const courses = await Course.find({
          schoolId,
          grade: Number(student.grade),
          status: 'active'
        }).populate('teacherId', 'name email').lean();

        const teachersMap = new Map();
        courses.forEach((course) => {
          if (course.teacherId && course.teacherId._id) {
            teachersMap.set(String(course.teacherId._id), {
              _id: course.teacherId._id,
              name: course.teacherId.name,
              email: course.teacherId.email,
              subject: course.name
            });
          }
        });

        return { success: true, data: Array.from(teachersMap.values()) };
      },
      CACHE_TTL.TEACHERS
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    return res.json(payload);
  } catch (error) {
    console.error('Get teachers error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: status === 500 ? 'Server error' : error.message });
  }
};

// Get study materials for student's grade
export const getStudyMaterials = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const student = await assertSameSchoolStudent(req.user.id, schoolId, {
      notFoundMessage: 'Student not found',
      forbiddenMessage: 'Student is not in your school'
    });

    // Find all courses for the student's grade
    const courses = await Course.find({ schoolId, grade: student.grade });
    const courseIds = courses.map(c => c._id);

    // Get materials for those courses
    const materials = await StudyMaterial.find({ 
      schoolId,
      grade: student.grade,
      courseId: { $in: courseIds }
    })
      .populate('uploadedBy', 'name email')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      materials
    });
  } catch (error) {
    console.error('Get study materials error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Server error' : error.message,
      error: error.message
    });
  }
};

// Mark announcement as read
export const markAnnouncementAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const announcement = await Announcement.findOne({ _id: id, schoolId: req.schoolId });
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Add student to readBy array if not already there
    if (!announcement.readBy.includes(studentId)) {
      announcement.readBy.push(studentId);
      await announcement.save();
    }

    await delCacheByPattern(`student-announcements:${req.schoolId}:${studentId}:*`);

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Mark announcement as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Hide/Delete announcement for student
export const hideAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const announcement = await Announcement.findOne({ _id: id, schoolId: req.schoolId });
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Add student to hiddenBy array if not already there
    if (!announcement.hiddenBy.includes(studentId)) {
      announcement.hiddenBy.push(studentId);
      await announcement.save();
    }

    await delCacheByPattern(`student-announcements:${req.schoolId}:${studentId}:*`);

    res.json({
      success: true,
      message: 'Announcement deleted'
    });
  } catch (error) {
    console.error('Hide announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Clear all announcements for student
export const clearAllAnnouncements = async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = req.user;

    // Find all announcements visible to this student
    const announcements = await Announcement.find({
      schoolId: req.schoolId,
      isActive: true,
      hiddenBy: { $ne: studentId },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students' }
      ],
      $and: [
        {
          $or: [
            { grade: { $exists: false } },
            { grade: null },
            { grade: String(student.grade) }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    });

    // Add student to hiddenBy array for all announcements
    const updatePromises = announcements.map(announcement => {
      if (!announcement.hiddenBy.includes(studentId)) {
        announcement.hiddenBy.push(studentId);
        return announcement.save();
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);

    await delCacheByPattern(`student-announcements:${req.schoolId}:${studentId}:*`);

    res.json({
      success: true,
      message: `${announcements.length} announcements cleared`,
      count: announcements.length
    });
  } catch (error) {
    console.error('Clear all announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

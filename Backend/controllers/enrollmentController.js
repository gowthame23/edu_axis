import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';

// Get all enrollments for a student
export const getStudentEnrollments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolId } = req.user;

    const enrollments = await Enrollment.find({
      studentId,
      schoolId,
      status: { $in: ['active', 'completed'] }
    })
      .populate({
        path: 'courseId',
        select: 'name code description teacherId semester status',
        populate: {
          path: 'teacherId',
          select: 'name email'
        }
      })
      .select('-schoolId')
      .lean();

    res.status(200).json({
      success: true,
      data: enrollments,
      count: enrollments.length
    });
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: err.message
    });
  }
};

// Get available courses for registration
export const getAvailableCourses = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { studentId } = req.params;

    // Get already enrolled courses
    const enrolledCourses = await Enrollment.find({
      studentId,
      schoolId,
      status: 'active'
    }).distinct('courseId');

    // Get available courses
    const availableCourses = await Course.find({
      schoolId,
      status: 'active',
      _id: { $nin: enrolledCourses }
    })
      .select('name code description credits semester teacherId')
      .populate('teacherId', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: availableCourses,
      enrolledCount: enrolledCourses.length
    });
  } catch (err) {
    console.error('Error fetching available courses:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available courses',
      error: err.message
    });
  }
};

// Register student for a course
export const enrollCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const { schoolId } = req.user;

    // Check if already actively enrolled
    const activeEnrollment = await Enrollment.findOne({
      studentId,
      courseId,
      schoolId,
      status: 'active'
    });

    if (activeEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    // Check if there's a dropped/previous enrollment to reactivate
    const droppedEnrollment = await Enrollment.findOne({
      studentId,
      courseId,
      schoolId,
      status: { $in: ['dropped', 'completed'] }
    });

    if (droppedEnrollment) {
      // Reactivate the existing enrollment
      droppedEnrollment.status = 'active';
      droppedEnrollment.enrollmentDate = new Date();
      droppedEnrollment.updatedAt = new Date();
      await droppedEnrollment.save();

      return res.status(200).json({
        success: true,
        message: 'Successfully re-enrolled in course',
        data: droppedEnrollment
      });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create new enrollment
    const enrollment = new Enrollment({
      studentId,
      courseId,
      schoolId,
      status: 'active',
      enrollmentDate: new Date()
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: err.message
    });
  }
};

// Get course enrollment statistics
export const getCourseEnrollmentStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { schoolId } = req.user;

    const enrollments = await Enrollment.find({
      courseId,
      schoolId
    });

    const stats = {
      total: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      dropped: enrollments.filter(e => e.status === 'dropped').length,
      waitlisted: enrollments.filter(e => e.status === 'waitlisted').length,
      averageGrade: enrollments.reduce((sum, e) => sum + (e.marks || 0), 0) / (enrollments.length || 1)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching enrollment stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment statistics',
      error: err.message
    });
  }
};

// Update enrollment (admin only - can change grade, attendance, etc.)
export const updateEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { grade, marks, attendance, status } = req.body;

    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        ...(grade && { grade }),
        ...(marks !== undefined && { marks }),
        ...(attendance && { attendance }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: enrollment
    });
  } catch (err) {
    console.error('Error updating enrollment:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update enrollment',
      error: err.message
    });
  }
};

// Drop a course
export const dropCourse = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { status: 'dropped', updatedAt: new Date() },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course dropped successfully',
      data: enrollment
    });
  } catch (err) {
    console.error('Error dropping course:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to drop course',
      error: err.message
    });
  }
};

import Feedback from '../models/Feedback.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import AuditLog from '../models/AuditLog.js';

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      type,
      rating,
      comments,
      strengths,
      areasForImprovement,
      suggestions,
      isAnonymous
    } = req.body;
    const { schoolId } = req.user;

    // Validate required fields
    if (!type || !rating || !rating.overall) {
      return res.status(400).json({
        success: false,
        message: 'Type and overall rating are required'
      });
    }

    if (type === 'course' && !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required for course feedback'
      });
    }

    const feedback = new Feedback({
      schoolId,
      studentId: isAnonymous ? null : (studentId || null),
      courseId: courseId || undefined,
      type: 'course',
      rating,
      comments: comments || '',
      strengths: strengths || [],
      areasForImprovement: areasForImprovement || [],
      suggestions: suggestions || '',
      isAnonymous: isAnonymous || false,
      status: 'submitted'
    });

    await feedback.save();

    // Log action (non-blocking)
    try {
      await logAuditAction(req.user._id || req.user.id, 'CREATE', 'Feedback', feedback._id, 'Feedback Submitted', req);
    } catch (auditErr) {
      console.error('Audit logging failed:', auditErr);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: err.message
    });
  }
};
// Get student's own feedback history
export const getStudentFeedback = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolId } = req.user;

    const feedbacks = await Feedback.find({
      studentId,
      schoolId
    })
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
      .select('-schoolId')
      .lean();

    res.status(200).json({
      success: true,
      data: feedbacks,
      count: feedbacks.length
    });
  } catch (err) {
    console.error('Error fetching student feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: err.message
    });
  }
};
// Get feedback for a course
export const getCourseFeedback = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { schoolId } = req.user;

    const feedbacks = await Feedback.find({
      courseId,
      schoolId,
      type: 'course',
      status: 'submitted'
    }).select('-schoolId').lean();

    // Calculate statistics
    const stats = {
      total: feedbacks.length,
      averageRating: feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating.overall, 0) / feedbacks.length
        : 0,
      ratingBreakdown: {
        5: feedbacks.filter(f => f.rating.overall === 5).length,
        4: feedbacks.filter(f => f.rating.overall === 4).length,
        3: feedbacks.filter(f => f.rating.overall === 3).length,
        2: feedbacks.filter(f => f.rating.overall === 2).length,
        1: feedbacks.filter(f => f.rating.overall === 1).length
      }
    };

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        statistics: stats
      }
    });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: err.message
    });
  }
};

// Get teacher feedback
export const getModuleFeedback = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { schoolId } = req.user;

    const feedbacks = await Feedback.find({
      teacherId: moduleId,
      schoolId,
      type: 'teacher',
      status: 'submitted'
    })
      .populate('teacherId', 'name email')
      .select('-schoolId')
      .lean();

    const stats = {
      total: feedbacks.length,
      averageRating: feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating.overall, 0) / feedbacks.length
        : 0,
      averageContentQuality: feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + (f.rating.contentQuality || 0), 0) / feedbacks.length
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        statistics: stats
      }
    });
  } catch (err) {
    console.error('Error fetching teacher feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: err.message
    });
  }
};

// Get all feedback dashboard (admin)
export const getFeedbackDashboard = async (req, res) => {
  try {
    const { schoolId } = req.user;

    // Fetch ALL feedback regardless of status
    const feedbacks = await Feedback.find({
      schoolId
    })
      .populate('studentId', 'name email grade')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: feedbacks.length,
      byType: {
        course: feedbacks.filter(f => f.type === 'course').length
      },
      byStatus: {
        submitted: feedbacks.filter(f => f.status === 'submitted').length,
        reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
        'acted-upon': feedbacks.filter(f => f.status === 'acted-upon').length
      },
      averageRating: feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating.overall, 0) / feedbacks.length
        : 0,
      topStrengths: feedbacks
        .flatMap(f => f.strengths || [])
        .reduce((acc, strength) => {
          acc[strength] = (acc[strength] || 0) + 1;
          return acc;
        }, {}),
      topImprovements: feedbacks
        .flatMap(f => f.areasForImprovement || [])
        .reduce((acc, area) => {
          acc[area] = (acc[area] || 0) + 1;
          return acc;
        }, {})
    };

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        statistics: stats
      }
    });
  } catch (err) {
    console.error('Error fetching feedback dashboard:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback dashboard',
      error: err.message
    });
  }
};

// Review feedback (admin)
export const reviewFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { adminResponse, status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        adminResponse,
        status: status || 'reviewed'
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback reviewed',
      data: feedback
    });
  } catch (err) {
    console.error('Error reviewing feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to review feedback',
      error: err.message
    });
  }
};

// Helper function for audit logging
async function logAuditAction(userId, action, resource, resourceId, resourceName, req) {
  try {
    const auditLog = new AuditLog({
      userId,
      action,
      resource,
      resourceId,
      resourceName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });
    await auditLog.save();
  } catch (err) {
    console.error('Error logging audit action:', err);
  }
}

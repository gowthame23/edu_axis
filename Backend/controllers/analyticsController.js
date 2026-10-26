import PerformanceAnalytic from '../models/PerformanceAnalytic.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Submission from '../models/Submission.js';
import Attendance from '../models/Attendance.js';
import AuditLog from '../models/AuditLog.js';

// Get student performance analytics
export const getStudentPerformance = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { schoolId } = req.user;

    // Build query - courseId is optional
    const query = {
      studentId,
      schoolId
    };

    // Only add courseId to query if it's provided and not 'undefined'
    if (courseId && courseId !== 'undefined') {
      query.courseId = courseId;
    }

    const analytics = await PerformanceAnalytic.findOne(query);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Performance analytics not found'
      });
    }

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('Error fetching performance:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: err.message
    });
  }
};

// Calculate and update student analytics
export const updateStudentPerformance = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { schoolId } = req.user;

    // Get quiz attempts
    const quizAttempts = await QuizAttempt.find({
      studentId,
      courseId,
      schoolId,
      status: 'passed'
    });

    const quizScores = quizAttempts.map(q => q.percentageScore);

    // Get submissions (assignments)
    const submissions = await Submission.find({
      studentId,
      courseId,
      schoolId
    });

    const submissionScores = submissions.map(s => s.score || 0);

    // Get attendance
    const attendance = await Attendance.find({
      studentId,
      courseId,
      schoolId
    });

    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.status === 'present').length;

    // Determine risk level
    const riskFactors = [];
    if (submissionScores.length > 0 && submissionScores.reduce((a, b) => a + b) / submissionScores.length < 50) {
      riskFactors.push('Low Assignment Scores');
    }
    if (quizScores.length > 0 && quizScores.reduce((a, b) => a + b) / quizScores.length < 50) {
      riskFactors.push('Failing Tests');
    }
    if (totalClasses > 0 && (presentClasses / totalClasses) < 0.75) {
      riskFactors.push('Low Attendance');
    }

    const riskLevel = riskFactors.length > 1 ? 'critical' : riskFactors.length > 0 ? 'high' : 'low';

    // Update or create analytics
    const analytics = await PerformanceAnalytic.findOneAndUpdate(
      { studentId, courseId, schoolId },
      {
        assignments: {
          completed: submissions.filter(s => s.status === 'submitted').length,
          pending: submissions.filter(s => s.status === 'pending').length,
          averageScore: submissionScores.length > 0 ? submissionScores.reduce((a, b) => a + b) / submissionScores.length : 0,
          scores: submissionScores
        },
        tests: {
          quizzesTaken: quizAttempts.length,
          averageScore: quizScores.length > 0 ? quizScores.reduce((a, b) => a + b) / quizScores.length : 0,
          highestScore: quizScores.length > 0 ? Math.max(...quizScores) : 0,
          lowestScore: quizScores.length > 0 ? Math.min(...quizScores) : 0,
          scores: quizScores
        },
        attendance: {
          totalClasses,
          classesAttended: presentClasses,
          percentage: totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0
        },
        riskFactors,
        riskLevel,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Performance analytics updated',
      data: analytics
    });
  } catch (err) {
    console.error('Error updating performance:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update performance analytics',
      error: err.message
    });
  }
};

// Get at-risk students
export const getAtRiskStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { schoolId } = req.user;

    const atRiskStudents = await PerformanceAnalytic.find({
      courseId,
      schoolId,
      riskLevel: { $in: ['high', 'critical'] }
    })
      .populate('studentId', 'name email grade')
      .select('-schoolId')
      .lean();

    res.status(200).json({
      success: true,
      data: atRiskStudents,
      count: atRiskStudents.length
    });
  } catch (err) {
    console.error('Error fetching at-risk students:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch at-risk students',
      error: err.message
    });
  }
};

// Get class performance report
export const getClassPerformanceReport = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { schoolId } = req.user;

    const analytics = await PerformanceAnalytic.find({
      courseId,
      schoolId
    }).lean();

    const allScores = analytics.flatMap(a => a.tests.scores);
    const classAverage = allScores.length > 0
      ? allScores.reduce((a, b) => a + b) / allScores.length
      : 0;

    const sortedScores = [...allScores].sort((a, b) => a - b);
    const classMedian = sortedScores.length > 0
      ? sortedScores[Math.floor(sortedScores.length / 2)]
      : 0;

    const report = {
      totalStudents: analytics.length,
      classAverage,
      classMedian,
      distribution: {
        excellent: analytics.filter(a => a.tests.averageScore >= 90).length,
        good: analytics.filter(a => a.tests.averageScore >= 75 && a.tests.averageScore < 90).length,
        average: analytics.filter(a => a.tests.averageScore >= 60 && a.tests.averageScore < 75).length,
        below: analytics.filter(a => a.tests.averageScore < 60).length
      },
      averageAttendance: analytics.length > 0
        ? analytics.reduce((sum, a) => sum + a.attendance.percentage, 0) / analytics.length
        : 0,
      atRiskCount: analytics.filter(a => a.riskLevel !== 'low').length
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('Error fetching class report:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class performance report',
      error: err.message
    });
  }
};

// Get student performance trend
export const getPerformanceTrend = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { schoolId } = req.user;

    // Build query - courseId is optional
    const query = {
      studentId,
      schoolId
    };

    // Only add courseId to query if it's provided and not 'undefined'
    if (courseId && courseId !== 'undefined') {
      query.courseId = courseId;
    }

    const quizAttempts = await QuizAttempt.find(query)
      .sort({ createdAt: 1 })
      .select('percentageScore createdAt')
      .lean();

    const trend = quizAttempts.map(q => ({
      date: new Date(q.createdAt).toLocaleDateString(),
      score: q.percentageScore
    }));

    // Determine trend direction
    if (trend.length > 1) {
      const recentScores = trend.slice(-5);
      const oldScores = trend.slice(0, Math.max(1, trend.length - 5));
      const recentAvg = recentScores.reduce((a, b) => a + b.score, 0) / recentScores.length;
      const oldAvg = oldScores.reduce((a, b) => a + b.score, 0) / oldScores.length;
      const trendDirection = recentAvg > oldAvg ? 'improving' : recentAvg < oldAvg ? 'declining' : 'stable';

      return res.status(200).json({
        success: true,
        data: {
          trend,
          direction: trendDirection,
          recentAverage: recentAvg,
          previousAverage: oldAvg
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        trend,
        direction: 'no-data'
      }
    });
  } catch (err) {
    console.error('Error fetching performance trend:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trend',
      error: err.message
    });
  }
};

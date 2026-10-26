import Grade from '../models/Grade.js';
import Attendance from '../models/Attendance.js';
import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

/**
 * Get student's overall performance analytics
 */
export const getStudentPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    const schoolId = req.user.schoolId;

    // Security: Ensure student can only view their own data
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query filters
    const gradeQuery = { studentId, schoolId };
    const attendanceQuery = { studentId, schoolId };
    const submissionQuery = { studentId, schoolId };

    if (courseId) {
      gradeQuery.courseId = courseId;
      attendanceQuery.courseId = courseId;
    }

    // Fetch all relevant data in parallel
    const [directGrades, gradedSubmissions, attendanceRecords, enrollments] = await Promise.all([
      Grade.find(gradeQuery).populate('courseId', 'name'),
      Submission.find({ ...submissionQuery, status: 'graded' })
        .populate({
          path: 'assignmentId',
          select: 'title courseId subject',
          populate: { path: 'courseId', select: 'name' }
        }),
      Attendance.find(attendanceQuery).populate('courseId', 'name'),
      Enrollment.find({ studentId, schoolId, status: 'active' }).populate('courseId', 'name')
    ]);

    // Combine direct grades and graded submissions into a unified grades array
    const grades = [
      ...directGrades.map(g => ({
        score: g.score,
        subject: g.subject,
        courseId: g.courseId,
        date: g.date,
        type: g.type
      })),
      ...gradedSubmissions.map(s => ({
        score: s.marks || 0,
        subject: s.assignmentId?.courseId?.name || s.assignmentId?.subject || 'Assignment',
        courseId: s.assignmentId?.courseId,
        date: s.gradedAt || s.updatedAt,
        type: 'assignment'
      }))
    ];

    // Calculate average grade
    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const averageGrade = grades.length > 0 ? (totalScore / grades.length).toFixed(1) : 0;

    // Calculate attendance percentage
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0;

    // Get assignment statistics
    const assignments = await Assignment.find({ 
      courseId: courseId || { $in: enrollments.map(e => e.courseId) }
    });
    
    const allSubmissions = await Submission.find(submissionQuery).populate('assignmentId');
    const submittedCount = allSubmissions.length;
    const onlyGradedSubmissions = allSubmissions.filter(s => s.status === 'graded');
    const avgSubmissionScore = onlyGradedSubmissions.length > 0 
      ? (onlyGradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / onlyGradedSubmissions.length).toFixed(1)
      : 0;

    // Calculate performance by subject/course
    const performanceBySubject = {};
    
    grades.forEach(grade => {
      const subjectKey = grade.courseId?.name || grade.subject;
      if (!performanceBySubject[subjectKey]) {
        performanceBySubject[subjectKey] = {
          subject: subjectKey,
          grades: [],
          attendance: [],
          submissions: 0
        };
      }
      performanceBySubject[subjectKey].grades.push(grade.score);
    });

    attendanceRecords.forEach(record => {
      const subjectKey = record.courseId?.name;
      if (subjectKey && performanceBySubject[subjectKey]) {
        performanceBySubject[subjectKey].attendance.push(record.status);
      }
    });

    allSubmissions.forEach(sub => {
      const courseKey = sub.assignmentId?.courseId;
      if (courseKey) {
        const course = performanceBySubject[courseKey];
        if (course) {
          course.submissions += 1;
        }
      }
    });

    // Convert to array with calculated averages
    const subjectPerformance = Object.values(performanceBySubject).map(subject => {
      const avgGrade = subject.grades.length > 0
        ? (subject.grades.reduce((a, b) => a + b, 0) / subject.grades.length).toFixed(1)
        : 0;
      
      const presentInSubject = subject.attendance.filter(s => s === 'present' || s === 'late').length;
      const attendanceRate = subject.attendance.length > 0
        ? ((presentInSubject / subject.attendance.length) * 100).toFixed(1)
        : 0;

      return {
        subject: subject.subject,
        averageGrade: parseFloat(avgGrade),
        attendanceRate: parseFloat(attendanceRate),
        totalGrades: subject.grades.length,
        totalAttendance: subject.attendance.length,
        submissions: subject.submissions
      };
    });

    // Determine risk level
    let riskLevel = 'low';
    if (averageGrade < 50 || attendancePercentage < 75) {
      riskLevel = 'high';
    } else if (averageGrade < 70 || attendancePercentage < 85) {
      riskLevel = 'medium';
    }

    // Calculate trend (compare last month vs previous)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const recentGrades = grades.filter(g => new Date(g.date) >= oneMonthAgo);
    const olderGrades = grades.filter(g => new Date(g.date) >= twoMonthsAgo && new Date(g.date) < oneMonthAgo);

    const recentAvg = recentGrades.length > 0
      ? recentGrades.reduce((sum, g) => sum + g.score, 0) / recentGrades.length
      : 0;
    const olderAvg = olderGrades.length > 0
      ? olderGrades.reduce((sum, g) => sum + g.score, 0) / olderGrades.length
      : 0;

    let trend = 'stable';
    if (recentAvg > olderAvg + 5) trend = 'improving';
    else if (recentAvg < olderAvg - 5) trend = 'declining';

    res.json({
      success: true,
      data: {
        overallScore: parseFloat(averageGrade),
        attendancePercentage: parseFloat(attendancePercentage),
        totalGrades: grades.length,
        totalAttendance: totalAttendance,
        submittedAssignments: submittedCount,
        totalAssignments: assignments.length,
        avgAssignmentScore: parseFloat(avgSubmissionScore),
        riskLevel,
        trend,
        subjectPerformance,
        enrolledCourses: enrollments.length
      }
    });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student performance',
      error: error.message
    });
  }
};

/**
 * Get student's performance trend over time
 */
export const getPerformanceTrend = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    const schoolId = req.user.schoolId;

    // Get grades from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const query = { 
      studentId,
      schoolId,
      date: { $gte: sixMonthsAgo }
    };

    if (courseId) {
      query.courseId = courseId;
    }

    const [directGrades, gradedSubmissions] = await Promise.all([
      Grade.find(query).sort({ date: 1 }),
      Submission.find({ studentId, schoolId, status: 'graded', gradedAt: { $gte: sixMonthsAgo } })
        .populate('assignmentId', 'courseId')
        .sort({ gradedAt: 1 })
    ]);

    // Combine into unified grades array
    const grades = [
      ...directGrades.map(g => ({ score: g.score, date: g.date })),
      ...gradedSubmissions.map(s => ({ score: s.marks || 0, date: s.gradedAt || s.updatedAt }))
    ];

    const attendanceRecords = await Attendance.find(query).sort({ date: 1 });

    // Group by month
    const monthlyData = {};

    grades.forEach(grade => {
      const monthKey = new Date(grade.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          grades: [],
          attendance: []
        };
      }
      monthlyData[monthKey].grades.push(grade.score);
    });

    attendanceRecords.forEach(record => {
      const monthKey = new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          grades: [],
          attendance: []
        };
      }
      monthlyData[monthKey].attendance.push(record.status);
    });

    // Calculate averages for each month
    const trendData = Object.values(monthlyData).map(month => {
      const avgGrade = month.grades.length > 0
        ? month.grades.reduce((a, b) => a + b, 0) / month.grades.length
        : 0;
      
      const presentCount = month.attendance.filter(s => s === 'present' || s === 'late').length;
      const attendanceRate = month.attendance.length > 0
        ? (presentCount / month.attendance.length) * 100
        : 0;

      return {
        month: month.month,
        averageGrade: parseFloat(avgGrade.toFixed(1)),
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        totalGrades: month.grades.length,
        totalAttendance: month.attendance.length
      };
    });

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Get performance trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trend',
      error: error.message
    });
  }
};

/**
 * Get detailed breakdown by grade type
 */
export const getGradeBreakdown = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    const schoolId = req.user.schoolId;

    const query = { studentId, schoolId };
    if (courseId) {
      query.courseId = courseId;
    }

    const [directGrades, gradedSubmissions] = await Promise.all([
      Grade.find(query).populate('courseId', 'name'),
      Submission.find({ studentId, schoolId, status: 'graded' })
        .populate('assignmentId', 'title courseId')
    ]);

    // Combine grades from both sources
    const allGrades = [
      ...directGrades.map(g => ({ score: g.score, type: g.type })),
      ...gradedSubmissions.map(s => ({ score: s.marks || 0, type: 'assignment' }))
    ];

    // Group by type
    const breakdown = allGrades.reduce((acc, grade) => {
      if (!acc[grade.type]) {
        acc[grade.type] = {
          type: grade.type,
          scores: [],
          count: 0
        };
      }
      acc[grade.type].scores.push(grade.score);
      acc[grade.type].count += 1;
      return acc;
    }, {});

    const result = Object.values(breakdown).map(item => ({
      type: item.type,
      average: (item.scores.reduce((a, b) => a + b, 0) / item.count).toFixed(1),
      count: item.count,
      highest: Math.max(...item.scores),
      lowest: Math.min(...item.scores)
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get grade breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grade breakdown',
      error: error.message
    });
  }
};

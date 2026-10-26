import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Module from '../models/Module.js';
import Enrollment from '../models/Enrollment.js';

// Create quiz (admin/teacher)
export const createQuiz = async (req, res) => {
  try {
    const {
      courseId,
      moduleId,
      title,
      description,
      duration,
      passingScore,
      questions,
      prerequisiteModuleId
    } = req.body;
    const { schoolId } = req.user;

    const quiz = new Quiz({
      schoolId,
      courseId,
      moduleId,
      title,
      description,
      duration,
      passingScore,
      questions,
      prerequisiteModuleId,
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0)
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: err.message
    });
  }
};

// Get quiz details
export const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId)
      .populate('prerequisiteModuleId', 'title order')
      .lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    console.error('Error fetching quiz:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: err.message
    });
  }
};

// Check if student can take quiz (prerequisite check)
export const checkQuizPrerequisite = async (req, res) => {
  try {
    const { quizId, studentId } = req.params;

    const quiz = await Quiz.findById(quizId).select('prerequisiteModuleId title');
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // If no prerequisite, can take quiz
    if (!quiz.prerequisiteModuleId) {
      return res.status(200).json({
        success: true,
        canTakeQuiz: true,
        message: 'No prerequisites'
      });
    }

    // Check if student completed prerequisite module
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: quiz.courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Student not enrolled in this course'
      });
    }

    const hasCompleted = enrollment.completedModules.some(
      m => m.moduleId.toString() === quiz.prerequisiteModuleId.toString()
    );

    res.status(200).json({
      success: true,
      canTakeQuiz: hasCompleted,
      prerequisiteModule: quiz.prerequisiteModuleId,
      message: hasCompleted ? 'Prerequisite completed' : 'Please complete the prerequisite module first'
    });
  } catch (err) {
    console.error('Error checking prerequisites:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check prerequisites',
      error: err.message
    });
  }
};

// Start quiz attempt
export const startQuizAttempt = async (req, res) => {
  try {
    const { quizId, studentId, courseId } = req.body;
    const { schoolId } = req.user;

    // Check prerequisite
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.prerequisiteModuleId) {
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId,
        schoolId
      });

      const hasCompleted = enrollment?.completedModules.some(
        m => m.moduleId.toString() === quiz.prerequisiteModuleId.toString()
      );

      if (!hasCompleted) {
        return res.status(403).json({
          success: false,
          message: 'Please complete the prerequisite module first'
        });
      }
    }

    // Create quiz attempt
    const attempt = new QuizAttempt({
      schoolId,
      quizId,
      studentId,
      courseId,
      startTime: new Date(),
      status: 'in-progress'
    });

    await attempt.save();

    res.status(201).json({
      success: true,
      message: 'Quiz attempt started',
      data: {
        attemptId: attempt._id,
        quizId: quiz._id,
        duration: quiz.duration,
        questions: quiz.questions
      }
    });
  } catch (err) {
    console.error('Error starting quiz:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: err.message
    });
  }
};

// Submit quiz answers
export const submitQuizAttempt = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Calculate score
    let totalMarks = 0;
    let obtainedMarks = 0;
    const processedAnswers = [];

    answers.forEach(answer => {
      const question = quiz.questions.find(q => q.id.toString() === answer.questionId);
      if (question) {
        totalMarks += question.marks || 1;
        const isCorrect = answer.studentAnswer === question.correctAnswer;
        if (isCorrect) {
          obtainedMarks += question.marks || 1;
        }
        processedAnswers.push({
          questionId: answer.questionId,
          studentAnswer: answer.studentAnswer,
          isCorrect,
          marksObtained: isCorrect ? question.marks : 0
        });
      }
    });

    const percentageScore = (obtainedMarks / totalMarks) * 100;
    const status = percentageScore >= quiz.passingScore ? 'passed' : 'failed';

    attempt.answers = processedAnswers;
    attempt.score = obtainedMarks;
    attempt.percentageScore = percentageScore;
    attempt.status = status;
    attempt.endTime = new Date();
    attempt.duration = Math.round((attempt.endTime - attempt.startTime) / 60000);

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        score: obtainedMarks,
        totalMarks,
        percentageScore,
        status,
        feedback: quiz.showAnswers ? processedAnswers : null
      }
    });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: err.message
    });
  }
};

// Get quiz results
export const getQuizResults = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findById(attemptId)
      .populate('quizId', 'title totalMarks passingScore')
      .select('-schoolId');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results',
      error: err.message
    });
  }
};

// Get student quiz attempts
export const getStudentQuizAttempts = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { schoolId } = req.user;

    const attempts = await QuizAttempt.find({
      studentId,
      courseId,
      schoolId
    })
      .populate('quizId', 'title totalMarks')
      .select('-schoolId -answers')
      .lean();

    res.status(200).json({
      success: true,
      data: attempts
    });
  } catch (err) {
    console.error('Error fetching quiz attempts:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempts',
      error: err.message
    });
  }
};

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { assertSameSchoolUser, assertSameSchoolStudent, assertSameSchoolCourse } from '../middleware/tenantGuards.js';
import { updateUser, deleteUser, updateCourse, deleteCourse } from '../controllers/adminController.js';
import { enrollCourse, updateEnrollment, dropCourse } from '../controllers/enrollmentController.js';
import { reviewFeedback } from '../controllers/feedbackController.js';
import { getQuiz, startQuizAttempt, submitQuizAttempt, getQuizResults } from '../controllers/quizController.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Feedback from '../models/Feedback.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

vi.mock('../models/User.js');
vi.mock('../models/Course.js');
vi.mock('../models/Enrollment.js');
vi.mock('../models/Feedback.js');
vi.mock('../models/Quiz.js');
vi.mock('../models/QuizAttempt.js');
vi.mock('../services/cacheService.js', () => ({
  delCacheByPattern: vi.fn().mockResolvedValue(true),
  getOrSetCache: vi.fn(),
  cacheKey: vi.fn()
}));

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((data) => {
    res.body = data;
    return res;
  });
  return res;
};

describe('Multi-Tenant Data Isolation Between Schools', () => {
  const SCHOOL_A = '65000000000000000000000a';
  const SCHOOL_B = '65000000000000000000000b';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tenant Guards Middleware', () => {
    it('assertSameSchoolUser throws 403 when user belongs to a different school', async () => {
      User.findOne = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });
      User.exists = vi.fn().mockResolvedValue(true); // Exists in other school

      await expect(
        assertSameSchoolUser('user-b', SCHOOL_A, { forbiddenMessage: 'Cross-tenant access blocked' })
      ).rejects.toThrow('Cross-tenant access blocked');
    });

    it('assertSameSchoolUser succeeds when user matches schoolId', async () => {
      const mockUser = { _id: 'user-a', schoolId: SCHOOL_A, name: 'Student A' };
      User.findOne = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      });

      const result = await assertSameSchoolUser('user-a', SCHOOL_A);
      expect(result).toEqual(mockUser);
    });

    it('assertSameSchoolStudent rejects user if not a student role', async () => {
      User.findOne = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });
      User.exists = vi.fn().mockResolvedValue(false);

      await expect(
        assertSameSchoolStudent('user-x', SCHOOL_A)
      ).rejects.toThrow('Student not found');
    });

    it('assertSameSchoolCourse rejects course from another school with 403', async () => {
      Course.findOne = vi.fn().mockResolvedValue(null);
      Course.exists = vi.fn().mockImplementation(({ schoolId }) => {
        return Promise.resolve(!schoolId); // exists globally, but not in SCHOOL_A
      });

      await expect(
        assertSameSchoolCourse('course-b', SCHOOL_A)
      ).rejects.toThrow('Course is not in your school');
    });
  });

  describe('Admin User & Course Isolation', () => {
    it('prevents School A admin from updating School B user', async () => {
      User.findOneAndUpdate = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(null) // Not found under School A
      });

      const req = {
        params: { id: 'user-b' },
        body: { name: 'Compromised Name' },
        schoolId: SCHOOL_A
      };
      const res = createRes();

      await updateUser(req, res);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'user-b', schoolId: SCHOOL_A },
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toBe('User not found');
    });

    it('prevents School A admin from deleting School B user', async () => {
      User.findOneAndDelete = vi.fn().mockResolvedValue(null); // Not found under School A

      const req = { params: { id: 'user-b' }, schoolId: SCHOOL_A };
      const res = createRes();

      await deleteUser(req, res);

      expect(User.findOneAndDelete).toHaveBeenCalledWith({ _id: 'user-b', schoolId: SCHOOL_A });
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('prevents School A admin from updating School B course', async () => {
      Course.findOneAndUpdate = vi.fn().mockResolvedValue(null);

      const req = {
        params: { id: 'course-b' },
        body: { name: 'Modified Course' },
        schoolId: SCHOOL_A
      };
      const res = createRes();

      await updateCourse(req, res);

      expect(Course.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'course-b', schoolId: SCHOOL_A },
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('prevents School A admin from deleting School B course', async () => {
      Course.findOneAndDelete = vi.fn().mockResolvedValue(null);

      const req = { params: { id: 'course-b' }, schoolId: SCHOOL_A };
      const res = createRes();

      await deleteCourse(req, res);

      expect(Course.findOneAndDelete).toHaveBeenCalledWith({ _id: 'course-b', schoolId: SCHOOL_A });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Course Enrollment Isolation', () => {
    it('blocks student in School A from enrolling in School B course', async () => {
      User.findOne = vi.fn().mockResolvedValue({ _id: 'student-a', schoolId: SCHOOL_A, role: 'student' });
      Enrollment.findOne = vi.fn().mockResolvedValue(null);
      // Course lookup scoped by schoolId returns null
      Course.findOne = vi.fn().mockResolvedValue(null);

      const req = {
        body: { courseId: 'course-b', studentId: 'student-a' },
        user: { _id: 'student-a', schoolId: SCHOOL_A, role: 'student' },
        schoolId: SCHOOL_A
      };
      const res = createRes();

      await enrollCourse(req, res);

      expect(Course.findOne).toHaveBeenCalledWith({ _id: 'course-b', schoolId: SCHOOL_A });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toContain('Course not found in your school');
    });

    it('prevents updating enrollment belonging to another school', async () => {
      Enrollment.findOneAndUpdate = vi.fn().mockResolvedValue(null);

      const req = {
        params: { enrollmentId: 'enrollment-b' },
        body: { grade: 'A+' },
        user: { _id: 'admin-a', schoolId: SCHOOL_A, role: 'admin' },
        schoolId: SCHOOL_A
      };
      const res = createRes();

      await updateEnrollment(req, res);

      expect(Enrollment.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'enrollment-b', schoolId: SCHOOL_A },
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('prevents dropping enrollment belonging to another school', async () => {
      Enrollment.findOneAndUpdate = vi.fn().mockResolvedValue(null);

      const req = {
        params: { enrollmentId: 'enrollment-b' },
        user: { _id: 'student-a', schoolId: SCHOOL_A, role: 'student' },
        schoolId: SCHOOL_A
      };
      const res = createRes();

      await dropCourse(req, res);

      expect(Enrollment.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'enrollment-b', schoolId: SCHOOL_A, studentId: 'student-a' },
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Feedback & Quiz Cross-Tenant Isolation', () => {
    it('prevents School A admin from reviewing School B feedback', async () => {
      Feedback.findOneAndUpdate = vi.fn().mockResolvedValue(null);

      const req = {
        params: { feedbackId: 'feedback-b' },
        body: { adminResponse: 'Reviewed', status: 'reviewed' },
        schoolId: SCHOOL_A
      };
      const res = createRes();

      await reviewFeedback(req, res);

      expect(Feedback.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'feedback-b', schoolId: SCHOOL_A },
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('prevents student in School A from accessing School B quiz', async () => {
      Quiz.findOne = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null)
        })
      });

      const req = {
        params: { quizId: 'quiz-b' },
        schoolId: SCHOOL_A,
        user: { _id: 'student-a', schoolId: SCHOOL_A, role: 'student' }
      };
      const res = createRes();

      await getQuiz(req, res);

      expect(Quiz.findOne).toHaveBeenCalledWith({ _id: 'quiz-b', schoolId: SCHOOL_A });
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('prevents student in School A from starting a quiz belonging to School B', async () => {
      Quiz.findOne = vi.fn().mockResolvedValue(null);

      const req = {
        body: { quizId: 'quiz-b', studentId: 'student-a', courseId: 'course-b' },
        user: { _id: 'student-a', schoolId: SCHOOL_A, role: 'student' }
      };
      const res = createRes();

      await startQuizAttempt(req, res);

      expect(Quiz.findOne).toHaveBeenCalledWith({ _id: 'quiz-b', schoolId: SCHOOL_A });
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('prevents student in School A from viewing quiz results belonging to School B', async () => {
      QuizAttempt.findOne = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue(null)
        })
      });

      const req = {
        params: { attemptId: 'attempt-b' },
        user: { _id: 'student-a', schoolId: SCHOOL_A, role: 'student' },
        schoolId: SCHOOL_A
      };
      const res = createRes();

      await getQuizResults(req, res);

      expect(QuizAttempt.findOne).toHaveBeenCalledWith({
        _id: 'attempt-b',
        schoolId: SCHOOL_A,
        studentId: 'student-a'
      });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

import User from '../models/User.js';
import Course from '../models/Course.js';
import { AppError } from './errorHandler.js';

export const assertSameSchoolUser = async (
  userId,
  schoolId,
  { roles = [], notFoundMessage = 'User not found', forbiddenMessage = 'Access denied' } = {}
) => {
  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  if (!schoolId) {
    throw new AppError('School context is required', 400);
  }

  const query = { _id: userId, schoolId };
  if (roles.length > 0) {
    query.role = { $in: roles };
  }

  const user = await User.findOne(query).select('-password');

  if (!user) {
    const existsInOtherSchool = await User.exists({ _id: userId });
    throw new AppError(existsInOtherSchool ? forbiddenMessage : notFoundMessage, existsInOtherSchool ? 403 : 404);
  }

  return user;
};

export const assertSameSchoolStudent = async (
  studentId,
  schoolId,
  options = {}
) => {
  return assertSameSchoolUser(studentId, schoolId, {
    roles: ['student'],
    notFoundMessage: options.notFoundMessage || 'Student not found',
    forbiddenMessage: options.forbiddenMessage || 'Student is not in your school'
  });
};

export const assertSameSchoolCourse = async (
  courseId,
  schoolId,
  {
    teacherId,
    select,
    notFoundMessage = 'Course not found',
    forbiddenMessage = 'Course is not in your school'
  } = {}
) => {
  if (!courseId) {
    throw new AppError('Course ID is required', 400);
  }

  if (!schoolId) {
    throw new AppError('School context is required', 400);
  }

  const query = { _id: courseId, schoolId };
  if (teacherId) {
    query.teacherId = teacherId;
  }

  const courseQuery = Course.findOne(query);
  if (select) {
    courseQuery.select(select);
  }
  const course = await courseQuery;

  if (!course) {
    const existsInSchool = await Course.exists({ _id: courseId, schoolId });
    const existsAnywhere = await Course.exists({ _id: courseId });

    if (existsInSchool || existsAnywhere) {
      throw new AppError(forbiddenMessage, 403);
    }
    throw new AppError(notFoundMessage, 404);
  }

  return course;
};

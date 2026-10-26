import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import School from '../models/School.js';
import { AppError } from './errorHandler.js';
import { catchAsync } from './errorHandler.js';

// Middleware to verify JWT token from cookie
export const authMiddleware = catchAsync(async (req, res, next) => {
  // Prefer cookie token, but fall back to Authorization: Bearer <token>
  const cookieToken = req.cookies.authToken;
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    throw new AppError('No authentication token, access denied', 401);
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Find user
  const user = await User.findById(decoded._id).select('-password');

  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('Account is not active', 403);
  }

  // Attach user to request
  req.user = user;
  req.userId = user._id;
  req.token = token;
  
  // Attach school context for non-superadmin users
  if (user.role !== 'superadmin' && user.schoolId) {
    req.schoolId = user.schoolId;
    
    // Check if school is active
    const school = await School.findById(user.schoolId);
    if (!school) {
      throw new AppError('School not found', 404);
    }
    if (school.status !== 'active') {
      throw new AppError('School account is not active', 403);
    }
    req.school = school;
  }
  
  next();
});

// Middleware to check specific role
export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Required role: ${allowedRoles.join(' or ')}`, 403)
      );
    }

    next();
  };
};

 
 
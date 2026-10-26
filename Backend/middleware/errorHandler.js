/**
 * Global Error Handler Middleware
 * Catches and handles all errors in the application
 */

import logger from '../config/logger.js';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle specific error types
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size too large. Maximum size is 50MB.', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files uploaded.', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected field in file upload.', 400);
  }
  return new AppError(err.message, 400);
};

// Send error response in development
const sendErrorDev = (err, res) => {
  logger.error('Error:', {
    status: err.statusCode,
    message: err.message,
    stack: err.stack,
    error: err,
  });

  res.status(err.statusCode).json({
    success: false,
    status: err.statusCode,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.error('Operational Error:', {
      status: err.statusCode,
      message: err.message,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    // Programming or unknown error: don't leak error details
    logger.error('Unknown Error:', {
      message: err.message,
      stack: err.stack,
      error: err,
    });

    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server.',
    });
  }
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.name === 'MulterError') error = handleMulterError(err);

    sendErrorProd(error, res);
  }
};

// Async error wrapper to catch errors in async routes
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
export const notFound = (req, res, next) => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(err);
};

export default errorHandler;

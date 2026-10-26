/**
 * Request Logging Middleware
 * Logs incoming requests with Winston
 */

import logger from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Response Sent', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

export default requestLogger;

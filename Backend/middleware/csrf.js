/**
 * CSRF Protection Middleware
 * Using csrf-csrf package for double submit cookie pattern
 */

import { doubleCsrf } from 'csrf-csrf';

const SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production';

const csrfOptions = {
  getSecret: () => SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: false, // Set to false so JS can read it for the double-submit pattern
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    signed: false,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    // Check header first, then body
    return req.headers['x-csrf-token'] || req.body?.csrfToken;
  },
};

const {
  invalidCsrfTokenError,
  doubleCsrfProtection,
  generateToken,
} = doubleCsrf(csrfOptions);

// Custom error handler for CSRF
export const csrfErrorHandler = (err, req, res, next) => {
  if (err === invalidCsrfTokenError) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }
  next(err);
};

// Middleware to generate and send CSRF token
export const csrfTokenGenerator = (req, res, next) => {
  const { token } = generateToken();
  res.setHeader('X-CSRF-Token', token);
  req.csrfToken = token;
  res.locals.csrfToken = token;
  next();
};

export { doubleCsrfProtection };
export default doubleCsrfProtection;

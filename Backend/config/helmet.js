/**
 * Helmet Configuration
 * Security headers configuration using Helmet.js
 */

export const helmetOptions = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false,
  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  // Frameguard - prevent clickjacking
  frameguard: { action: 'deny' },
  // Hide Powered-By header
  hidePoweredBy: true,
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // IE No Open
  ieNoOpen: true,
  // Don't Sniff Mimetype
  noSniff: true,
  // Referrer Policy
  referrerPolicy: { policy: 'no-referrer' },
  // XSS Filter
  xssFilter: true,
};

export default helmetOptions;

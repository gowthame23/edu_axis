/**
 * Winston Logger Configuration
 * Handles HTTP request logging (Morgan) and Error logging
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure daily rotate file transport for Morgan HTTP logs
const morganLogsRotate = new DailyRotateFile({
  filename: path.join(__dirname, '../logs/morgan-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d', // Keep HTTP logs for 7 days
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, message }) => {
      return `${timestamp} - ${message}`;
    })
  ),
  level: 'info',
});

// Configure daily rotate file transport for Error logs
const errorLogsRotate = new DailyRotateFile({
  filename: path.join(__dirname, '../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d', // Keep error logs for 14 days
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
});

// Configure combined logs (all levels)
const combinedLogsRotate = new DailyRotateFile({
  filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
});

// Create logger instance with multiple transports
const logger = winston.createLogger({
  level: 'info',
  transports: [
    morganLogsRotate,      // HTTP requests
    errorLogsRotate,       // Errors only
    combinedLogsRotate,    // Everything
  ],
});

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';

// Import configurations
import connectDB from './config/database.js';
import { corsOptions, socketCorsOptions } from './config/cors.js';
import helmetOptions from './config/helmet.js';
// RATE LIMITING DISABLED - Commented out to avoid rate limit issues
// import { apiLimiter, authLimiter } from './config/rateLimit.js';
import logger from './config/logger.js';
import swaggerSpec from './docs/swagger.js';
import { initRedis } from './services/cacheService.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import webServiceRoutes from './routes/webServiceRoutes.js';

// Import middleware
import errorHandler, { notFound } from './middleware/errorHandler.js';
import { doubleCsrfProtection, csrfTokenGenerator, csrfErrorHandler } from './middleware/csrf.js';

// Load environment variables
dotenv.config();

// Handle uncaught exceptions (must be at the top)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥', err);
  process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();
initRedis();

// Security Middleware (must be first)
app.use(helmet(helmetOptions)); // Secure HTTP headers
app.use(cors(corsOptions)); // CORS configuration

// Trust proxy (if behind reverse proxy like nginx)
app.set('trust proxy', 1);

// Morgan stream to Winston logger (logs to file only, no console spam)
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Custom Morgan token for device type
morgan.token('device', (req) => {
  const ua = req.headers['user-agent'] || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
  return isMobile ? 'Mobile' : 'Desktop';
});

// Request logging - same compact format to both console and file
const logFormat = ':method :url :status :res[content-length] - :response-time ms - :device';
app.use(morgan(logFormat)); // Console
app.use(morgan(logFormat, { stream: morganStream })); // File

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API documentation (Swagger)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: socketCorsOptions
});

io.on('connection', (socket) => {
  // Allow clients to join a room for their user id so server can send direct messages
  socket.on('join', (payload) => {
    try {
      const userId = payload?.userId;
      if (userId) {
        socket.join(`user:${userId}`);
      }
    } catch (err) {
      console.error('Socket join error:', err);
    }
  });

  // Typing indicator
  socket.on('typing:start', (payload) => {
    try {
      const { recipientId, senderId, senderName } = payload || {};
      if (recipientId && senderId) {
        io.to(`user:${recipientId}`).emit('typing:start', { senderId, senderName });
      }
    } catch (err) {
      console.error('Socket typing:start error:', err);
    }
  });

  socket.on('typing:stop', (payload) => {
    try {
      const { recipientId, senderId } = payload || {};
      if (recipientId && senderId) {
        io.to(`user:${recipientId}`).emit('typing:stop', { senderId });
      }
    } catch (err) {
      console.error('Socket typing:stop error:', err);
    }
  });

  socket.on('disconnect', () => {
    // Silent disconnect
  });

  // Optional: allow socket-created messages (prototype). Server will persist and emit.
  socket.on('message:create', async (payload) => {
    try {
      const { recipientId, text, senderId } = payload || {};
      if (!recipientId || !text || !senderId) return;
      // Lazy load model to avoid circular imports
      const Message = (await import('./models/Message.js')).default;
      const message = await Message.create({ sender: senderId, recipient: recipientId, text });
      await message.populate('sender', 'name email');
      io.to(`user:${recipientId}`).emit('message:received', message);
    } catch (err) {
      console.error('Socket message:create failed:', err);
    }
  });
});

// Make io available in routes/controllers
app.set('io', io);

// Health check endpoint (no rate limit)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduAxis backend is running',
    health: '/api/health',
    docs: '/api-docs'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'EduAxis API is running!',
    timestamp: new Date().toISOString()
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenGenerator, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken
  });
});

// RATE LIMITING DISABLED - No more rate limits
// app.use('/api', apiLimiter);

// Routes - Auth routes don't need CSRF protection (login/register are public)
app.use('/api/auth', authRoutes);

// CSRF Protection DISABLED - Causing issues with delete/send operations
// app.use(doubleCsrfProtection);
// app.use(csrfErrorHandler);
// Protected routes (CSRF disabled)
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/administrator', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', webServiceRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

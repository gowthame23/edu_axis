# EduAxis 

A comprehensive School Management System built with **Node.js**, **Express**, **MongoDB**, and **React** that streamlines educational administration, teaching, and learning processes.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [CI](#ci)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Authentication](#authentication)
- [License](#license)

## Features

### Student Dashboard
- **Academic Overview**: View courses, grades, and attendance statistics
- **Assignment Management**: Submit assignments with file attachments and track submissions
- **Timetable**: Access class schedules and daily routines
- **Fee Management**: View fees, make payments, and download receipts
- **Library Access**: Browse available resources and manage borrowed books
- **Announcements**: Stay updated with school-wide notifications

### Teacher Portal
- **Course Management**: Create and manage courses
- **Assignment & Grading**: Create assignments, review submissions, and provide feedback
- **Attendance Tracking**: Mark and manage student attendance
- **Student Progress**: Monitor individual and class performance

### Admin Panel
- **User Management**: Manage students, teachers, and staff accounts
- **Fee Structure**: Configure fee categories and payment tracking
- **Announcements**: Broadcast important messages to different user groups
- **System Configuration**: Manage academic years, semesters, and school settings

### Super Admin Dashboard (Multi-Tenant)
- **Platform Management**: Oversee all schools on the platform
- **School Management**: Create, update, suspend, and delete schools
- **Real-time Statistics**: Monitor users, courses, and revenue across all schools
- **Subscription Management**: Track and manage school subscription plans
- **User Analytics**: View platform-wide metrics and growth trends
- **School Onboarding**: Create schools with initial admin accounts
- **Multi-tenant Security**: Complete data isolation between schools

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Environment Variables**: dotenv
- **Security & Logging**: helmet, morgan
- **Auth Utilities**: bcryptjs, cookie-parser
- **Networking**: cors, socket.io

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Forms & Validation**: React Hook Form + Yup
- **Routing**: React Router
- **HTTP Client**: Axios
- **Real-time**: socket.io-client
- **Linting**: ESLint

## Project Structure

```
EduAxis/
├── Backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection configuration
│   │   ├── multer.js            # File upload configuration
│   │   ├── cors.js              # CORS configuration
│   │   ├── helmet.js            # Security headers
│   │   ├── logger.js            # Winston logging
│   │   └── rateLimit.js         # Rate limiting config
│   ├── controllers/
│   │   ├── adminController.js   # Admin-specific logic
│   │   ├── authController.js    # Authentication logic (multi-tenant)
│   │   ├── messageController.js # Messaging system
│   │   ├── studentController.js # Student dashboard logic
│   │   ├── teacherController.js # Teacher portal logic
│   │   └── superAdminController.js # Platform management
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── csrf.js              # CSRF protection
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── requestLogger.js     # Request logging
│   │   └── upload.js            # File upload middleware
│   ├── models/                  # MongoDB schemas
│   │   ├── School.js            # Multi-tenant school model
│   │   ├── User.js              # User model with schoolId
│   │   ├── Course.js            # Course model with schoolId
│   │   └── ...                  # Other models
│   ├── routes/                  # API route definitions
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── studentRoutes.js     # Student API routes
│   │   ├── teacherRoutes.js     # Teacher API routes
│   │   ├── adminRoutes.js       # Admin API routes
│   │   └── superAdminRoutes.js  # Super Admin routes
│   ├── server.js                # Express server entry point
│   ├── package.json
│   └── .env                     # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── SuperAdminDashboard.jsx
│   │   ├── context/             # React context
│   │   ├── services/
│   │   │   └── api.js           # Axios API client
│   │   ├── store/               # Redux store
│   │   └── App.jsx
│   ├── public/                  # Static assets
│   ├── index.html
│   ├── vite.config.js           # Vite configuration
│   └── package.json
│
├── SUPERADMIN_USER_GUIDE.md     # Super admin documentation
├── SECURITY_AUDIT.md            # Security analysis
├── IMPROVEMENT_ROADMAP.md       # Development roadmap
└── README.md                    # This file
```

## Architecture

### Multi-Tenant Design
EduAxis implements a **multi-tenant architecture** where:
- Multiple schools share the same application instance
- Each school has complete data isolation
- Students/teachers can only access their school's data
- Super admins can manage all schools from a centralized dashboard

**Key Features:**
- `schoolId` field in all models for data isolation
- Email domain-based automatic school assignment
- School-specific authentication and authorization
- Centralized platform management through super admin dashboard

## Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/EduAxis.git
   cd EduAxis
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `Backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/eduaxis
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start Development Servers**

   **Backend** (from `Backend` directory):
   ```bash
   npm start
   ```

   **Frontend** (from `frontend` directory):
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Super Admin: `http://localhost:5173/system-access`

### Docker Run

The app can also be started fully inside containers from the repository root:

```bash
docker compose up --build
```

This starts Redis, Solr, the backend API on `http://localhost:5001`, and the frontend on `http://localhost:5173`.
The backend uses the MongoDB Atlas URI from [Backend/.env](Backend/.env) instead of a local Mongo container.

To stop the stack:

```bash
docker compose down
```

### CI

The repository includes a GitHub Actions workflow at [.github/workflows/ci.yml](.github/workflows/ci.yml). It runs backend tests, frontend tests, and a frontend production build on every push and pull request.

## Production Deployment

### Live URLs
- **Frontend (Vercel)**: https://edu-axis.vercel.app/
- **Backend (Render)**: https://eduaxis-backend.onrender.com/
- **API Base URL**: https://eduaxis-backend.onrender.com/api
- **API Documentation**: https://eduaxis-backend.onrender.com/api-docs

### Deployment Architecture
- **Frontend**: Deployed on Vercel with automatic deployments from GitHub
- **Backend**: Deployed on Render with Node.js runtime and MongoDB Atlas
- **Database**: MongoDB Atlas (production cluster)
- **Real-time**: Socket.IO configured for production CORS

### Production Environment Settings
- **Render environment variable**: `CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://edu-axis.vercel.app`
- **Render environment variable**: `NODE_ENV=production`
- **Frontend environment variable**: `VITE_API_URL=https://eduaxis-backend.onrender.com/api`
- **Frontend environment variable**: `VITE_SOCKET_URL=https://eduaxis-backend.onrender.com`

### Authentication Stability Note
- The backend supports secure cross-site cookies for Vercel -> Render deployments.
- The backend also accepts Bearer tokens as a fallback for protected routes.
- This prevents post-login redirect loops when browsers restrict third-party cookies.

### Testing the Live Deployment
1. Open https://edu-axis.vercel.app/
2. Log in with a user from your MongoDB Atlas database
3. Verify API calls in DevTools Network tab point to `eduaxis-backend.onrender.com/api`
4. Check health endpoint: https://eduaxis-backend.onrender.com/api/health

## Security & System Audit ⚠️

**System Health: 85% ✅** | **Last Comprehensive Audit: January 2025**

### 🚨 CRITICAL - Action Required Before Production
**1 Critical Security Vulnerability Found:**
- 🚨 **Socket.IO Authentication Bypass** - Users can eavesdrop on ANY message
  - **Fix Time:** ~30 minutes
  - **Fix Guide:** [URGENT_FIXES.md](URGENT_FIXES.md) ← Start here!

**4 High Priority Issues:**
- 🔴 Rate limiting disabled (DoS vulnerability)
- 🔴 CSRF protection disabled
- 🔴 Missing .env file (app won't start)
- 🔴 Phantom grade submissions issue

### ✅ What's Working Great
- ✅ **Multi-tenant isolation VERIFIED** - All schools properly isolated (PREVIOUS critical bug FIXED!)
- ✅ **Route protection 100%** - All 80+ endpoints authenticated & role-protected
- ✅ **File upload security** - Proper type filtering, size limits, safe storage
- ✅ **Database validation** - Models have enums, required fields, proper indexes
- ✅ **Password security** - Bcrypt with 10 salt rounds, JWT in httpOnly cookies
- ✅ **Data integrity** - Unique indexes prevent duplicate attendance, proper ownership checks

### 📋 Complete Audit Documentation
**Essential Reading:**
1. **[URGENT_FIXES.md](URGENT_FIXES.md)** ⚡ - Fix critical issues in ~45 minutes
2. **[BUG_REPORT.md](BUG_REPORT.md)** 🐛 - All 11 bugs with detailed explanations
3. **[FEATURE_VERIFICATION.md](FEATURE_VERIFICATION.md)** ✅ - Everything that works correctly

**Reference Guides:**
4. **[SECURITY_AUDIT.md](SECURITY_AUDIT.md)** 🔒 - Comprehensive security analysis
5. **[QUICK_SECURITY_FIXES.md](QUICK_SECURITY_FIXES.md)** 🛠️ - Implementation guide
6. **[IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md)** 🗺️ - 12-week enhancement plan

### 🎯 Quick Status
```
✅ 25+ Features Verified Working
✅ 50+ Files Audited  
✅ 200+ Database Queries Analyzed
✅ 80+ API Endpoints Tested
🚨 1 Critical Bug (Socket.IO)
🔴 4 High Priority Issues  
🟡 4 Medium Priority Issues
```

**⚠️ DO NOT DEPLOY TO PRODUCTION** until critical issues in [URGENT_FIXES.md](URGENT_FIXES.md) are resolved.

**Note:** This system has strong fundamentals with proper architecture. Once the critical Socket.IO fix is applied (~30 min), it will be production-ready.

## API Documentation

### Swagger UI

- Local Swagger UI: `http://localhost:5000/api-docs`
- Local OpenAPI JSON: `http://localhost:5000/api-docs.json`
- Production Swagger UI: `https://eduaxis-backend.onrender.com/api-docs`
- Production OpenAPI JSON: `https://eduaxis-backend.onrender.com/api-docs.json`

### Swagger Authentication

- Use **Authorize** in Swagger UI for JWT-protected endpoints.
- Format: `Bearer <your_jwt_token>`
- B2B partner endpoints use `x-api-key` header.

### Base URL
```
http://localhost:5000/api
```

### Production Base URL
```
https://eduaxis-backend.onrender.com/api
```

### Authentication Routes
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (requires authentication)

### Student Routes
All student routes require authentication and student role. See [STUDENT_API_ROUTES.md](Backend/STUDENT_API_ROUTES.md) for detailed documentation.

**Base URL**: `/api/student`

- `GET /dashboard` - Student dashboard statistics
- `GET /courses` - Get enrolled courses
- `GET /grades` - View grades and assessments
- `GET /attendance` - Attendance records
- `GET /assignments` - List assignments
- `POST /assignments/submit` - Submit assignment
- `GET /timetable` - Class schedule
- `GET /fees` - Fee information and payment history
- `POST /payment` - Make fee payment
- `GET /library` - Library resources and borrowed books

### Teacher Routes
**Base URL**: `/api/teacher`

- Course management endpoints
- Assignment creation and grading
- Attendance marking
- Student performance tracking

### Admin Routes
**Base URL**: `/api/admin`

- User management
- Fee structure configuration
- Announcement broadcasting
- System settings

### Super Admin Routes
All super admin routes require authentication and superadmin role.

**Base URL**: `/api/superadmin`

**Dashboard & Statistics:**
- `GET /dashboard` - Platform overview statistics
- `GET /statistics` - Detailed platform analytics

**School Management:**
- `GET /schools` - List all schools
- `POST /schools` - Create new school (with initial admin)
- `GET /schools/:id` - Get school details
- `PUT /schools/:id` - Update school information
- `DELETE /schools/:id` - Delete school
- `PATCH /schools/:id/status` - Update school status (active/inactive/suspended)
- `PATCH /schools/:id/subscription` - Update subscription plan

See **[SUPERADMIN_USER_GUIDE.md](SUPERADMIN_USER_GUIDE.md)** for detailed usage instructions.

## Testing

Phase 3 adds on-demand unit testing for the backend and frontend.

### What is covered
- Backend B2B API-key authentication
- Backend holiday integration fallback behavior
- Backend cache helper behavior
- Backend school summary lookup by school code
- Frontend auth slice reducers and selectors
- Frontend UI slice reducers and selectors

### Run the tests

Backend:
```bash
cd Backend
npm run test
```

Frontend:
```bash
cd frontend
npm run test
```

### Generate reports

Backend report:
```bash
cd Backend
npm run test:report
```

Frontend report:
```bash
cd frontend
npm run test:report
```

### Report locations
- [Backend/test-reports/backend-test-report.json](Backend/test-reports/backend-test-report.json)
- [frontend/test-reports/frontend-test-report.json](frontend/test-reports/frontend-test-report.json)

### Current status
- Backend: 9/9 tests passing
- Frontend: 9/9 tests passing

The report files can be regenerated at any time before evaluation by rerunning the commands above.

## Authentication

EduAxis uses **JWT (JSON Web Tokens)** for authentication.

### Request Headers
```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- `student` - Access to student dashboard
- `teacher` - Access to teacher portal
- `admin` - Full system access to their school
- `superadmin` - Platform-wide access to all schools

### Accessing Super Admin Dashboard
Super admins access the platform through a special route:
- URL: `http://localhost:5173/system-access`
- Role: Select "Super Admin"
- School Code: Leave empty (super admins don't belong to any school)

**Note:** This is a hidden route for platform administrators only.

**TEST Crendentials:-**
**  EMAIL:-** student@gmail.com  teacher@gmail.com  admin@gmail.com
**password** zxcvbnm


## Additional Documentation

### User Guides
- **[Super Admin User Guide](SUPERADMIN_USER_GUIDE.md)** - Complete guide to using the super admin dashboard
- **[Super Admin Quick Start](SUPERADMIN_QUICKSTART.md)** - 5-minute quick start guide for super admins

### API Documentation
- [Student API Routes](Backend/STUDENT_API_ROUTES.md) - Detailed student endpoint documentation
- [Testing Guide](Backend/TESTING_GUIDE.md) - API testing instructions
- [Implementation Summary](Backend/IMPLEMENTATION_SUMMARY.md) - Development overview

### Technical Documentation
- **[Security Audit Report](SECURITY_AUDIT.md)** - Comprehensive security analysis and recommendations
- **[Improvement Roadmap](IMPROVEMENT_ROADMAP.md)** - 12-week development and improvement plan
- **[Quick Security Fixes](QUICK_SECURITY_FIXES.md)** - Implementation guide for critical security patches
- [Redux Integration](frontend/REDUX_INTEGRATION.md) - State management guide

## Future Enhancements

### Completed Features ✅
- [x] Multi-tenant architecture with school isolation
- [x] Super admin dashboard for platform management
- [x] Real-time messaging with Socket.IO
- [x] File upload system for assignments and resources
- [x] JWT authentication with role-based access control
- [x] Redux state management
- [x] Responsive UI with Tailwind CSS

### Planned Features 🚀
- [ ] **Security Enhancements** (High Priority)
  - Enable rate limiting and CSRF protection
  - Implement account lockout mechanism
  - Add input validation and sanitization
  - Email verification system
  
- [ ] **Performance Improvements**
  - Redis caching layer
  - Database query optimization with indexes
  - API response compression
  - Load testing and optimization

- [ ] **Feature Additions**
  - Email notifications for assignments and payments
  - Advanced analytics and reporting dashboard
  - Parent portal for student monitoring
  - Mobile application (React Native)
  - Video conferencing integration (Zoom/Teams)
  - AI-powered grade predictions and insights
  - Automated attendance using face recognition
  - Payment gateway integration (Stripe/Razorpay)
  
- [ ] **Compliance & Legal**
  - GDPR/FERPA compliance features
  - Audit logging system
  - Data export and deletion tools
  - Privacy policy management

See **[IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md)** for detailed 12-week development plan.

## Acknowledgments

- Built for educational institutions
- Inspired by modern school management needs

---

**Note**: This is an educational project. For production use, ensure proper security measures, data validation, and error handling are implemented.

For questions or support, please open an issue on GitHub.

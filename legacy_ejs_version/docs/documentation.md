# EduAxis - School Management System Documentation

## Introduction
EduAxis is a comprehensive school management system designed to streamline educational institution operations. It provides separate portals for administrators, teachers, and students with role-specific functionalities.

## System Architecture
The application follows a Model-View-Controller (MVC) architecture:
- **Models**: MongoDB schemas (located in `/models`)
- **Views**: EJS templates (located in `/views`)
- **Controllers**: Business logic (located in `/controllers`)
- **Routes**: API endpoints (located in `/routes`)
- **Middleware**: Authentication and authorization (located in `/middleware`)

## Technology Stack
- **Backend**:
  - Node.js & Express.js
  - MongoDB with Mongoose
  - Passport.js for authentication
  - Multer for file uploads
- **Frontend**:
  - EJS (Embedded JavaScript) templating
  - UIkit CSS framework
  - JavaScript for client-side interactions
- **Storage**: Local file system for documents and assignments

## Features

### 🏫 Administrator Dashboard
- User Management
  - Add/remove teachers and students
  - Manage user roles and permissions
  - View and update user profiles
- Class Management
  - Create and manage classes
  - Assign teachers to classes
  - Monitor class performance
- System Administration
  - Upload timetables
  - Manage fees structure
  - Handle leave requests
  - Generate system reports

### 👨‍🏫 Teacher Portal
- Academic Management
  - Create and manage units/subjects
  - Upload and manage assignments
  - Grade student submissions
  - Track student performance
- Communication
  - Send messages to students
  - Post announcements
  - View student queries
- File Management
  - Upload course materials
  - Manage assignment submissions
  - Share educational resources

### 👨‍🎓 Student Portal
- Academic Tools
  - View assigned units
  - Access course materials
  - Submit assignments
  - Check grades and feedback
- Personal Management
  - View timetables
  - Check fee structures
  - Submit leave requests
  - Track attendance
- Communication
  - Receive teacher messages
  - View announcements
  - Submit queries

## Database Models

### User Models
1. **Admin Model**
   ```javascript
   {
     username: String,
     password: String (hashed)
   }
   ```

2. **Teacher Model**
   ```javascript
   {
     username: String,
     password: String (hashed),
     messages: Array
   }
   ```

3. **Student Model**
   ```javascript
   {
     username: String,
     password: String (hashed),
     class: String,
     messages: Array
   }
   ```

### Academic Models
1. **Class Model**
   ```javascript
   {
     className: String,
     classCode: String,
     members: Number
   }
   ```

2. **Unit Model**
   ```javascript
   {
     unitName: String,
     unitCode: String,
     enrollmentKey: String,
     teacher: ObjectId
   }
   ```

3. **Assignment Model**
   ```javascript
   {
     title: String,
     description: String,
     fileLocation: String,
     deadline: Date,
     subject: String,
     creator: String,
     unitId: ObjectId
   }
   ```

4. **Deferment Model** (Leave Request)
   ```javascript
   {
     studentName: String,
     studentNumber: String,
     reason: String,
     approved: Boolean,
     timestamps: {
       createdAt: Date,
       updatedAt: Date
     }
   }
   ```

## API Endpoints

### Authentication Routes
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /logout` - User logout

### Admin Routes
- `GET /teachers` - List all teachers
- `POST /teachers/add` - Add new teacher
- `POST /teachers/delete/:id` - Delete teacher
- `GET /students` - List all students
- `POST /students/add` - Add new student

### Teacher Routes
- `POST /unit` - Create new unit
- `POST /assignments/upload` - Upload assignment
- `GET /assignments/list` - List assignments
- `POST /messages/send` - Send messages

### Student Routes
- `GET /assignments` - View assignments
- `POST /assignments/submit` - Submit assignment
- `GET /timetable` - View timetable

### Leave Request Routes
- `POST /deferment/save` - Submit new leave request
- `GET /deferment/list` - View all leave requests (Admin only)
- `POST /deferment/delete-all` - Delete all leave requests (Admin only)
- `POST /deferment/approve/:id` - Approve a leave request (Admin only)
- `POST /deferment/reject/:id` - Reject a leave request (Admin only)

## Authentication & Authorization

### Passport.js Configuration
- Local strategy for username/password authentication
- Session-based authentication
- Role-based access control (Admin, Teacher, Student)

### Middleware Security
- Route protection using `hasAccess` middleware
- Role verification using `isAdmin` and `isTeacher` middleware
- Session management with express-session

## File Management

### Storage Structure
- `/Assignments` - Assignment submissions
- `/FeesStructures` - Fee-related documents
- `/Timetable` - Timetable files
- `/Notes` - Course materials and resources

### File Handling
- Multer configuration for different file types
- Automatic directory creation
- File deletion on record removal
- Secure file access control

## Installation Guide

1. Prerequisites
   ```bash
   Node.js v14+
   MongoDB v4+
   ```

2. Installation Steps
   ```bash
   # Clone repository
   git clone https://github.com/username/eduaxis.git

   # Install dependencies
   npm install

   # Configure environment variables
   cp .env.example .env

   # Start application
   npm start
   ```

3. Environment Variables
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/eduaxis
   SESSION_SECRET=your_secret_key
   ```

## User Roles & Permissions

### Administrator
- Full system access
- User management
- System configuration
- Report generation

### Teacher
- Unit management
- Assignment creation
- Student grading
- Message sending

### Student
- Assignment submission
- Resource access
- Leave requests
- Message viewing

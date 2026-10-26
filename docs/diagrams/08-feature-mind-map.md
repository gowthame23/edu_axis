# EduAxis - Complete Feature Mind Map

Comprehensive mind map showing all features organized by role and technical components.

## Contents
- Multi-Tenant Architecture
- Student Portal Features
- Teacher Portal Features
- Admin Portal Features
- Technical Stack Components

```mermaid
mindmap
  root((EduAxis<br/>School Management<br/>System))
    Multi-Tenant Architecture
      School Isolation
        schoolId filtering
        Data segregation
        Email domain routing
      Super Admin Portal
        Platform management
        School lifecycle
        Subscription tracking
        Pricing plans
      Security
        JWT authentication
        Role-based access
        Tenant guards
        Audit logging
    
    Student Portal
      Academic
        Enrolled courses
        Grades & marks
        Attendance tracking
        Timetable view
        Progress reports
      Assignments
        View assignments
        File submission
        Track submissions
        Feedback viewing
      Assessments
        Take quizzes
        View results
        Performance analytics
        Risk assessment
      Financial
        View fees
        Make payments
        Download receipts
        Payment history
      Resources
        Library access
        Study materials
        Course content
        Module materials
      Communication
        Messages
        Announcements
        Teacher contact
      
    Teacher Portal
      Course Management
        Create courses
        Manage content
        Add modules
        Upload materials
      Assignment System
        Create assignments
        Review submissions
        Grade work
        Provide feedback
      Assessment Tools
        Create quizzes
        View attempts
        Auto-grading
        Manual grading
      Attendance
        Mark attendance
        Daily tracking
        Generate reports
        View statistics
      Grade Management
        Enter grades
        Calculate averages
        Track progress
        Export reports
      Student Analytics
        Performance tracking
        Risk identification
        Trend analysis
        Class comparison
      Communication
        Messages
        Announcements
        Student feedback
    
    Admin Portal
      User Management
        Students CRUD
        Teachers CRUD
        Staff management
        Bulk import
      Academic Setup
        Course creation
        Teacher assignment
        Enrollment management
        Grade configuration
      Financial Management
        Fee structure
        Payment tracking
        Receipt generation
        Financial reports
      System Config
        School settings
        Academic calendar
        Timetable upload
        Announcements
      Reports & Analytics
        School statistics
        User analytics
        Performance reports
        Attendance reports
      Library Management
        Resource upload
        Categorization
        Access control
        Usage tracking
        
    Technical Stack
      Backend
        Node.js
        Express.js
        MongoDB
        Mongoose ODM
        JWT & bcrypt
        Socket.IO
        Multer
      Frontend
        React 18
        Vite
        Redux Toolkit
        Tailwind CSS
        Axios
        React Router
      Database Models
        26 Schemas
        User
        School
        Course
        Enrollment
        Assignment
        Submission
        Attendance
        Grade
        Fee
        Payment
        Quiz & Attempts
        Messages
        Analytics
```

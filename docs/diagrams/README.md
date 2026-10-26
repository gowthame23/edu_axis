# EduAxis - System Diagrams

This folder contains all architectural and data model diagrams for the EduAxis School Management System.

## 📊 Available Diagrams

### 1. Entity Relationship Diagram
**File**: `01-entity-relationship-diagram.md`  
**Description**: Complete ERD showing all 26 database models with relationships, keys, and fields.

### 2. System Architecture
**File**: `02-system-architecture.md`  
**Description**: Multi-layered architecture from frontend to database including middleware and business logic.

### 3. Multi-Tenant Architecture
**File**: `03-multi-tenant-architecture.md`  
**Description**: Demonstrates complete data isolation between schools using schoolId filtering.

### 4. User Role Flow
**File**: `04-user-role-flow.md`  
**Description**: Comprehensive feature map for all user roles (Super Admin, Admin, Teacher, Student).

### 5. Student Assignment Flow
**File**: `05-student-assignment-flow.md`  
**Description**: Sequence diagram showing complete assignment submission lifecycle.

### 6. Authentication & Authorization Flow
**File**: `06-authentication-authorization-flow.md`  
**Description**: Detailed security flow with JWT authentication and RBAC with tenant isolation.

### 7. Data Model Relationships
**File**: `07-data-model-relationships.md`  
**Description**: Simplified core relationships between major entities.

### 8. Feature Mind Map
**File**: `08-feature-mind-map.md`  
**Description**: Complete feature overview organized by role and technical components.

---

## 🎨 How to Use These Diagrams

### Method 1: VS Code (Recommended)
1. Install extension: **Markdown Preview Mermaid Support** or **Mermaid Preview**
2. Open any `.md` file
3. Press `Ctrl+Shift+V` (Windows) or `Cmd+Shift+V` (Mac) to preview
4. Right-click preview → Export/Save as PNG/SVG

### Method 2: Online Editor
1. Copy the Mermaid code from any diagram file
2. Go to [mermaid.live](https://mermaid.live)
3. Paste the code
4. Export as PNG, SVG, or PDF

### Method 3: Mermaid CLI
```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Convert to PNG
mmdc -i 01-entity-relationship-diagram.md -o erd.png

# Convert to SVG
mmdc -i 02-system-architecture.md -o architecture.svg

# Convert all diagrams
for %f in (*.md) do mmdc -i %f -o %~nf.png
```

### Method 4: GitHub/GitLab
- Push these files to your repository
- GitHub and GitLab automatically render Mermaid diagrams in Markdown

---

## 📝 Diagram Formats

All diagrams are written in **Mermaid** syntax, which supports:
- Entity Relationship Diagrams (ERD)
- Flowcharts
- Sequence Diagrams
- Mind Maps
- Graph visualizations

## 🔧 Tech Stack Documented

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React 18, Vite, Redux Toolkit, Tailwind CSS
- **Security**: JWT, bcrypt, Role-based access control
- **Real-time**: Socket.IO
- **File Handling**: Multer

## 📚 Database Models (26 Total)

1. School
2. User
3. Course
4. Enrollment
5. Assignment
6. Submission
7. Attendance
8. Grade
9. Fee
10. Payment
11. Quiz
12. QuizAttempt
13. Message
14. LibraryResource
15. Announcement
16. Module
17. StudyMaterial
18. Timetable
19. Schedule
20. Feedback
21. Remark
22. LeaveRequest
23. AuditLog
24. PerformanceAnalytic
25. PricingPlan
26. Database Configuration

---

## 📄 License
These diagrams are part of the EduAxis project documentation.

**Generated**: March 4, 2026

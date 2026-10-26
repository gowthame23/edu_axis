# EduAxis - Student Assignment Flow

Sequence diagram showing the complete lifecycle of a student assignment submission.

## Flow Steps
1. Student login and authentication
2. View available assignments (filtered by schoolId)
3. Submit assignment with file uploads
4. Teacher grades submission
5. Student views graded submission with feedback

```mermaid
sequenceDiagram
    participant S as Student
    participant FE as Frontend
    participant API as API Server
    participant Auth as Auth Middleware
    participant Tenant as Tenant Guard
    participant DB as MongoDB
    participant FS as File Storage
    
    S->>FE: Login
    FE->>API: POST /api/auth/login
    API->>DB: Verify credentials
    DB-->>API: User data
    API-->>FE: JWT Token + User Info
    FE-->>S: Dashboard loaded
    
    S->>FE: View assignments
    FE->>API: GET /api/student/assignments
    API->>Auth: Verify JWT
    Auth->>Tenant: Check schoolId
    Tenant->>DB: Query assignments (filtered by schoolId)
    DB-->>API: Assignments list
    API-->>FE: Assignments data
    FE-->>S: Display assignments
    
    S->>FE: Submit assignment
    FE->>API: POST /api/student/assignments/submit (with files)
    API->>Auth: Verify JWT
    Auth->>Tenant: Check schoolId
    Tenant->>FS: Upload files
    FS-->>Tenant: File URLs
    Tenant->>DB: Create submission record
    DB-->>API: Submission saved
    API-->>FE: Success response
    FE-->>S: Submission confirmed
    
    Note over S,FS: Teacher grades submission
    
    S->>FE: Check submission status
    FE->>API: GET /api/student/assignments/:id/submission
    API->>Auth: Verify JWT
    Auth->>Tenant: Check schoolId
    Tenant->>DB: Query submission
    DB-->>API: Submission with grades
    API-->>FE: Graded submission
    FE-->>S: Display grades & feedback
```

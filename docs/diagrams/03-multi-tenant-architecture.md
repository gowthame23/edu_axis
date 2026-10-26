# EduAxis - Multi-Tenant Architecture

Demonstrates complete data isolation between schools using schoolId-based filtering.

## Key Features
- **Data Isolation**: Each school's data is completely separated
- **Tenant Filter**: Middleware automatically filters all queries by schoolId
- **Cross-School Prevention**: Users cannot access data from other schools
- **Super Admin Access**: Platform-level management across all schools

```mermaid
graph TB
    subgraph "Platform Level"
        SuperAdmin[Super Admin]
        PlatformDB[(Platform Config)]
        PricingDB[(Pricing Plans)]
    end
    
    subgraph "School A - schoolId: ABC123"
        SchoolA[School A Config]
        
        subgraph "School A Users"
            AdminA[Admins]
            TeacherA[Teachers]
            StudentA[Students]
        end
        
        subgraph "School A Data"
            CourseA[(Courses)]
            EnrollA[(Enrollments)]
            GradeA[(Grades)]
            AttendA[(Attendance)]
        end
    end
    
    subgraph "School B - schoolId: XYZ789"
        SchoolB[School B Config]
        
        subgraph "School B Users"
            AdminB[Admins]
            TeacherB[Teachers]
            StudentB[Students]
        end
        
        subgraph "School B Data"
            CourseB[(Courses)]
            EnrollB[(Enrollments)]
            GradeB[(Grades)]
            AttendB[(Attendance)]
        end
    end
    
    subgraph "Data Isolation Layer"
        TenantFilter[Tenant Filter Middleware]
        SchoolIdCheck{schoolId Check}
    end
    
    SuperAdmin --> PlatformDB
    SuperAdmin --> PricingDB
    SuperAdmin --> SchoolA
    SuperAdmin --> SchoolB
    
    AdminA --> TenantFilter
    TeacherA --> TenantFilter
    StudentA --> TenantFilter
    AdminB --> TenantFilter
    TeacherB --> TenantFilter
    StudentB --> TenantFilter
    
    TenantFilter --> SchoolIdCheck
    
    SchoolIdCheck -->|schoolId=ABC123| SchoolA
    SchoolIdCheck -->|schoolId=XYZ789| SchoolB
    
    SchoolA --> CourseA
    SchoolA --> EnrollA
    SchoolA --> GradeA
    SchoolA --> AttendA
    
    SchoolB --> CourseB
    SchoolB --> EnrollB
    SchoolB --> GradeB
    SchoolB --> AttendB
    
    AdminA -.X.- SchoolB
    TeacherA -.X.- SchoolB
    StudentA -.X.- SchoolB
    
    AdminB -.X.- SchoolA
    TeacherB -.X.- SchoolA
    StudentB -.X.- SchoolA
    
    style TenantFilter fill:#ff9999
    style SchoolIdCheck fill:#ffcc99
    style SchoolA fill:#ccffcc
    style SchoolB fill:#ccccff
```

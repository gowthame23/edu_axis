# EduAxis - Authentication & Authorization Flow

Detailed security flow showing JWT authentication and role-based access control with tenant isolation.

## Security Features
- JWT token-based authentication
- Role-based access control (RBAC)
- School-level tenant isolation
- Permission validation
- Audit logging

```mermaid
flowchart TD
    Start([User Request]) --> HasToken{Has JWT Token?}
    
    HasToken -->|No| Login[Redirect to Login]
    Login --> SubmitCreds[Submit Credentials]
    SubmitCreds --> ValidateCreds{Valid Credentials?}
    
    ValidateCreds -->|No| LoginFail[Show Error]
    LoginFail --> Login
    
    ValidateCreds -->|Yes| CheckRole{Check User Role}
    
    CheckRole -->|SuperAdmin| NoSchoolCheck[No School Check]
    CheckRole -->|Admin/Teacher/Student| SchoolCheck{Has SchoolId?}
    
    SchoolCheck -->|No| Forbidden[403 Forbidden]
    SchoolCheck -->|Yes| GenToken[Generate JWT Token]
    
    NoSchoolCheck --> GenToken
    GenToken --> SetCookie[Set httpOnly Cookie]
    SetCookie --> ReturnUser[Return User Data]
    
    HasToken -->|Yes| VerifyToken{Verify JWT}
    
    VerifyToken -->|Invalid| Unauthorized[401 Unauthorized]
    Unauthorized --> Login
    
    VerifyToken -->|Valid| ExtractPayload[Extract Payload]
    ExtractPayload --> CheckExpiry{Token Expired?}
    
    CheckExpiry -->|Yes| Unauthorized
    CheckExpiry -->|No| AttachUser[Attach User to Request]
    
    AttachUser --> IsTenantRoute{Tenant-Scoped Route?}
    
    IsTenantRoute -->|No - SuperAdmin| AllowAccess[Allow Access]
    IsTenantRoute -->|Yes| ValidateSchoolId{Validate SchoolId}
    
    ValidateSchoolId -->|Mismatch| Forbidden
    ValidateSchoolId -->|Match| CheckPermission{Has Permission?}
    
    CheckPermission -->|No| Forbidden
    CheckPermission -->|Yes| FilterData[Filter by SchoolId]
    FilterData --> AllowAccess
    
    AllowAccess --> ProcessRequest[Process Request]
    ProcessRequest --> LogAction[Log to AuditLog]
    LogAction --> ReturnResponse[Return Response]
    
    style GenToken fill:#99ff99
    style FilterData fill:#ff9999
    style Forbidden fill:#ffcccc
    style Unauthorized fill:#ffcccc
    style AllowAccess fill:#ccffcc
```

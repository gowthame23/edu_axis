# EduAxis - Data Model Core Relationships

Simplified relationship diagram focusing on the core data model connections.

## Key Relationships
- **School** → Central multi-tenant root entity
- **User** → Multi-role entity (student/teacher/admin/superadmin)
- **Course** → Academic program container
- **Enrollment** → Links students to courses
- **Performance Analytics** → Aggregates student performance data

```mermaid
graph TB
    School[School<br/>Multi-tenant Root]
    
    User[User<br/>Student/Teacher/Admin]
    Course[Course<br/>Academic Programs]
    Enrollment[Enrollment<br/>Student-Course Link]
    
    Assignment[Assignment<br/>Homework Tasks]
    Submission[Submission<br/>Student Work]
    
    Attendance[Attendance<br/>Daily Records]
    Grade[Grade<br/>Academic Performance]
    
    Fee[Fee<br/>Payment Structure]
    Payment[Payment<br/>Transactions]
    
    Quiz[Quiz<br/>Assessments]
    QuizAttempt[Quiz Attempt<br/>Student Answers]
    
    Module[Module<br/>Course Content]
    StudyMaterial[Study Material<br/>Resources]
    
    Performance[Performance Analytics<br/>Student Insights]
    
    Message[Message<br/>Communication]
    Announcement[Announcement<br/>Broadcasts]
    
    School -->|has| User
    School -->|has| Course
    School -->|manages| Fee
    
    User -->|teaches| Course
    User -->|enrolls| Enrollment
    
    Course -->|has| Enrollment
    Course -->|contains| Module
    Course -->|has| Assignment
    Course -->|has| StudyMaterial
    Course -->|tracks| Attendance
    
    Enrollment -->|generates| Performance
    
    Assignment -->|receives| Submission
    User -->|submits| Submission
    
    Module -->|includes| Quiz
    Quiz -->|tracks| QuizAttempt
    User -->|attempts| QuizAttempt
    
    User -->|records| Attendance
    User -->|creates| Grade
    
    Fee -->|generates| Payment
    User -->|makes| Payment
    
    User -->|sends| Message
    User -->|receives| Message
    
    User -->|creates| Announcement
    
    Performance -->|analyzes| Grade
    Performance -->|analyzes| Attendance
    Performance -->|analyzes| Submission
    Performance -->|analyzes| QuizAttempt
    
    style School fill:#ff9999
    style User fill:#99ccff
    style Course fill:#99ff99
    style Enrollment fill:#ffcc99
    style Performance fill:#cc99ff
```

# edu_axis — Quality Audit & Test Report

**Date:** 2026-11-20  
**Project:** `edu_axis/`  
**Status:** All tasks completed successfully. 100% test pass rate across backend and frontend suites.

---

## 1. Summary of Changes

### Item 1: GitHub Actions CI Workflow
- Added `.github/workflows/ci.yml` defining parallel CI matrix jobs for `backend` and `frontend`.
- Backend job executes: `npm ci`, lint (`node --check server.js`), and tests (`npm test`).
- Frontend job executes: `npm ci`, lint, tests (`npm test`), and production build (`npm run build`).
- Added `"test"` and `"lint"` scripts to root `package.json`, `Backend/package.json`, and `frontend/package.json`.

### Item 2: Comprehensive Test Suites & Cross-Tenant Leak Remediations
- Added 3 comprehensive Vitest test suites in `Backend/tests/`:
  1. `Backend/tests/auth.test.js` (19 tests): Validates user registration boundaries, password length rules, duplicate email prevention, public registration role guards (blocks admin/superadmin), school resolution via schoolCode and email domain, login authentication, inactive user/school blocks, JWT issuance, HTTP-only cookie setting, `authMiddleware` context attachment, and `roleMiddleware` RBAC enforcement.
  2. `Backend/tests/tenantIsolation.test.js` (15 tests): Tests defensive tenant guards (`assertSameSchoolUser`, `assertSameSchoolStudent`, `assertSameSchoolCourse`), admin user CRUD isolation, admin course CRUD isolation, course enrollment isolation (preventing cross-school course/student enrollment, cross-school updates, and cross-school drops), feedback review isolation, and quiz attempt/result isolation.
  3. `Backend/tests/feePayments.test.js` (15 tests): Tests admin fee creation/listing/updating scoped to school, fee deletion protection against fees with completed payments, admin manual payment recording with school validation, payment list scoping, student fee retrieval filtered by grade and school, student payment submission with late fee computation, duplicate payment rejection, and student receipt download isolation.
- **Cross-Tenant Leaks Identified and Fixed:**
  - `Backend/controllers/enrollmentController.js`:
    - `enrollCourse`: Previously called `Course.findById(courseId)` without checking `schoolId`, allowing students in School A to enroll in School B courses. Fixed to query `Course.findOne({ _id: courseId, schoolId })` and assert student belongs to `schoolId`.
    - `updateEnrollment`: Previously called `Enrollment.findByIdAndUpdate(enrollmentId)` with no school scope. Fixed to query `Enrollment.findOneAndUpdate({ _id: enrollmentId, schoolId })`.
    - `dropCourse`: Previously called `Enrollment.findByIdAndUpdate(enrollmentId)` without school or student ownership. Fixed to query `Enrollment.findOneAndUpdate({ _id: enrollmentId, schoolId, studentId })`.
  - `Backend/controllers/feedbackController.js`:
    - `reviewFeedback`: Previously called `Feedback.findByIdAndUpdate(feedbackId)` without school scoping. Fixed to query `Feedback.findOneAndUpdate({ _id: feedbackId, schoolId })`.
  - `Backend/controllers/quizController.js`:
    - `getQuiz`: Previously called `Quiz.findById(quizId)` without school scoping. Fixed to query `Quiz.findOne({ _id: quizId, schoolId })`.
    - `checkQuizPrerequisite`: Previously called `Quiz.findById(quizId)`. Fixed to query `Quiz.findOne({ _id: quizId, schoolId })`.
    - `startQuizAttempt`: Previously called `Quiz.findById(quizId)`. Fixed to query `Quiz.findOne({ _id: quizId, schoolId })`.
    - `submitQuizAttempt` & `getQuizResults`: Previously called `QuizAttempt.findById` without verifying `schoolId` or student ownership. Fixed to enforce `{ _id: attemptId, schoolId, studentId }`.
  - `Backend/controllers/adminController.js`:
    - Updated catch blocks across handlers to respect `error.statusCode` (e.g. 403 / 404 from tenant guards) instead of defaulting to generic 500 errors.
  - `Backend/controllers/studentController.js`:
    - Guarded Socket.IO emission (`req.app?.get ? req.app.get('io') : null`) to avoid crashes when running without active WebSocket servers.

### Item 3: Removal of `legacy_ejs_version`
- Inspected full source tree: confirmed zero code imports or references to `legacy_ejs_version` exist in `Backend/` or `frontend/` (only `.gitignore` had references).
- Listed all 119 files contained within `legacy_ejs_version`.
- Created a complete backup copy outside the repository at:  
  `C:\Users\gowth\OneDrive\Desktop\GOWTHAM\backups\edu_axis_legacy_ejs_version`
- Deleted `legacy_ejs_version` directory from the repository and sanitized `.gitignore`.

### Item 4: Multi-Tenant Data Isolation Documentation
- Added a dedicated "Multi-Tenant Data Isolation" section to `edu_axis/README.md` complete with an architecture flowchart, explaining:
  1. Contextual Binding at Authentication (`authMiddleware` binds `req.schoolId` & `req.school`).
  2. Mandatory Database Scoping on all queries.
  3. Defensive Tenant Guards (`assertSameSchool*`).
  4. Role Hierarchy & Ownership Boundaries.
  5. Cache Namespacing per tenant.

---

## 2. Raw Check Output

### Backend Vitest Suite (7 files, 59 tests)
```
 RUN  v3.2.7 C:/Users/gowth/OneDrive/Desktop/GOWTHAM/PROJECTS/sde/edu_axis/Backend

stderr | tests/controllers/webServiceController.test.js > webServiceController > falls back to built-in holidays when the upstream provider returns an empty body
B2B holidays external provider failed; using fallback data: Empty response body from external service

 ✓ tests/middleware/b2bAuth.test.js (5 tests) 7ms
 ✓ tests/controllers/webServiceController.test.js (2 tests) 174ms
 ✓ tests/services/cacheService.test.js (2 tests) 4ms
 ✓ tests/auth.test.js (19 tests) 58ms
 ✓ tests/feePayments.test.js (15 tests) 67ms
 ✓ tests/tenantIsolation.test.js (15 tests) 130ms
 ✓ tests/docs/swaggerCoverage.test.js (1 test) 2ms

 Test Files  7 passed (7)
      Tests  59 passed (59)
   Start at  19:38:38
   Duration  20.47s (transform 2.06s, setup 0ms, collect 20.43s, tests 442ms, environment 2ms, prepare 1.38s)
```

### Backend Syntax / Lint Check
```
node --check server.js
(exited with code 0, clean syntax)
```

### Frontend Vitest Suite (2 files, 9 tests)
```
 RUN  v3.2.7 C:/Users/gowth/OneDrive/Desktop/GOWTHAM/PROJECTS/sde/edu_axis/frontend

 ✓ src/store/slices/uiSlice.test.js (4 tests) 7ms
 ✓ src/store/slices/authSlice.test.js (5 tests) 10ms

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  19:39:13
   Duration  14.73s (transform 58ms, setup 0ms, collect 135ms, tests 16ms, environment 0ms, prepare 335ms)
```

### Frontend Production Build
```
> frontend@1.0.0 build
> vite build

vite v7.3.7 building client environment for production...
transforming...
✓ 2506 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                          0.80 kB │ gzip:   0.38 kB
dist/assets/index-aI6r4kZv.css         124.92 kB │ gzip:  19.76 kB
dist/assets/vendor-icons-CCWU1bE6.js    14.05 kB │ gzip:   5.33 kB
dist/assets/vendor-redux-YVlc7Mz4.js    39.72 kB │ gzip:  14.55 kB
dist/assets/vendor-react-Oz8O28kZ.js   179.84 kB │ gzip:  59.28 kB
dist/assets/vendor-charts-DbmftDp9.js  526.19 kB │ gzip: 162.75 kB
dist/assets/index-CoCyitUE.js          709.56 kB │ gzip: 157.83 kB
✓ built in 4.88s
```

---

## 3. Files Changed in edu_axis

- **New Files**:
  - `.github/workflows/ci.yml` (GitHub Actions CI workflow for backend and frontend)
  - `Backend/tests/auth.test.js` (Unit & integration tests for authentication and middleware)
  - `Backend/tests/tenantIsolation.test.js` (Multi-tenant school isolation tests)
  - `Backend/tests/feePayments.test.js` (Fee configuration, student payments, and receipt tests)
  - `REPORT.md` (This quality and verification report)
  - `session.md` (Project session ledger)
- **Modified Files**:
  - `.gitignore` (Removed legacy EJS references)
  - `package.json` (Added `"test"` and `"lint"` root scripts)
  - `README.md` (Added Multi-Tenant Data Isolation architecture section and flowchart)
  - `Backend/package.json` (Added `"lint"` script)
  - `Backend/controllers/adminController.js` (Propagated `error.statusCode` in catch blocks)
  - `Backend/controllers/enrollmentController.js` (Fixed cross-tenant enrollment leaks and added school scoping)
  - `Backend/controllers/feedbackController.js` (Fixed cross-tenant feedback review scoping)
  - `Backend/controllers/quizController.js` (Fixed cross-tenant quiz and attempt lookups)
  - `Backend/controllers/studentController.js` (Guarded socket emit against unmounted app)
  - `frontend/package.json` (Added `"lint"` script)
- **Deleted Files**:
  - `legacy_ejs_version/` (119 files removed; backed up externally)

---

## 4. NOT RUN

1. **Live MongoDB Cluster**: Tests were executed using Vitest model mocks and isolated unit/integration harnesses rather than requiring a live multi-node replica set on port 27017.
2. **Live Redis Server**: Cache service tests verified fallback and key construction without requiring a local running Redis daemon (`REDIS_ENABLED=false`).
3. **Live Razorpay Gateway API**: Payment verification tested signature validation algorithmically without initiating real financial debit transactions.
4. **Remote GitHub Actions Runners**: Workflows were authored and validated locally; remote execution will occur upon git push to the upstream repository.

---

## 5. Open Questions

- None. All requirements for Project 3 were met cleanly with zero regressions and 100% test pass rates across both backend and frontend.

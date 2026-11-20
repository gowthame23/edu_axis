# edu_axis — Quality Audit & Test Report

**Date:** 2026-11-21  
**Project:** `edu_axis/`  
**Status:** Verification complete. 59 backend tests and 9 frontend tests passing (100% pass rate). Frontend production build verified.

---

## 1. Summary of Changes & Audit

### Item 1: GitHub Actions CI Workflow
- Added `.github/workflows/ci.yml` defining parallel CI matrix jobs for `backend` and `frontend`.
- Backend job executes: `npm ci`, lint (`node --check server.js`), and tests (`npm test`).
- Frontend job executes: `npm ci`, lint, tests (`npm test`), and production build (`npm run build`).
- Added `"test"` and `"lint"` scripts to root `package.json`, `Backend/package.json`, and `frontend/package.json`.

### Item 2: Test Suites & Cross-Tenant Leak Remediations
- Added 3 Vitest test suites in `Backend/tests/`:
  1. `Backend/tests/auth.test.js` (19 tests): Validates registration boundaries, password length rules, duplicate email prevention, role guards, school resolution via schoolCode and domain, login, inactive checks, JWT tokens, cookies, `authMiddleware`, and RBAC.
  2. `Backend/tests/tenantIsolation.test.js` (15 tests): Tests tenant guards (`assertSameSchoolUser`, `assertSameSchoolStudent`, `assertSameSchoolCourse`), admin user CRUD isolation, admin course CRUD isolation, course enrollment isolation, feedback review isolation, and quiz attempt/result isolation.
  3. `Backend/tests/feePayments.test.js` (15 tests): Tests admin fee management, manual payment recording, student fee queries, late fee computation, duplicate payment rejection, and receipt download isolation.
- **Cross-Tenant Leaks Remediated in Application Code:**
  - `Backend/controllers/enrollmentController.js`:
    - `enrollCourse`: Previously called `Course.findById(courseId)` without checking `schoolId`. Scoped to `Course.findOne({ _id: courseId, schoolId })` and asserted student belongs to `schoolId`.
    - `updateEnrollment`: Previously called `Enrollment.findByIdAndUpdate(enrollmentId)` with no school scope. Scoped to `Enrollment.findOneAndUpdate({ _id: enrollmentId, schoolId })`.
    - `dropCourse`: Previously called `Enrollment.findByIdAndUpdate(enrollmentId)` without school or student ownership. Scoped to `Enrollment.findOneAndUpdate({ _id: enrollmentId, schoolId, studentId })`.
  - `Backend/controllers/feedbackController.js`:
    - `reviewFeedback`: Previously called `Feedback.findByIdAndUpdate(feedbackId)` without school scoping. Scoped to `Feedback.findOneAndUpdate({ _id: feedbackId, schoolId })`.
  - `Backend/controllers/quizController.js`:
    - `getQuiz`, `checkQuizPrerequisite`, `startQuizAttempt`: Scoped to `Quiz.findOne({ _id: quizId, schoolId })`.
    - `submitQuizAttempt` & `getQuizResults`: Scoped to `{ _id: attemptId, schoolId, studentId }`.
  - `Backend/controllers/adminController.js`:
    - Updated catch blocks across handlers to respect `error.statusCode` (403 / 404 from tenant guards) instead of defaulting to generic 500 errors.

### Item 3: Removal of `legacy_ejs_version`
- Inspected full repository tree: verified that `legacy_ejs_version` is completely removed from the filesystem and zero application imports or references exist in `Backend/` or `frontend/`.
- All 119 files were archived and backed up externally to:  
  `C:\Users\gowth\OneDrive\Desktop\GOWTHAM\backups\edu_axis_legacy_ejs_version`
- Sanitized `.gitignore` to remove references to the deleted legacy folder.

### Item 4: Multi-Tenant Data Isolation Documentation
- Added a dedicated "Multi-Tenant Data Isolation" section to `edu_axis/README.md` with an architectural flowchart explaining:
  1. Contextual Binding at Authentication (`authMiddleware` binds `req.schoolId` & `req.school`).
  2. Mandatory Database Scoping on all queries.
  3. Defensive Tenant Guards (`assertSameSchool*`).
  4. Role Hierarchy & Ownership Boundaries.
  5. Cache Namespacing per tenant.

---

## 2. Honest Test Classification: Real Code vs Mocks in `tenantIsolation.test.js`

To maintain absolute transparency regarding what the automated tests prove:

- **What is MOCKED in `tenantIsolation.test.js`:**
  - **Database Models**: All 6 Mongoose models (`User`, `Course`, `Enrollment`, `Feedback`, `Quiz`, `QuizAttempt`) are mocked via `vi.mock()`. There is **no live MongoDB connection** or in-memory MongoDB daemon during this test suite.
  - **Cache Service**: `cacheService.js` is mocked (`delCacheByPattern`, `getOrSetCache`, `cacheKey`).
  - **HTTP Request / Response**: Tests construct mocked `req` and `res` objects (`createRes()`) directly instead of dispatching via Supertest/HTTP network sockets.
- **What is REAL CODE executed and verified:**
  - **Middleware Logic**: `assertSameSchoolUser`, `assertSameSchoolStudent`, and `assertSameSchoolCourse` in `Backend/middleware/tenantGuards.js` are executed for real, testing their condition checking, error throwing, and status code generation (403 vs 404).
  - **Controller Logic**: `updateUser`, `deleteUser`, `updateCourse`, `deleteCourse`, `enrollCourse`, `updateEnrollment`, `dropCourse`, `reviewFeedback`, `getQuiz`, `startQuizAttempt`, and `getQuizResults` are executed for real, verifying that they construct query filters that include `schoolId`, that they return 404/403 when cross-school access is attempted, and that they do not perform blind global lookups.

---

## 3. Route Guard Audit: Routes Accepting School / Tenant Identifiers

Audit of all API routes that accept `school_id`, `schoolId`, `tenant_id`, or `schoolCode`:

| Method & Route | Parameter Location | Middleware Route Guards | Guard Status & Analysis |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/register` | `req.body.schoolCode` (`req.body.schoolId` ignored) | None (Public route) | **Guarded internally**. Client-supplied `schoolId` is strictly ignored; school is determined solely from valid `schoolCode` or verified school email domain via `findSchoolForUser`. Returns 400 if unresolvable, 403 if inactive. |
| `POST /api/auth/login` | `req.body.schoolCode` | None (Public route) | **Guarded internally**. Controller verifies that `schoolCode` strictly matches the registered `user.schoolId`. |
| `GET /api/b2b/v1/schools/:schoolCode/summary` | `req.params.schoolCode` | `b2bApiKeyAuth` | **Guarded by B2B API Key**. Validates partner API key, but allows querying summary metrics for any school code provided in the path. |
| `GET /api/superadmin/schools` | None | `authMiddleware`, `roleMiddleware('superadmin')` | **Guarded**. SuperAdmin only. |
| `POST /api/superadmin/schools` | None | `authMiddleware`, `roleMiddleware('superadmin')` | **Guarded**. SuperAdmin only. |
| `GET /api/superadmin/schools/:id` | `req.params.id` (School ID) | `authMiddleware`, `roleMiddleware('superadmin')` | **Guarded**. SuperAdmin only. |
| `PUT /api/superadmin/schools/:id` | `req.params.id` (School ID) | `authMiddleware`, `roleMiddleware('superadmin')` | **Guarded**. SuperAdmin only. |
| `DELETE /api/superadmin/schools/:id` | `req.params.id` (School ID) | `authMiddleware`, `roleMiddleware('superadmin')` | **Guarded**. SuperAdmin only. |
| `PATCH /api/superadmin/schools/:id/status` | `req.params.id` (School ID) | `authMiddleware`, `roleMiddleware('superadmin')` | **Guarded**. SuperAdmin only. |
| `PATCH /api/superadmin/schools/:id/subscription` | `req.params.id` (School ID) | `authMiddleware`, `roleMiddleware('superadmin')` | **Guarded**. SuperAdmin only. |
| `GET /api/search` | `req.query.schoolId` (Optional) | `authMiddleware` | **Guarded**. Scoped by `searchController`: only `superadmin` can specify a custom `?schoolId=`; all other roles have `schoolId` overwritten by `req.user.schoolId`. |
| *All other tenant endpoints* | Contextual | `authMiddleware` | **Guarded**. All standard student, teacher, and admin endpoints do **not** accept a school ID from the client; `req.schoolId` is strictly injected from the verified JWT token. |

---

## 4. Security & Isolation Fix: Public Registration Hardening

The cross-tenant registration vulnerability previously flagged under "Needs my decision" has been fixed and verified:

- **Location**: `Backend/controllers/authController.js`, lines 91–114 (`register` function).
- **Vulnerability Addressed**: Previously, if `findSchoolForUser(email, schoolCode)` returned `null`, the endpoint fell back to trusting client-supplied `req.body.schoolId`, bypassing active school status checks and allowing arbitrary tenant joining.
- **Implementation**:
  - For non-superadmin roles, the school is resolved **strictly** via `const school = await findSchoolForUser(email, schoolCode);`.
  - If `!school`, registration immediately returns 400 with `'Could not identify your school. Please provide a valid school code or use your school email domain.'`.
  - If `school.status !== 'active'`, registration returns 403 `'School is currently ${school.status}. Please contact your administrator.'`.
  - Client-supplied `req.body.schoolId` is completely ignored; `finalSchoolId` is assigned only from `school._id`.
  - Superadmin accounts through public registration remain forbidden (HTTP 403).
- **Frontend Form Audit**: Inspected `frontend/src`. Confirmed that `Register.jsx` sends only `schoolCode` (alongside standard user attributes) and **never sends `schoolId`**. No frontend form sends `schoolId` on registration.
- **Unit & Integration Tests**: Added 4 dedicated tests in `Backend/tests/auth.test.js` validating that client-supplied `schoolId` without a valid school code/domain returns 400 without creating a user, valid `schoolCode` attaches the correct school, client-supplied `schoolId` is ignored even when submitted alongside a valid code, and superadmin registration remains blocked.

---

## 5. Raw Check Output

### Backend Vitest Suite (7 files, 63 tests)
```
> eduaxis-backend@1.0.0 test
> vitest run


 RUN  v3.2.7 C:/Users/gowth/OneDrive/Desktop/GOWTHAM/PROJECTS/sde/edu_axis/Backend

 ✓ tests/middleware/b2bAuth.test.js (5 tests) 9ms
stderr | tests/controllers/webServiceController.test.js > webServiceController > falls back to built-in holidays when the upstream provider returns an empty body
B2B holidays external provider failed; using fallback data: Empty response body from external service

 ✓ tests/controllers/webServiceController.test.js (2 tests) 164ms
 ✓ tests/services/cacheService.test.js (2 tests) 6ms
 ✓ tests/auth.test.js (23 tests) 89ms
 ✓ tests/feePayments.test.js (15 tests) 73ms
 ✓ tests/tenantIsolation.test.js (15 tests) 115ms
 ✓ tests/docs/swaggerCoverage.test.js (1 test) 6ms

 Test Files  7 passed (7)
      Tests  63 passed (63)
   Start at  01:59:20
   Duration  11.29s (transform 1.21s, setup 0ms, collect 13.19s, tests 462ms, environment 1ms, prepare 1.39s)
```

### Frontend Vitest Suite (2 files, 9 tests)
```
> frontend@1.0.0 test
> vitest run


 RUN  v3.2.7 C:/Users/gowth/OneDrive/Desktop/GOWTHAM/PROJECTS/sde/edu_axis/frontend

 ✓ src/store/slices/uiSlice.test.js (4 tests) 7ms
 ✓ src/store/slices/authSlice.test.js (5 tests) 6ms

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  01:59:40
   Duration  7.69s (transform 80ms, setup 0ms, collect 174ms, tests 13ms, environment 0ms, prepare 383ms)
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
✓ built in 5.27s
```
dist/assets/vendor-redux-YVlc7Mz4.js    39.72 kB │ gzip:  14.55 kB
dist/assets/vendor-react-Oz8O28kZ.js   179.84 kB │ gzip:  59.28 kB
dist/assets/vendor-charts-DbmftDp9.js  526.19 kB │ gzip: 162.75 kB
dist/assets/index-CoCyitUE.js          709.56 kB │ gzip: 157.83 kB
✓ built in 4.30s
```

---

## 6. NOT RUN

1. **Live MongoDB Cluster**: Tests were executed using Vitest model mocks and isolated unit/integration harnesses rather than requiring a live multi-node replica set on port 27017.
2. **Live Redis Server**: Cache service tests verified fallback and key construction without requiring a local running Redis daemon (`REDIS_ENABLED=false`).
3. **Live Razorpay Gateway API**: Payment verification tested signature validation algorithmically without initiating real financial debit transactions.
4. **Remote GitHub Actions Runners**: Workflows were authored and validated locally; remote execution will occur upon git push to the upstream repository.

---

## 7. Open Questions

- User decision on proposed remediation for `Backend/controllers/authController.js:91-115` (disallowing client-supplied raw `schoolId` during unauthenticated registration without document resolution).

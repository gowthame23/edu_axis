# edu_axis Session Log

## 2026-11-20 — Quality Audit, Cross-Tenant Security Fixes, Multi-Tenant Testing & CI

- **Legacy EJS Removal:** Verified no application imports or references exist to `legacy_ejs_version`. Backed up all 119 files to `C:\Users\gowth\OneDrive\Desktop\GOWTHAM\backups\edu_axis_legacy_ejs_version` outside the repository, removed the directory, and cleaned `.gitignore`.
- **Cross-Tenant Vulnerability Fixes:**
  - `enrollmentController.js`: Added tenant-scoping to `enrollCourse` preventing students from enrolling in other schools' courses. Fixed `updateEnrollment` and `dropCourse` to enforce `schoolId`.
  - `feedbackController.js`: Scoped `reviewFeedback` to `schoolId` preventing cross-school review tampering.
  - `quizController.js`: Scoped `getQuiz`, `checkQuizPrerequisite`, `startQuizAttempt`, `submitQuizAttempt`, and `getQuizResults` to `schoolId` and student ownership.
  - `adminController.js`: Ensured custom `error.statusCode` (403/404) are preserved and returned in catch blocks.
  - `studentController.js`: Guarded optional WebSocket socket emission.
- **Test Suites Authored:**
  - `Backend/tests/auth.test.js`: 19 tests for registration, authentication, tokens, cookies, authMiddleware, roleMiddleware.
  - `Backend/tests/tenantIsolation.test.js`: 15 tests verifying complete data isolation between schools across users, courses, enrollments, feedback, quizzes, and tenant guards.
  - `Backend/tests/feePayments.test.js`: 15 tests verifying fee CRUD isolation, deletion guards, payment recording isolation, student fee retrieval, late fee calculation, and receipt access control.
  - Total backend tests: 59 passed (100%). Total frontend tests: 9 passed (100%).
- **CI Workflow:** Authored `.github/workflows/ci.yml` running install, lint, test, and production build for both backend and frontend. Added `lint` and `test` scripts in `package.json`.
- **Architecture Documentation:** Added a Multi-Tenant Data Isolation section with Mermaid diagram to `README.md`.
- **Reports:** Authored `edu_axis/REPORT.md`.

## 2026-11-21 — Verification, Route Guard Audit, and Real vs Mock Classification

- **Test Suite Verification:**
  - Executed backend tests once (`npm test` in `Backend`): 7 test files, 59 tests passed in 11.49s.
  - Executed frontend tests once (`npm test` in `frontend`): 2 test files, 9 tests passed in 8.27s.
  - Executed frontend production build (`npm run build` in `frontend`): `vite build` generated client distribution bundle cleanly in 4.30s.
  - Test counts verified: exactly 59 backend and 9 frontend tests, matching claimed totals.
- **Tenant Isolation Audit (`tenantIsolation.test.js`):**
  - Classified test coverage: all 6 models (`User`, `Course`, `Enrollment`, `Feedback`, `Quiz`, `QuizAttempt`) and `cacheService` are mocked; there is no live MongoDB connection. Real code executed and verified includes tenant guard middleware functions (`assertSameSchoolUser`, `assertSameSchoolStudent`, `assertSameSchoolCourse`) and controller query construction logic.
- **Route Guard Audit:**
  - Audited all routes accepting school/tenant identifiers. All internal student, teacher, and admin routes strictly derive `schoolId` from the authenticated JWT session via `req.schoolId` / `req.user.schoolId`.
  - Discovered cross-tenant vulnerability in `Backend/controllers/authController.js:91-115` (`register` accepts raw client-supplied `schoolId` without resolving/validating the school document if domain matching yields null). Documented under "Needs my decision" without changing code.
- **Legacy Codebase Check:** Confirmed `legacy_ejs_version` is completely deleted from disk and has zero imports in application code.
- **Reports:** Overwrote `edu_axis/REPORT.md` with honest audit details, route table, raw execution outputs, and "Needs my decision" item.

## 2026-11-21 — Security Hardening: Ignore Client-Supplied schoolId on Registration

- **Security Fix in `Backend/controllers/authController.js`:**
  - Hardened `register` controller to ignore client-supplied `req.body.schoolId` completely.
  - For non-superadmin roles, school is resolved strictly via `findSchoolForUser(email, schoolCode)`.
  - If no matching active school is found, returns HTTP 400 with `'Could not identify your school. Please provide a valid school code or use your school email domain.'`. If school is suspended/inactive, returns HTTP 403.
  - `finalSchoolId` is assigned strictly to `school._id`.
- **Frontend Form Verification:**
  - Audited all frontend components and forms under `frontend/src`. Confirmed that `Register.jsx` submits only `schoolCode` and never sends `schoolId`. No frontend registration form sends `schoolId`.
- **Automated Tests Authored:**
  - Added 4 new unit tests in `Backend/tests/auth.test.js`:
    1. Rejects registration with raw `schoolId` and no valid code/domain (400, no user created).
    2. Allows registration with valid `schoolCode` and assigns matching `schoolId`.
    3. Overrides attacker-supplied `schoolId` when valid `schoolCode` is provided (assigns code-resolved school, never supplied `schoolId`).
    4. Confirms public registration as `superadmin` remains blocked (403).
- **Checks Verified (one at a time):**
  - Backend Vitest: 7 passed, 63 passed (11.29s).
  - Frontend Vitest: 2 passed, 9 passed (7.69s).
  - Frontend Build: `vite build` completed cleanly (5.27s).
- **Documentation:** Updated route table and removed registration item from "Needs my decision" in `edu_axis/REPORT.md`.


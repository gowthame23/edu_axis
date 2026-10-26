import swaggerJSDoc from 'swagger-jsdoc';

const bearerAuth = [{ bearerAuth: [] }];

const commonErrorResponses = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
  500: { $ref: '#/components/responses/ServerError' }
};

const successResponse = (description = 'Successful response', schemaRef = '#/components/schemas/ApiEnvelope') => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: schemaRef }
    }
  }
});

const operation = ({
  summary,
  tag,
  secured = true,
  security,
  parameters,
  requestBody,
  successCode = 200,
  successDescription,
  successSchemaRef,
  extraResponses
}) => ({
  tags: [tag],
  summary,
  ...((security && security.length) ? { security } : (secured ? { security: bearerAuth } : {})),
  ...(parameters ? { parameters } : {}),
  ...(requestBody ? { requestBody } : {}),
  responses: {
    [successCode]: successResponse(successDescription, successSchemaRef),
    ...(secured ? commonErrorResponses : { 400: commonErrorResponses[400], 500: commonErrorResponses[500] }),
    ...(extraResponses || {})
  }
});

const jsonBody = (schema, required = true) => ({
  required,
  content: {
    'application/json': {
      schema
    }
  }
});

const multipartBody = (schema, required = true) => ({
  required,
  content: {
    'multipart/form-data': {
      schema
    }
  }
});

const idParam = (name, description = 'Unique identifier') => ({
  in: 'path',
  name,
  required: true,
  schema: { type: 'string' },
  description
});

const openApiDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'EduAxis API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for EduAxis school management backend.',
    contact: {
      name: 'EduAxis API Support'
    },
    license: {
      name: 'ISC'
    }
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Development server'
    },
    {
      url: 'https://eduaxis-backend.onrender.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'System', description: 'System and security utility endpoints' },
    { name: 'Auth', description: 'Authentication and account actions' },
    { name: 'Student', description: 'Student role endpoints and features' },
    { name: 'Teacher', description: 'Teacher role endpoints and features' },
    { name: 'Admin', description: 'School administrator endpoints' },
    { name: 'SuperAdmin', description: 'Platform super admin endpoints' },
    { name: 'Messages', description: 'Direct messaging endpoints' },
    { name: 'Enrollments', description: 'Enrollment management endpoints' },
    { name: 'Quiz', description: 'Quiz lifecycle and attempts' },
    { name: 'Feedback', description: 'Feedback and moderation endpoints' },
    { name: 'Analytics', description: 'Performance analytics endpoints' },
    { name: 'Search', description: 'Cross-entity search endpoints (Solr/Mongo fallback)' },
    { name: 'Integrations', description: 'B2C external service integrations consumed by EduAxis' },
    { name: 'B2B', description: 'Partner-facing APIs exposed for third-party systems' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key'
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Unauthorized: {
        description: 'Authentication required or token invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Forbidden: {
        description: 'Authenticated but not authorized for this action',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      NotFound: {
        description: 'Requested resource was not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    },
    schemas: {
      ApiEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Request processed successfully' },
          data: { type: 'object', additionalProperties: true }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          error: { type: 'string', example: 'Bad Request' },
          details: { type: 'object', additionalProperties: true }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', format: 'password', minLength: 6, example: 'StrongPass123' },
          role: { type: 'string', enum: ['student', 'teacher', 'admin', 'superadmin'], example: 'student' },
          schoolId: { type: 'string', example: '65db6a1c2e1f4f0012ab3c45' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'StrongPass123' }
        }
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password', minLength: 6 }
        }
      },
      CreateUserRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Jane Smith' },
          email: { type: 'string', format: 'email', example: 'jane@school.com' },
          password: { type: 'string', format: 'password', minLength: 6, example: 'SecurePass123' },
          role: { type: 'string', enum: ['student', 'teacher'], example: 'student' },
          phone: { type: 'string', example: '+1234567890' },
          dateOfBirth: { type: 'string', format: 'date', example: '2005-03-15' },
          grade: { type: 'string', example: '10' },
          section: { type: 'string', example: 'A' }
        }
      },
      CreateCourseRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Mathematics' },
          code: { type: 'string', example: 'MATH-101' },
          description: { type: 'string', example: 'Introduction to Mathematics' },
          teacher: { type: 'string', example: 'Dr. Smith' },
          teacherId: { type: 'string', example: '65db6a1c2e1f4f0012ab3c45' },
          credits: { type: 'number', example: 3 },
          grade: { type: 'string', example: '10' },
          semester: { type: 'string', example: 'Fall' }
        }
      },
      CreateFeeRequest: {
        type: 'object',
        required: ['title', 'amount', 'dueDate'],
        properties: {
          title: { type: 'string', example: 'Tuition Fee' },
          amount: { type: 'number', example: 5000 },
          dueDate: { type: 'string', format: 'date-time', example: '2025-12-31' },
          description: { type: 'string', example: 'Annual tuition fee for academic year 2025-2026' },
          academicYear: { type: 'string', example: '2025-2026' },
          semester: { type: 'string', example: 'Fall' },
          appliesTo: { type: 'string', enum: ['all', 'grade-specific'], example: 'all' },
          grades: { type: 'array', items: { type: 'string' }, example: ['10', '11'] }
        }
      },
      CreatePaymentRequest: {
        type: 'object',
        required: ['studentId', 'feeId', 'amount', 'paymentMethod'],
        properties: {
          studentId: { type: 'string', example: '65db6a1c2e1f4f0012ab3c45' },
          feeId: { type: 'string', example: '65db6a1c2e1f4f0012ab3c46' },
          amount: { type: 'number', example: 5000 },
          paymentMethod: { type: 'string', example: 'credit_card' },
          transactionId: { type: 'string', example: 'TXN123456789' },
          remarks: { type: 'string', example: 'Payment for tuition fee' }
        }
      },
      TeacherMarkAttendanceRequest: {
        type: 'object',
        required: ['studentId', 'courseId', 'status'],
        properties: {
          studentId: { type: 'string', example: '65db6a1c2e1f4f0012ab3c45' },
          courseId: { type: 'string', example: '65db6a1c2e1f4f0012ab3c46' },
          status: { type: 'string', enum: ['present', 'absent', 'late', 'excused'], example: 'present' },
          date: { type: 'string', format: 'date', example: '2026-04-07' },
          remarks: { type: 'string', example: 'Arrived late due to transport issue' }
        }
      },
      SendFeeRemindersRequest: {
        type: 'object',
        properties: {
          grade: { type: 'string', example: '10' },
          section: { type: 'string', example: 'A' },
          feeId: { type: 'string', example: '65db6a1c2e1f4f0012ab3c46' }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['student', 'teacher', 'admin', 'superadmin'] },
          school: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/api/health': {
      get: operation({ summary: 'Health check', tag: 'System', secured: false })
    },
    '/api/csrf-token': {
      get: operation({ summary: 'Get CSRF token', tag: 'System', secured: false })
    },

    '/api/auth/register': {
      post: operation({
        summary: 'Register new user',
        tag: 'Auth',
        secured: false,
        requestBody: jsonBody({ $ref: '#/components/schemas/RegisterRequest' }),
        successCode: 201
      })
    },
    '/api/auth/login': {
      post: operation({
        summary: 'Login user',
        tag: 'Auth',
        secured: false,
        requestBody: jsonBody({ $ref: '#/components/schemas/LoginRequest' })
      })
    },
    '/api/auth/logout': {
      post: operation({ summary: 'Logout current user', tag: 'Auth', secured: false })
    },
    '/api/auth/me': {
      get: operation({ summary: 'Get current user profile', tag: 'Auth' })
    },
    '/api/auth/change-password': {
      post: operation({
        summary: 'Change user password',
        tag: 'Auth',
        requestBody: jsonBody({ $ref: '#/components/schemas/ChangePasswordRequest' })
      })
    },

    '/api/student/dashboard': { get: operation({ summary: 'Get student dashboard', tag: 'Student' }) },
    '/api/student/courses': { get: operation({ summary: 'Get student courses', tag: 'Student' }) },
    '/api/student/courses/{id}': {
      get: operation({ summary: 'Get course details', tag: 'Student', parameters: [idParam('id', 'Course id')] })
    },
    '/api/student/grades': { get: operation({ summary: 'Get grades', tag: 'Student' }) },
    '/api/student/attendance': { get: operation({ summary: 'Get attendance', tag: 'Student' }) },
    '/api/student/assignments': { get: operation({ summary: 'Get assignments', tag: 'Student' }) },
    '/api/student/assignments/submit': {
      post: operation({
        summary: 'Submit assignment with optional attachments',
        tag: 'Student',
        requestBody: multipartBody({
          type: 'object',
          required: ['assignmentId'],
          properties: {
            assignmentId: { type: 'string' },
            notes: { type: 'string' },
            files: {
              type: 'array',
              items: { type: 'string', format: 'binary' }
            }
          }
        })
      })
    },
    '/api/student/assignments/{assignmentId}/submission': {
      get: operation({ summary: 'Get current submission details', tag: 'Student', parameters: [idParam('assignmentId')] })
    },
    '/api/student/timetable': { get: operation({ summary: 'Get timetable', tag: 'Student' }) },
    '/api/student/schedule': { get: operation({ summary: 'Get weekly schedule', tag: 'Student' }) },
    '/api/student/announcements': {
      get: operation({ summary: 'Get announcements', tag: 'Student' }),
      delete: operation({ summary: 'Clear all announcements', tag: 'Student' })
    },
    '/api/student/announcements/{id}/read': {
      patch: operation({ summary: 'Mark announcement as read', tag: 'Student', parameters: [idParam('id', 'Announcement id')] })
    },
    '/api/student/announcements/{id}': {
      delete: operation({ summary: 'Hide single announcement', tag: 'Student', parameters: [idParam('id', 'Announcement id')] })
    },
    '/api/student/fees': { get: operation({ summary: 'Get fee records', tag: 'Student' }) },
    '/api/student/payment': {
      post: operation({
        summary: 'Create payment request',
        tag: 'Student',
        requestBody: jsonBody({
          type: 'object',
          required: ['feeId', 'amount'],
          properties: {
            feeId: { type: 'string' },
            amount: { type: 'number', example: 2500 },
            method: { type: 'string', example: 'card' }
          }
        })
      })
    },
    '/api/student/payment/razorpay/order': {
      post: operation({
        summary: 'Create Razorpay order for student fee payment',
        tag: 'Student',
        requestBody: jsonBody({
          type: 'object',
          required: ['feeId', 'amount'],
          properties: {
            feeId: { type: 'string' },
            amount: { type: 'number', example: 2500 },
            paymentMethod: { type: 'string', example: 'Online Payment' },
            remarks: { type: 'string' }
          }
        })
      })
    },
    '/api/student/payment/razorpay/verify': {
      post: operation({
        summary: 'Verify Razorpay payment for student fee',
        tag: 'Student',
        requestBody: jsonBody({
          type: 'object',
          required: ['paymentId', 'razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature'],
          properties: {
            paymentId: { type: 'string' },
            razorpayOrderId: { type: 'string' },
            razorpayPaymentId: { type: 'string' },
            razorpaySignature: { type: 'string' }
          }
        })
      })
    },
    '/api/student/receipt/{paymentId}': {
      get: operation({ summary: 'Download payment receipt', tag: 'Student', parameters: [idParam('paymentId')] })
    },
    '/api/student/library': { get: operation({ summary: 'Get library resources', tag: 'Student' }) },
    '/api/student/leave-requests': {
      post: operation({
        summary: 'Create leave request',
        tag: 'Student',
        requestBody: jsonBody({
          type: 'object',
          required: ['startDate', 'endDate', 'reason'],
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            reason: { type: 'string' }
          }
        })
      }),
      get: operation({ summary: 'List own leave requests', tag: 'Student' })
    },
    '/api/student/teachers': { get: operation({ summary: 'Get teachers list for messaging', tag: 'Student' }) },
    '/api/student/study-materials': { get: operation({ summary: 'Get study materials', tag: 'Student' }) },
    '/api/student/analytics/performance/{studentId}': {
      get: operation({ summary: 'Get student performance analytics', tag: 'Student', parameters: [idParam('studentId')] })
    },
    '/api/student/analytics/trend/{studentId}': {
      get: operation({ summary: 'Get student performance trend', tag: 'Student', parameters: [idParam('studentId')] })
    },
    '/api/student/analytics/breakdown/{studentId}': {
      get: operation({ summary: 'Get grade breakdown', tag: 'Student', parameters: [idParam('studentId')] })
    },

    '/api/teacher/dashboard': { get: operation({ summary: 'Get teacher dashboard', tag: 'Teacher' }) },
    '/api/teacher/courses': { get: operation({ summary: 'Get teacher courses', tag: 'Teacher' }) },
    '/api/teacher/students': { get: operation({ summary: 'Get assigned students', tag: 'Teacher' }) },
    '/api/teacher/attendance': {
      post: operation({
        summary: 'Mark attendance',
        tag: 'Teacher',
        requestBody: jsonBody({ $ref: '#/components/schemas/TeacherMarkAttendanceRequest' })
      }),
      get: operation({
        summary: 'Get attendance for course',
        tag: 'Teacher',
        parameters: [
          { in: 'query', name: 'courseId', required: true, schema: { type: 'string' }, description: 'Course identifier' },
          { in: 'query', name: 'date', required: false, schema: { type: 'string', format: 'date' }, description: 'Attendance date' }
        ]
      })
    },
    '/api/teacher/grades': {
      post: operation({
        summary: 'Submit grades',
        tag: 'Teacher',
        requestBody: jsonBody({
          type: 'object',
          required: ['courseId', 'grades'],
          properties: {
            courseId: { type: 'string' },
            grades: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  studentId: { type: 'string' },
                  score: { type: 'number' },
                  remarks: { type: 'string' }
                }
              }
            }
          }
        })
      })
    },
    '/api/teacher/assignments': {
      get: operation({ summary: 'Get assignments', tag: 'Teacher' }),
      post: operation({
        summary: 'Create assignment with attachments',
        tag: 'Teacher',
        requestBody: multipartBody({
          type: 'object',
          required: ['courseId', 'title', 'dueDate'],
          properties: {
            courseId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            attachments: {
              type: 'array',
              items: { type: 'string', format: 'binary' }
            }
          }
        })
      })
    },
    '/api/teacher/assignments/{assignmentId}/submissions': {
      get: operation({ summary: 'Get assignment submissions', tag: 'Teacher', parameters: [idParam('assignmentId')] })
    },
    '/api/teacher/announcements': {
      get: operation({ summary: 'Get teacher announcements', tag: 'Teacher' }),
      post: operation({
        summary: 'Create announcement',
        tag: 'Teacher',
        requestBody: jsonBody({
          type: 'object',
          required: ['title', 'message'],
          properties: {
            title: { type: 'string' },
            message: { type: 'string' },
            courseId: { type: 'string' }
          }
        })
      })
    },
    '/api/teacher/announcements/{id}': {
      delete: operation({ summary: 'Delete announcement', tag: 'Teacher', parameters: [idParam('id')] })
    },
    '/api/teacher/library': {
      get: operation({ summary: 'Get teacher library resources', tag: 'Teacher' }),
      post: operation({
        summary: 'Create library resource',
        tag: 'Teacher',
        requestBody: multipartBody({
          type: 'object',
          required: ['title', 'file'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            file: { type: 'string', format: 'binary' }
          }
        })
      })
    },
    '/api/teacher/timetable': { get: operation({ summary: 'Get teacher timetable', tag: 'Teacher' }) },
    '/api/teacher/schedule': {
      get: operation({ summary: 'Get teacher schedule', tag: 'Teacher' }),
      post: operation({
        summary: 'Create schedule entry',
        tag: 'Teacher',
        requestBody: jsonBody({
          type: 'object',
          required: ['dayOfWeek', 'startTime', 'endTime', 'subject'],
          properties: {
            dayOfWeek: { type: 'string' },
            startTime: { type: 'string', example: '09:00' },
            endTime: { type: 'string', example: '10:00' },
            subject: { type: 'string' }
          }
        })
      })
    },
    '/api/teacher/schedule/{id}': {
      delete: operation({ summary: 'Delete schedule entry', tag: 'Teacher', parameters: [idParam('id')] })
    },
    '/api/teacher/leave-requests': {
      post: operation({
        summary: 'Apply for leave',
        tag: 'Teacher',
        requestBody: jsonBody({
          type: 'object',
          required: ['startDate', 'endDate', 'reason'],
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            reason: { type: 'string' }
          }
        })
      }),
      get: operation({ summary: 'Get leave requests', tag: 'Teacher' })
    },
    '/api/teacher/study-materials': {
      post: operation({
        summary: 'Upload study material',
        tag: 'Teacher',
        requestBody: multipartBody({
          type: 'object',
          required: ['title', 'file'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            file: { type: 'string', format: 'binary' }
          }
        })
      }),
      get: operation({ summary: 'Get uploaded study materials', tag: 'Teacher' })
    },
    '/api/teacher/study-materials/{id}': {
      delete: operation({ summary: 'Delete study material', tag: 'Teacher', parameters: [idParam('id')] })
    },

    '/api/administrator/dashboard': { get: operation({ summary: 'Get admin dashboard', tag: 'Admin' }) },
    '/api/administrator/stats': { get: operation({ summary: 'Get admin stats', tag: 'Admin' }) },
    '/api/administrator/users': {
      get: operation({ summary: 'List users', tag: 'Admin' }),
      post: operation({ summary: 'Create user', tag: 'Admin', requestBody: jsonBody({ $ref: '#/components/schemas/CreateUserRequest' }), successCode: 201 })
    },
    '/api/administrator/users/{id}': {
      put: operation({ summary: 'Update user', tag: 'Admin', parameters: [idParam('id')], requestBody: jsonBody({ type: 'object', additionalProperties: true }) }),
      delete: operation({ summary: 'Delete user', tag: 'Admin', parameters: [idParam('id')] })
    },
    '/api/administrator/courses': {
      get: operation({ summary: 'List courses', tag: 'Admin' }),
      post: operation({ summary: 'Create course', tag: 'Admin', requestBody: jsonBody({ $ref: '#/components/schemas/CreateCourseRequest' }), successCode: 201 })
    },
    '/api/administrator/courses/{id}': {
      put: operation({ summary: 'Update course', tag: 'Admin', parameters: [idParam('id')], requestBody: jsonBody({ type: 'object', additionalProperties: true }) }),
      delete: operation({ summary: 'Delete course', tag: 'Admin', parameters: [idParam('id')] })
    },
    '/api/administrator/teachers/{teacherId}/subjects': {
      get: operation({ summary: 'Get teacher subjects', tag: 'Admin', parameters: [idParam('teacherId')] })
    },
    '/api/administrator/classes': { get: operation({ summary: 'Get classes', tag: 'Admin' }) },
    '/api/administrator/reports': { get: operation({ summary: 'Get reports', tag: 'Admin' }) },
    '/api/administrator/library': {
      get: operation({ summary: 'List library resources', tag: 'Admin' }),
      post: operation({
        summary: 'Create library resource',
        tag: 'Admin',
        requestBody: multipartBody({
          type: 'object',
          required: ['title', 'file'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            file: { type: 'string', format: 'binary' }
          }
        })
      })
    },
    '/api/administrator/library/{id}': {
      delete: operation({ summary: 'Delete library resource', tag: 'Admin', parameters: [idParam('id')] })
    },
    '/api/administrator/timetables': {
      get: operation({ summary: 'List timetables', tag: 'Admin' }),
      post: operation({
        summary: 'Create or update timetable file',
        tag: 'Admin',
        requestBody: multipartBody({
          type: 'object',
          required: ['file'],
          properties: {
            className: { type: 'string' },
            section: { type: 'string' },
            file: { type: 'string', format: 'binary' }
          }
        })
      })
    },
    '/api/administrator/timetables/{id}': {
      patch: operation({ summary: 'Update timetable metadata', tag: 'Admin', parameters: [idParam('id')], requestBody: jsonBody({ type: 'object', additionalProperties: true }) }),
      delete: operation({ summary: 'Delete timetable', tag: 'Admin', parameters: [idParam('id')] })
    },
    '/api/administrator/fees': {
      get: operation({ summary: 'Get fee records', tag: 'Admin' }),
      post: operation({ summary: 'Create fee record', tag: 'Admin', requestBody: jsonBody({ $ref: '#/components/schemas/CreateFeeRequest' }), successCode: 201 })
    },
    '/api/administrator/fees/{id}': {
      put: operation({ summary: 'Update fee record', tag: 'Admin', parameters: [idParam('id')], requestBody: jsonBody({ type: 'object', additionalProperties: true }) }),
      delete: operation({ summary: 'Delete fee record', tag: 'Admin', parameters: [idParam('id')] })
    },
    '/api/administrator/payments': {
      get: operation({ summary: 'Get payments', tag: 'Admin' }),
      post: operation({ summary: 'Create payment', tag: 'Admin', requestBody: jsonBody({ $ref: '#/components/schemas/CreatePaymentRequest' }), successCode: 201 })
    },
    '/api/administrator/payments/stats': { get: operation({ summary: 'Get payment stats', tag: 'Admin' }) },
    '/api/administrator/payments/trends': { get: operation({ summary: 'Get payment trends', tag: 'Admin' }) },
    '/api/administrator/payments/export': { get: operation({ summary: 'Export payments', tag: 'Admin' }) },
    '/api/administrator/fees/reminders': {
      post: operation({ summary: 'Send fee reminders', tag: 'Admin', requestBody: jsonBody({ $ref: '#/components/schemas/SendFeeRemindersRequest' }, false) })
    },
    '/api/administrator/class/overview': { get: operation({ summary: 'Class overview analytics', tag: 'Admin' }) },
    '/api/administrator/class/students': { get: operation({ summary: 'Class student analytics', tag: 'Admin' }) },
    '/api/administrator/class/at-risk': { get: operation({ summary: 'At-risk students in class', tag: 'Admin' }) },
    '/api/administrator/class/students/{id}': {
      get: operation({ summary: 'Get student details', tag: 'Admin', parameters: [idParam('id')] })
    },
    '/api/administrator/leave-requests': { get: operation({ summary: 'List leave requests', tag: 'Admin' }) },
    '/api/administrator/leave-requests/{id}': {
      patch: operation({
        summary: 'Approve or reject leave request',
        tag: 'Admin',
        parameters: [idParam('id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['approved', 'rejected'] },
            remarks: { type: 'string' }
          }
        })
      })
    },
    '/api/administrator/bulk-import': {
      post: operation({
        summary: 'Bulk import CSV',
        tag: 'Admin',
        requestBody: multipartBody({
          type: 'object',
          required: ['file', 'entityType'],
          properties: {
            entityType: { type: 'string', enum: ['students', 'teachers', 'courses'] },
            file: { type: 'string', format: 'binary' }
          }
        })
      })
    },
    '/api/administrator/subscription/plans': { get: operation({ summary: 'Get available plans', tag: 'Admin' }) },
    '/api/administrator/subscription/current': { get: operation({ summary: 'Get current subscription', tag: 'Admin' }) },
    '/api/administrator/subscription/razorpay/order': {
      post: operation({
        summary: 'Create Razorpay order for subscription payment',
        tag: 'Admin',
        requestBody: jsonBody({
          type: 'object',
          required: ['newPlan'],
          properties: {
            newPlan: { type: 'string', enum: ['basic', 'premium', 'enterprise'] },
            billingCycle: { type: 'string', enum: ['monthly', 'annual'] },
            paymentMethod: { type: 'string', example: 'credit_card' }
          }
        })
      })
    },
    '/api/administrator/subscription/razorpay/verify': {
      post: operation({
        summary: 'Verify Razorpay subscription payment and activate plan',
        tag: 'Admin',
        requestBody: jsonBody({
          type: 'object',
          required: ['paymentId', 'razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature', 'newPlan'],
          properties: {
            paymentId: { type: 'string' },
            razorpayOrderId: { type: 'string' },
            razorpayPaymentId: { type: 'string' },
            razorpaySignature: { type: 'string' },
            newPlan: { type: 'string', enum: ['basic', 'premium', 'enterprise'] },
            billingCycle: { type: 'string', enum: ['monthly', 'annual'] }
          }
        })
      })
    },
    '/api/administrator/subscription/upgrade': {
      post: operation({
        summary: 'Upgrade subscription',
        tag: 'Admin',
        requestBody: jsonBody({
          type: 'object',
          required: ['planId'],
          properties: {
            planId: { type: 'string' },
            billingCycle: { type: 'string', enum: ['monthly', 'yearly'] }
          }
        })
      })
    },

    '/api/superadmin/dashboard': { get: operation({ summary: 'Get super admin dashboard', tag: 'SuperAdmin' }) },
    '/api/superadmin/statistics': { get: operation({ summary: 'Get platform statistics', tag: 'SuperAdmin' }) },
    '/api/superadmin/settings/pricing-plans': {
      get: operation({ summary: 'Get pricing plan settings', tag: 'SuperAdmin' })
    },
    '/api/superadmin/settings/pricing-plans/publish': {
      post: operation({
        summary: 'Publish pricing plan settings',
        tag: 'SuperAdmin',
        requestBody: jsonBody({
          type: 'object',
          required: ['plans'],
          properties: {
            plans: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  features: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        })
      })
    },
    '/api/superadmin/analytics/subscriptions': {
      get: operation({ summary: 'Get subscription analytics', tag: 'SuperAdmin' })
    },
    '/api/superadmin/analytics/revenue-trends': {
      get: operation({ summary: 'Get revenue trends', tag: 'SuperAdmin' })
    },
    '/api/superadmin/analytics/subscriptions-list': {
      get: operation({ summary: 'Get subscriptions list', tag: 'SuperAdmin' })
    },
    '/api/superadmin/schools': {
      get: operation({ summary: 'List schools', tag: 'SuperAdmin' }),
      post: operation({ summary: 'Create school', tag: 'SuperAdmin', requestBody: jsonBody({ type: 'object', additionalProperties: true }) })
    },
    '/api/superadmin/schools/{id}': {
      get: operation({ summary: 'Get school by id', tag: 'SuperAdmin', parameters: [idParam('id')] }),
      put: operation({ summary: 'Update school', tag: 'SuperAdmin', parameters: [idParam('id')], requestBody: jsonBody({ type: 'object', additionalProperties: true }) }),
      delete: operation({ summary: 'Delete school', tag: 'SuperAdmin', parameters: [idParam('id')] })
    },
    '/api/superadmin/schools/{id}/status': {
      patch: operation({ summary: 'Update school status', tag: 'SuperAdmin', parameters: [idParam('id')], requestBody: jsonBody({ type: 'object', additionalProperties: true }) })
    },
    '/api/superadmin/schools/{id}/subscription': {
      patch: operation({ summary: 'Update school subscription', tag: 'SuperAdmin', parameters: [idParam('id')], requestBody: jsonBody({ type: 'object', additionalProperties: true }) })
    },

    '/api/messages/conversations': {
      get: operation({ summary: 'Get all conversations', tag: 'Messages' })
    },
    '/api/messages': {
      post: operation({
        summary: 'Send message',
        tag: 'Messages',
        requestBody: jsonBody({
          type: 'object',
          required: ['recipientId', 'text'],
          properties: {
            recipientId: { type: 'string' },
            text: { type: 'string' }
          }
        })
      })
    },
    '/api/messages/read': {
      post: operation({
        summary: 'Mark conversation as read',
        tag: 'Messages',
        requestBody: jsonBody({
          type: 'object',
          required: ['otherUserId'],
          properties: { otherUserId: { type: 'string' } }
        })
      })
    },
    '/api/messages/{messageId}': {
      delete: operation({ summary: 'Delete message', tag: 'Messages', parameters: [idParam('messageId')] })
    },
    '/api/messages/conversation/{otherUserId}': {
      delete: operation({ summary: 'Delete conversation', tag: 'Messages', parameters: [idParam('otherUserId')] })
    },
    '/api/messages/{userId}': {
      get: operation({ summary: 'Get conversation with user', tag: 'Messages', parameters: [idParam('userId')] })
    },

    '/api/enrollments/student/{studentId}': {
      get: operation({ summary: 'Get student enrollments', tag: 'Enrollments', parameters: [idParam('studentId')] })
    },
    '/api/enrollments/available/{studentId}': {
      get: operation({ summary: 'Get available courses for student', tag: 'Enrollments', parameters: [idParam('studentId')] })
    },
    '/api/enrollments/enroll': {
      post: operation({
        summary: 'Enroll student to course',
        tag: 'Enrollments',
        requestBody: jsonBody({
          type: 'object',
          required: ['studentId', 'courseId'],
          properties: {
            studentId: { type: 'string' },
            courseId: { type: 'string' }
          }
        })
      })
    },
    '/api/enrollments/stats/{courseId}': {
      get: operation({ summary: 'Get course enrollment stats', tag: 'Enrollments', parameters: [idParam('courseId')] })
    },
    '/api/enrollments/{enrollmentId}': {
      put: operation({
        summary: 'Update enrollment',
        tag: 'Enrollments',
        parameters: [idParam('enrollmentId')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true })
      })
    },
    '/api/enrollments/drop/{enrollmentId}': {
      delete: operation({ summary: 'Drop enrollment', tag: 'Enrollments', parameters: [idParam('enrollmentId')] })
    },

    '/api/quiz': {
      post: operation({
        summary: 'Create quiz (teacher/admin)',
        tag: 'Quiz',
        requestBody: jsonBody({ type: 'object', additionalProperties: true })
      })
    },
    '/api/quiz/{quizId}': {
      get: operation({ summary: 'Get quiz details', tag: 'Quiz', parameters: [idParam('quizId')] })
    },
    '/api/quiz/check/{quizId}/{studentId}': {
      get: operation({ summary: 'Check quiz prerequisite', tag: 'Quiz', parameters: [idParam('quizId'), idParam('studentId')] })
    },
    '/api/quiz/attempt/start': {
      post: operation({
        summary: 'Start quiz attempt',
        tag: 'Quiz',
        requestBody: jsonBody({
          type: 'object',
          required: ['quizId', 'studentId'],
          properties: {
            quizId: { type: 'string' },
            studentId: { type: 'string' }
          }
        })
      })
    },
    '/api/quiz/attempt/submit': {
      post: operation({
        summary: 'Submit quiz attempt',
        tag: 'Quiz',
        requestBody: jsonBody({
          type: 'object',
          required: ['attemptId', 'answers'],
          properties: {
            attemptId: { type: 'string' },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string' },
                  answer: { type: 'string' }
                }
              }
            }
          }
        })
      })
    },
    '/api/quiz/results/{attemptId}': {
      get: operation({ summary: 'Get quiz results', tag: 'Quiz', parameters: [idParam('attemptId')] })
    },
    '/api/quiz/attempts/{studentId}/{courseId}': {
      get: operation({ summary: 'Get student quiz attempts', tag: 'Quiz', parameters: [idParam('studentId'), idParam('courseId')] })
    },

    '/api/feedback': {
      post: operation({
        summary: 'Submit course feedback',
        tag: 'Feedback',
        requestBody: jsonBody({
          type: 'object',
          required: ['type', 'courseId', 'rating'],
          properties: {
            studentId: { type: 'string', description: 'Optional when anonymous feedback is true' },
            type: { type: 'string', enum: ['course'], example: 'course' },
            courseId: { type: 'string' },
            rating: {
              type: 'object',
              required: ['overall'],
              properties: {
                overall: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                contentQuality: { type: 'integer', minimum: 0, maximum: 5, example: 4 },
                teacherPerformance: { type: 'integer', minimum: 0, maximum: 5, example: 5 },
                materialRelevance: { type: 'integer', minimum: 0, maximum: 5, example: 4 },
                difficulty: { type: 'integer', minimum: 0, maximum: 5, example: 3 }
              }
            },
            comments: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            areasForImprovement: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'string' },
            isAnonymous: { type: 'boolean', example: true }
          }
        })
      })
    },
    '/api/feedback/student/{studentId}': {
      get: operation({ summary: 'Get student feedback', tag: 'Feedback', parameters: [idParam('studentId')] })
    },
    '/api/feedback/course/{courseId}': {
      get: operation({ summary: 'Get course feedback', tag: 'Feedback', parameters: [idParam('courseId')] })
    },
    '/api/feedback/module/{moduleId}': {
      get: operation({ summary: 'Get module feedback', tag: 'Feedback', parameters: [idParam('moduleId')] })
    },
    '/api/feedback/dashboard': {
      get: operation({ summary: 'Get feedback dashboard (admin)', tag: 'Feedback' })
    },
    '/api/feedback/{feedbackId}/review': {
      put: operation({
        summary: 'Review feedback (admin)',
        tag: 'Feedback',
        parameters: [idParam('feedbackId')],
        requestBody: jsonBody({
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['reviewed', 'flagged', 'resolved'] },
            notes: { type: 'string' }
          }
        })
      })
    },

    '/api/analytics/student/{studentId}/{courseId}': {
      get: operation({ summary: 'Get student performance by course', tag: 'Analytics', parameters: [idParam('studentId'), idParam('courseId')] })
    },
    '/api/analytics/student/{studentId}': {
      get: operation({ summary: 'Get student performance', tag: 'Analytics', parameters: [idParam('studentId')] })
    },
    '/api/analytics/update/{studentId}/{courseId}': {
      post: operation({ summary: 'Update student performance', tag: 'Analytics', parameters: [idParam('studentId'), idParam('courseId')] })
    },
    '/api/analytics/at-risk/{courseId}': {
      get: operation({ summary: 'Get at-risk students', tag: 'Analytics', parameters: [idParam('courseId')] })
    },
    '/api/analytics/class-report/{courseId}': {
      get: operation({ summary: 'Get class performance report', tag: 'Analytics', parameters: [idParam('courseId')] })
    },
    '/api/analytics/trend/{studentId}/{courseId}': {
      get: operation({ summary: 'Get trend by course', tag: 'Analytics', parameters: [idParam('studentId'), idParam('courseId')] })
    },
    '/api/analytics/trend/{studentId}': {
      get: operation({ summary: 'Get overall trend', tag: 'Analytics', parameters: [idParam('studentId')] })
    },

    '/api/search': {
      get: operation({
        summary: 'Global search across users, courses and library',
        tag: 'Search',
        parameters: [
          { in: 'query', name: 'q', required: true, schema: { type: 'string' }, description: 'Search term (min 2 characters)' },
          { in: 'query', name: 'type', required: false, schema: { type: 'string', enum: ['all', 'users', 'courses', 'library'] }, description: 'Optional entity filter' },
          { in: 'query', name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 50 }, description: 'Max results to return' },
          { in: 'query', name: 'schoolId', required: false, schema: { type: 'string' }, description: 'Required for superadmin search context' }
        ]
      })
    },

    '/api/search/reindex': {
      post: operation({
        summary: 'Reindex school search data into Solr (admin/superadmin)',
        tag: 'Search',
        parameters: [
          { in: 'query', name: 'schoolId', required: false, schema: { type: 'string' }, description: 'Required when caller is superadmin' }
        ]
      })
    },

    '/api/integrations/public-holidays': {
      get: operation({
        summary: 'Get public holidays from external provider (B2C)',
        tag: 'Integrations',
        parameters: [
          { in: 'query', name: 'countryCode', required: false, schema: { type: 'string', example: 'IN' }, description: 'ISO country code' },
          { in: 'query', name: 'year', required: false, schema: { type: 'integer', example: 2026 }, description: 'Calendar year' }
        ]
      })
    },

    '/api/integrations/exchange-rates': {
      get: operation({
        summary: 'Get exchange rates from external provider (B2C)',
        tag: 'Integrations',
        parameters: [
          { in: 'query', name: 'base', required: false, schema: { type: 'string', example: 'INR' }, description: 'Base currency code' },
          { in: 'query', name: 'target', required: false, schema: { type: 'string', example: 'USD' }, description: 'Target currency code' }
        ]
      })
    },

    '/api/b2b/v1/schools/{schoolCode}/summary': {
      get: operation({
        summary: 'Get school summary for partner integrations (B2B)',
        tag: 'B2B',
        secured: false,
        security: [{ apiKeyAuth: [] }],
        parameters: [idParam('schoolCode', 'School code, or Mongo id if you already have it')],
        extraResponses: {
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      })
    },

    '/api/b2b/v1/integrations/public-holidays': {
      get: operation({
        summary: 'Get public holidays feed for partner integrations (B2B)',
        tag: 'B2B',
        secured: false,
        security: [{ apiKeyAuth: [] }],
        parameters: [
          { in: 'query', name: 'countryCode', required: false, schema: { type: 'string', example: 'IN' } },
          { in: 'query', name: 'year', required: false, schema: { type: 'integer', example: 2026 } }
        ],
        extraResponses: {
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      })
    }
  }
};

const options = {
  definition: openApiDefinition,
  apis: []
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;

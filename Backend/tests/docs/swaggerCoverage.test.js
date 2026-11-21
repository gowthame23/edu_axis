import { describe, expect, it } from 'vitest';

import swaggerSpec from '../../docs/swagger.js';
import authRoutes from '../../routes/authRoutes.js';
import studentRoutes from '../../routes/studentRoutes.js';
import teacherRoutes from '../../routes/teacherRoutes.js';
import adminRoutes from '../../routes/adminRoutes.js';
import messageRoutes from '../../routes/messageRoutes.js';
import superAdminRoutes from '../../routes/superAdminRoutes.js';
import enrollmentRoutes from '../../routes/enrollmentRoutes.js';
import quizRoutes from '../../routes/quizRoutes.js';
import feedbackRoutes from '../../routes/feedbackRoutes.js';
import analyticsRoutes from '../../routes/analyticsRoutes.js';
import searchRoutes from '../../routes/searchRoutes.js';
import webServiceRoutes from '../../routes/webServiceRoutes.js';

const ROUTER_MOUNTS = [
  { basePath: '/api/auth', router: authRoutes },
  { basePath: '/api/student', router: studentRoutes },
  { basePath: '/api/teacher', router: teacherRoutes },
  { basePath: '/api/administrator', router: adminRoutes },
  { basePath: '/api/messages', router: messageRoutes },
  { basePath: '/api/superadmin', router: superAdminRoutes },
  { basePath: '/api/enrollments', router: enrollmentRoutes },
  { basePath: '/api/quiz', router: quizRoutes },
  { basePath: '/api/feedback', router: feedbackRoutes },
  { basePath: '/api/analytics', router: analyticsRoutes },
  { basePath: '/api/search', router: searchRoutes },
  { basePath: '/api', router: webServiceRoutes }
];

const toOpenApiPath = (expressPath) =>
  String(expressPath).replace(/:([A-Za-z0-9_]+)/g, '{$1}');

const normalizePath = (pathValue) => {
  const raw = String(pathValue || '');
  return raw.endsWith('/') && raw.length > 1 ? raw.slice(0, -1) : raw;
};

const collectRouterEndpoints = () => {
  const endpoints = new Set();

  for (const { basePath, router } of ROUTER_MOUNTS) {
    for (const layer of router.stack || []) {
      const route = layer.route;
      if (!route || !route.path) continue;

      const methodNames = Object.keys(route.methods || {})
        .filter((method) => route.methods[method])
        .map((method) => method.toUpperCase());

      const routePaths = Array.isArray(route.path) ? route.path : [route.path];

      for (const routePath of routePaths) {
        const fullPath = normalizePath(`${basePath}${toOpenApiPath(routePath)}`);
        for (const method of methodNames) {
          endpoints.add(`${method} ${fullPath}`);
        }
      }
    }
  }

  // Endpoints mounted directly in server.js (not part of route modules)
  endpoints.add('GET /api/health');
  endpoints.add('GET /api/csrf-token');

  return endpoints;
};

const collectSwaggerEndpoints = () => {
  const endpoints = new Set();

  for (const [pathKey, methods] of Object.entries(swaggerSpec.paths || {})) {
    const normalizedPath = normalizePath(pathKey);
    for (const method of Object.keys(methods || {})) {
      endpoints.add(`${method.toUpperCase()} ${normalizedPath}`);
    }
  }

  return endpoints;
};

describe('Swagger coverage', () => {
  it('documents every implemented API route and contains no stale routes', () => {
    const implemented = collectRouterEndpoints();
    const documented = collectSwaggerEndpoints();

    const missingInSwagger = [...implemented].filter((ep) => !documented.has(ep)).sort();
    const staleInSwagger = [...documented].filter((ep) => !implemented.has(ep)).sort();

    expect(missingInSwagger, `Missing in Swagger:\n${missingInSwagger.join('\n')}`).toEqual([]);
    expect(staleInSwagger, `Stale in Swagger:\n${staleInSwagger.join('\n')}`).toEqual([]);
  });
});

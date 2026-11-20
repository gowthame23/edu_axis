import { describe, expect, it, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { register, login, logout } from '../controllers/authController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import School from '../models/School.js';

vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    exists: vi.fn()
  }
}));

vi.mock('../models/School.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn()
  }
}));

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.cookies = {};
  res.clearedCookies = [];
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((data) => {
    res.body = data;
    return res;
  });
  res.cookie = vi.fn((name, val, opts) => {
    res.cookies[name] = { val, opts };
    return res;
  });
  res.clearCookie = vi.fn((name, opts) => {
    res.clearedCookies.push({ name, opts });
    return res;
  });
  return res;
};

describe('Authentication Controller & Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key-12345';
  });

  describe('User Registration', () => {
    it('rejects registration with missing required fields', async () => {
      const req = { body: { name: 'Alice' } };
      const res = createRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    it('rejects registration with short password (< 6 chars)', async () => {
      const req = { body: { name: 'Alice', email: 'alice@test.edu', password: '123' } };
      const res = createRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 6 characters');
    });

    it('rejects registration if user already exists', async () => {
      User.findOne = vi.fn().mockResolvedValue({ _id: 'existing-id', email: 'alice@test.edu' });
      const req = { body: { name: 'Alice', email: 'alice@test.edu', password: 'password123' } };
      const res = createRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('already exists');
    });

    it('blocks public registration of admin or superadmin roles', async () => {
      User.findOne = vi.fn().mockResolvedValue(null);
      const req = { body: { name: 'Admin', email: 'admin@test.edu', password: 'password123', role: 'admin' } };
      const res = createRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.message).toContain('cannot be created through public registration');
    });

    it('rejects registration if school cannot be determined', async () => {
      User.findOne = vi.fn().mockResolvedValue(null);
      School.findOne = vi.fn().mockResolvedValue(null);

      const req = { body: { name: 'Student', email: 'student@unknown.com', password: 'password123', role: 'student', grade: '10' } };
      const res = createRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('Could not identify your school');
    });

    it('rejects registration if school is inactive', async () => {
      User.findOne = vi.fn().mockResolvedValue(null);
      School.findOne = vi.fn().mockResolvedValue({ _id: 'sch-1', status: 'suspended', code: 'SCH1' });

      const req = { body: { name: 'Student', email: 'student@sch1.edu', password: 'password123', role: 'student', schoolCode: 'SCH1', grade: '10' } };
      const res = createRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.message).toContain('suspended');
    });

    it('successfully registers student and sets auth cookie', async () => {
      User.findOne = vi.fn().mockResolvedValue(null);
      School.findOne = vi.fn().mockResolvedValue({ _id: 'sch-1', status: 'active', code: 'SCH1' });
      
      const fakeUser = {
        _id: 'user-1',
        name: 'Student One',
        email: 'student@sch1.edu',
        role: 'student',
        schoolId: 'sch-1',
        grade: '10',
        generateAuthToken: vi.fn().mockReturnValue('mocked-jwt-token'),
        toJSON: vi.fn().mockReturnValue({ _id: 'user-1', name: 'Student One', email: 'student@sch1.edu', role: 'student' })
      };
      User.create = vi.fn().mockResolvedValue(fakeUser);

      const req = {
        body: { name: 'Student One', email: 'student@sch1.edu', password: 'password123', role: 'student', grade: '10', schoolCode: 'SCH1' },
        headers: {}
      };
      const res = createRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('mocked-jwt-token');
      expect(res.cookie).toHaveBeenCalledWith('authToken', 'mocked-jwt-token', expect.any(Object));
    });
  });

  describe('User Login & Logout', () => {
    it('rejects login with missing email or password', async () => {
      const req = { body: { email: '' } };
      const res = createRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('Email and password are required');
    });

    it('rejects login when user does not exist', async () => {
      User.findOne = vi.fn().mockResolvedValue(null);
      const req = { body: { email: 'nonexistent@test.com', password: 'password123' } };
      const res = createRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('rejects login with incorrect password', async () => {
      const mockUser = {
        _id: 'u-1',
        email: 'user@school.com',
        role: 'student',
        schoolId: 'sch-1',
        comparePassword: vi.fn().mockResolvedValue(false)
      };
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      School.findById = vi.fn().mockResolvedValue({ _id: 'sch-1', status: 'active' });

      const req = { body: { email: 'user@school.com', password: 'wrongpassword' } };
      const res = createRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('rejects login for inactive user account', async () => {
      const mockUser = {
        _id: 'u-1',
        email: 'user@school.com',
        role: 'student',
        schoolId: 'sch-1',
        status: 'deactivated',
        comparePassword: vi.fn().mockResolvedValue(true)
      };
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      School.findById = vi.fn().mockResolvedValue({ _id: 'sch-1', status: 'active' });

      const req = { body: { email: 'user@school.com', password: 'correctpassword' } };
      const res = createRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.message).toContain('deactivated');
    });

    it('rejects login when school code is mismatched', async () => {
      const mockUser = {
        _id: 'u-1',
        email: 'user@school.com',
        role: 'student',
        schoolId: 'sch-1',
        comparePassword: vi.fn().mockResolvedValue(true)
      };
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      School.findOne = vi.fn().mockResolvedValue(null); // mismatched code

      const req = { body: { email: 'user@school.com', password: 'correctpassword', schoolCode: 'WRONG' } };
      const res = createRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.message).toContain('Invalid school code');
    });

    it('successfully logs in, returns token, and sets cookie', async () => {
      const mockUser = {
        _id: 'u-1',
        email: 'user@school.com',
        role: 'student',
        schoolId: 'sch-1',
        status: 'active',
        comparePassword: vi.fn().mockResolvedValue(true),
        generateAuthToken: vi.fn().mockReturnValue('valid-jwt-token'),
        toJSON: vi.fn().mockReturnValue({ _id: 'u-1', email: 'user@school.com', role: 'student' })
      };
      User.findOne = vi.fn().mockResolvedValue(mockUser);
      School.findById = vi.fn().mockResolvedValue({ _id: 'sch-1', status: 'active' });

      const req = { body: { email: 'user@school.com', password: 'correctpassword' }, headers: {} };
      const res = createRes();

      await login(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('valid-jwt-token');
      expect(res.cookie).toHaveBeenCalledWith('authToken', 'valid-jwt-token', expect.any(Object));
    });

    it('clears cookie on logout', async () => {
      const req = { headers: {} };
      const res = createRes();

      await logout(req, res);

      expect(res.body.success).toBe(true);
      expect(res.clearCookie).toHaveBeenCalledWith('authToken', expect.any(Object));
    });
  });

  describe('Authentication & Role Middleware', () => {
    it('authMiddleware rejects request when token is missing', async () => {
      const req = { cookies: {}, headers: {} };
      const res = createRes();
      const next = vi.fn();

      authMiddleware(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('No authentication token'),
        statusCode: 401
      }));
    });

    it('authMiddleware rejects request when user is not found', async () => {
      const token = jwt.sign({ _id: 'user-999' }, process.env.JWT_SECRET);
      const req = { cookies: { authToken: token }, headers: {} };
      const res = createRes();
      const next = vi.fn();

      User.findById = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });

      authMiddleware(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('User not found'),
        statusCode: 401
      }));
    });

    it('authMiddleware attaches user and schoolId to req when valid', async () => {
      const token = jwt.sign({ _id: 'user-1' }, process.env.JWT_SECRET);
      const req = { cookies: { authToken: token }, headers: {} };
      const res = createRes();
      const next = vi.fn();

      const mockUser = { _id: 'user-1', role: 'admin', schoolId: 'sch-1', status: 'active' };
      User.findById = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      });
      School.findById = vi.fn().mockResolvedValue({ _id: 'sch-1', status: 'active' });

      authMiddleware(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(req.user).toEqual(mockUser);
      expect(req.schoolId).toBe('sch-1');
      expect(req.school.status).toBe('active');
      expect(next).toHaveBeenCalledWith();
    });

    it('roleMiddleware allows authorized roles', () => {
      const req = { user: { role: 'admin' } };
      const res = createRes();
      const next = vi.fn();

      roleMiddleware('admin', 'superadmin')(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('roleMiddleware rejects unauthorized roles with 403', () => {
      const req = { user: { role: 'student' } };
      const res = createRes();
      const next = vi.fn();

      roleMiddleware('admin')(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });
});

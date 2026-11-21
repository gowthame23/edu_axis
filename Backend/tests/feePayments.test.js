import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getFees as adminGetFees,
  createFee as adminCreateFee,
  updateFee as adminUpdateFee,
  deleteFee as adminDeleteFee,
  getPayments as adminGetPayments,
  createPayment as adminCreatePayment
} from '../controllers/adminController.js';
import {
  getFees as studentGetFees,
  makePayment as studentMakePayment,
  downloadReceipt as studentDownloadReceipt
} from '../controllers/studentController.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

vi.mock('../models/Fee.js');
vi.mock('../models/Payment.js');
vi.mock('../models/User.js');
vi.mock('../services/cacheService.js', () => ({
  delCacheByPattern: vi.fn().mockResolvedValue(true),
  getOrSetCache: vi.fn((key, fn) => fn().then(payload => ({ payload, cacheHit: false }))),
  cacheKey: vi.fn((prefix, parts) => `${prefix}:${parts.join(':')}`)
}));

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((data) => {
    res.body = data;
    return res;
  });
  res.setHeader = vi.fn((key, val) => {
    res.headers[key] = val;
    return res;
  });
  return res;
};

describe('Fee Management & Payment Processing', () => {
  const SCHOOL_A = '65000000000000000000000a';
  const SCHOOL_B = '65000000000000000000000b';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Fee Configuration', () => {
    it('creates a fee isolated to the admin school', async () => {
      const createdFee = {
        _id: 'fee-1',
        schoolId: SCHOOL_A,
        title: 'Tuition Term 1',
        amount: 5000,
        dueDate: new Date('2026-12-01')
      };
      Fee.create = vi.fn().mockResolvedValue(createdFee);

      const req = {
        schoolId: SCHOOL_A,
        body: {
          title: 'Tuition Term 1',
          amount: 5000,
          dueDate: '2026-12-01',
          appliesTo: 'all'
        }
      };
      const res = createRes();

      await adminCreateFee(req, res);

      expect(Fee.create).toHaveBeenCalledWith(expect.objectContaining({
        schoolId: SCHOOL_A,
        title: 'Tuition Term 1',
        amount: 5000
      }));
      expect(res.body.success).toBe(true);
      expect(res.body.fee).toEqual(createdFee);
    });

    it('rejects fee creation when required fields are missing', async () => {
      const req = { schoolId: SCHOOL_A, body: { title: 'Fee Without Amount' } };
      const res = createRes();

      await adminCreateFee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('required');
    });

    it('lists only fees belonging to the current school', async () => {
      const mockFees = [{ _id: 'fee-1', schoolId: SCHOOL_A, title: 'Term 1' }];
      Fee.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockFees)
      });

      const req = { schoolId: SCHOOL_A };
      const res = createRes();

      await adminGetFees(req, res);

      expect(Fee.find).toHaveBeenCalledWith({ schoolId: SCHOOL_A });
      expect(res.body.fees).toEqual(mockFees);
    });

    it('blocks updating a fee belonging to a different school', async () => {
      Fee.findOneAndUpdate = vi.fn().mockResolvedValue(null);

      const req = {
        params: { id: 'fee-b' },
        schoolId: SCHOOL_A,
        body: { amount: 6000 }
      };
      const res = createRes();

      await adminUpdateFee(req, res);

      expect(Fee.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'fee-b', schoolId: SCHOOL_A },
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toBe('Fee not found');
    });

    it('prevents fee deletion if students have completed payments for it', async () => {
      Fee.findOne = vi.fn().mockResolvedValue({ _id: 'fee-1', schoolId: SCHOOL_A });
      Payment.countDocuments = vi.fn().mockResolvedValue(3); // 3 completed payments

      const req = { params: { id: 'fee-1' }, schoolId: SCHOOL_A };
      const res = createRes();

      await adminDeleteFee(req, res);

      expect(Payment.countDocuments).toHaveBeenCalledWith({
        schoolId: SCHOOL_A,
        feeId: 'fee-1',
        status: 'completed'
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('Cannot delete fee. 3 student(s) have already paid');
    });

    it('successfully deletes a fee when no completed payments exist', async () => {
      Fee.findOne = vi.fn().mockResolvedValue({ _id: 'fee-1', schoolId: SCHOOL_A });
      Payment.countDocuments = vi.fn().mockResolvedValue(0);
      Fee.findOneAndDelete = vi.fn().mockResolvedValue({ _id: 'fee-1' });
      Payment.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 1 });

      const req = { params: { id: 'fee-1' }, schoolId: SCHOOL_A };
      const res = createRes();

      await adminDeleteFee(req, res);

      expect(Fee.findOneAndDelete).toHaveBeenCalledWith({ _id: 'fee-1', schoolId: SCHOOL_A });
      expect(res.body.success).toBe(true);
    });
  });

  describe('Admin Manual Payment Entry & Tenant Boundaries', () => {
    it('blocks recording payment if student belongs to another school', async () => {
      User.findOne = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      User.exists = vi.fn().mockResolvedValue(true); // Exists in other school

      const req = {
        schoolId: SCHOOL_A,
        body: {
          studentId: 'student-b',
          feeId: 'fee-1',
          amount: 5000,
          paymentMethod: 'Cash'
        }
      };
      const res = createRes();

      await adminCreatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.message).toContain('Student is not in your school');
    });

    it('blocks recording payment if fee belongs to another school', async () => {
      User.findOne = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ _id: 'student-a', schoolId: SCHOOL_A, name: 'Student A', email: 's@a.edu' })
      });
      Fee.findOne = vi.fn().mockResolvedValue(null); // Fee not in SCHOOL_A

      const req = {
        schoolId: SCHOOL_A,
        body: {
          studentId: 'student-a',
          feeId: 'fee-b',
          amount: 5000,
          paymentMethod: 'Bank Transfer'
        }
      };
      const res = createRes();

      await adminCreatePayment(req, res);

      expect(Fee.findOne).toHaveBeenCalledWith({ _id: 'fee-b', schoolId: SCHOOL_A });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toBe('Fee not found');
    });

    it('records payment when student and fee belong to the same school', async () => {
      User.findOne = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ _id: 'student-a', schoolId: SCHOOL_A, name: 'Student A', email: 's@a.edu' })
      });
      Fee.findOne = vi.fn().mockResolvedValue({ _id: 'fee-1', schoolId: SCHOOL_A, title: 'Term Fee', amount: 5000 });
      Payment.create = vi.fn().mockResolvedValue({
        _id: 'pay-1',
        schoolId: SCHOOL_A,
        studentId: 'student-a',
        feeId: 'fee-1',
        amount: 5000,
        status: 'completed'
      });

      const req = {
        schoolId: SCHOOL_A,
        body: {
          studentId: 'student-a',
          feeId: 'fee-1',
          amount: 5000,
          paymentMethod: 'Cash',
          transactionId: 'TX123'
        }
      };
      const res = createRes();

      await adminCreatePayment(req, res);

      expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
        schoolId: SCHOOL_A,
        studentId: 'student-a',
        feeId: 'fee-1',
        amount: 5000
      }));
      expect(res.body.success).toBe(true);
    });

    it('scopes getPayments to schoolId', async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([])
      };
      Payment.find = vi.fn().mockReturnValue(mockQuery);

      const req = { schoolId: SCHOOL_A, query: {} };
      const res = createRes();

      await adminGetPayments(req, res);

      expect(Payment.find).toHaveBeenCalledWith(expect.objectContaining({ schoolId: SCHOOL_A }));
      expect(res.body.success).toBe(true);
    });
  });

  describe('Student Fee Payments & Receipts', () => {
    it('returns grade-relevant active fees for authenticated student', async () => {
      const activeFees = [
        { _id: 'fee-1', title: 'Grade 10 Lab Fee', amount: 1200, dueDate: new Date('2026-12-01'), appliesTo: 'grade-specific', grades: ['10'] }
      ];
      Fee.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(activeFees)
        })
      });
      Payment.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      const req = {
        schoolId: SCHOOL_A,
        user: { _id: 'student-10', grade: '10', name: 'Student Ten' }
      };
      const res = createRes();

      await studentGetFees(req, res);

      expect(Fee.find).toHaveBeenCalledWith(expect.objectContaining({
        schoolId: SCHOOL_A,
        status: 'active'
      }));
      expect(res.body.success).toBe(true);
    });

    it('rejects student payment if fee is from another school', async () => {
      Fee.findOne = vi.fn().mockResolvedValue(null);

      const req = {
        schoolId: SCHOOL_A,
        user: { _id: 'student-a', name: 'Student A', email: 's@a.edu' },
        body: { feeId: 'fee-b', amount: 3000, paymentMethod: 'Card' }
      };
      const res = createRes();

      await studentMakePayment(req, res);

      expect(Fee.findOne).toHaveBeenCalledWith({ _id: 'fee-b', schoolId: SCHOOL_A });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toBe('Fee not found');
    });

    it('rejects student payment if fee has already been paid', async () => {
      Fee.findOne = vi.fn().mockResolvedValue({ _id: 'fee-1', schoolId: SCHOOL_A, dueDate: new Date('2026-12-31') });
      Payment.findOne = vi.fn().mockResolvedValue({ _id: 'prev-payment', status: 'completed' });

      const req = {
        schoolId: SCHOOL_A,
        user: { _id: 'student-a', name: 'Student A', email: 's@a.edu' },
        body: { feeId: 'fee-1', amount: 3000, paymentMethod: 'Card' }
      };
      const res = createRes();

      await studentMakePayment(req, res);

      expect(Payment.findOne).toHaveBeenCalledWith({
        schoolId: SCHOOL_A,
        studentId: 'student-a',
        feeId: 'fee-1',
        status: 'completed'
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('already been paid');
    });

    it('successfully processes student payment and calculates late fees when overdue', async () => {
      const pastDueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days late
      Fee.findOne = vi.fn().mockResolvedValue({
        _id: 'fee-1',
        schoolId: SCHOOL_A,
        title: 'Overdue Term Fee',
        dueDate: pastDueDate
      });
      Payment.findOne = vi.fn().mockResolvedValue(null); // not paid yet
      Payment.create = vi.fn().mockResolvedValue({
        _id: 'pay-new',
        schoolId: SCHOOL_A,
        studentId: 'student-a',
        amount: 3050, // 3000 + 5 days * 10
        status: 'completed'
      });

      const req = {
        schoolId: SCHOOL_A,
        user: { _id: 'student-a', name: 'Student A', email: 's@a.edu' },
        body: { feeId: 'fee-1', amount: 3000, paymentMethod: 'NetBanking' }
      };
      const res = createRes();

      await studentMakePayment(req, res);

      expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
        schoolId: SCHOOL_A,
        studentId: 'student-a',
        amount: 3050
      }));
      expect(res.body.success).toBe(true);
    });

    it('blocks student from downloading receipt belonging to another student or school', async () => {
      Payment.findOne = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve(null))
      });

      const req = {
        params: { paymentId: 'payment-foreign' },
        schoolId: SCHOOL_A,
        user: { _id: 'student-a' }
      };
      const res = createRes();

      await studentDownloadReceipt(req, res);

      expect(Payment.findOne).toHaveBeenCalledWith({
        _id: 'payment-foreign',
        schoolId: SCHOOL_A,
        studentId: 'student-a'
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toBe('Payment not found');
    });
  });
});

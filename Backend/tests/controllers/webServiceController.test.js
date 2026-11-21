import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../models/Course.js', () => ({
  default: {
    countDocuments: vi.fn()
  }
}));

vi.mock('../../models/School.js', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn()
  }
}));

vi.mock('../../models/User.js', () => ({
  default: {
    countDocuments: vi.fn()
  }
}));

const createRes = () => {
  const res = {};
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

const loadController = async () => {
  return import('../../controllers/webServiceController.js');
};

describe('webServiceController', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('falls back to built-in holidays when the upstream provider returns an empty body', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      text: async () => ''
    });

    const { getPublicHolidaysB2B } = await loadController();
    const req = {
      query: { countryCode: 'IN', year: '2026' },
      b2bClient: { keyHash: 'eduaxi' }
    };
    const res = createRes();

    await getPublicHolidaysB2B(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('fallback');
    expect(res.body.integration).toBe('eduaxis-static-holidays');
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.items[0].date.startsWith('2026')).toBe(true);
  });

  it('returns the school summary when called with a school code', async () => {
    const Course = (await import('../../models/Course.js')).default;
    const School = (await import('../../models/School.js')).default;
    const User = (await import('../../models/User.js')).default;

    const schoolRecord = {
      _id: '65db6a1c2e1f4f0012ab3c45',
      name: 'Alpha School',
      code: 'ACRD',
      status: 'active',
      subscription: { plan: 'premium' },
      createdAt: '2024-01-01T00:00:00.000Z',
      stats: {
        totalStudents: 120,
        totalTeachers: 14,
        totalAdmins: 3
      }
    };
    School.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(schoolRecord)
      })
    });
    User.countDocuments
      .mockResolvedValueOnce(95)
      .mockResolvedValueOnce(11);
    Course.countDocuments.mockResolvedValue(8);

    const { getSchoolSummaryB2B } = await loadController();
    const req = {
      params: { schoolCode: 'ACRD' },
      b2bClient: { keyHash: 'eduaxi' }
    };
    const res = createRes();

    await getSchoolSummaryB2B(req, res);

    expect(School.findOne).toHaveBeenCalledWith({ code: 'ACRD' });
    expect(User.countDocuments).toHaveBeenCalledTimes(2);
    expect(Course.countDocuments).toHaveBeenCalledWith({ schoolId: '65db6a1c2e1f4f0012ab3c45', status: 'active' });
    expect(res.body.success).toBe(true);
    expect(res.body.school.id).toBe('65db6a1c2e1f4f0012ab3c45');
    expect(res.body.school.code).toBe('ACRD');
    expect(res.body.school.stats.activeStudents).toBe(95);
    expect(res.body.school.stats.activeTeachers).toBe(11);
    expect(res.body.school.stats.activeCourses).toBe(8);
  });
});
import Course from '../models/Course.js';
import School from '../models/School.js';
import User from '../models/User.js';

const DEFAULT_HOLIDAY_API_BASE = 'https://date.nager.at/api/v3/PublicHolidays';
const DEFAULT_EXCHANGE_API_BASE = 'https://api.frankfurter.app/latest';

const FALLBACK_HOLIDAYS = {
  IN: [
    { date: '2026-01-26', localName: 'Republic Day', name: 'Republic Day', countryCode: 'IN', fixed: true, global: true },
    { date: '2026-08-15', localName: 'Independence Day', name: 'Independence Day', countryCode: 'IN', fixed: true, global: true },
    { date: '2026-10-02', localName: 'Gandhi Jayanti', name: 'Gandhi Jayanti', countryCode: 'IN', fixed: true, global: true },
    { date: '2026-11-12', localName: 'Diwali', name: 'Diwali', countryCode: 'IN', fixed: false, global: true }
  ],
  US: [
    { date: '2026-07-04', localName: 'Independence Day', name: 'Independence Day', countryCode: 'US', fixed: true, global: true },
    { date: '2026-11-26', localName: 'Thanksgiving Day', name: 'Thanksgiving Day', countryCode: 'US', fixed: false, global: true },
    { date: '2026-12-25', localName: 'Christmas Day', name: 'Christmas Day', countryCode: 'US', fixed: true, global: true }
  ]
};

const fetchWithTimeout = async (url, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}${bodyText ? `: ${bodyText.slice(0, 180)}` : ''}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!bodyText.trim()) {
      throw new Error('Empty response body from external service');
    }

    if (!contentType.includes('application/json')) {
      throw new Error(`Unexpected content type: ${contentType || 'unknown'}`);
    }

    try {
      return JSON.parse(bodyText);
    } catch (parseError) {
      throw new Error(`Invalid JSON from external service: ${parseError.message}`);
    }
  } finally {
    clearTimeout(timeout);
  }
};

const getFallbackHolidays = (countryCode) => {
  return FALLBACK_HOLIDAYS[countryCode] || FALLBACK_HOLIDAYS.IN;
};

const normalizeCountryCode = (countryCode) => {
  const candidate = String(countryCode || '').trim().toUpperCase();
  return candidate.length === 2 ? candidate : 'IN';
};

const normalizeYear = (yearValue) => {
  const parsed = Number(yearValue);
  const nowYear = new Date().getFullYear();
  if (Number.isNaN(parsed) || parsed < 2000 || parsed > nowYear + 2) {
    return nowYear;
  }

  return parsed;
};

const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || '').trim());

const resolveSchoolForB2B = async (schoolIdentifier) => {
  const candidate = String(schoolIdentifier || '').trim();

  if (!candidate) {
    return null;
  }

  if (isMongoObjectId(candidate)) {
    const schoolById = await School.findById(candidate).select('name code status stats subscription.plan createdAt').lean();
    if (schoolById) {
      return schoolById;
    }
  }

  return School.findOne({ code: candidate.toUpperCase() }).select('name code status stats subscription.plan createdAt').lean();
};

const buildHolidayEndpoint = (year, countryCode) => {
  const baseUrl = String(process.env.EXTERNAL_HOLIDAY_API_BASE || DEFAULT_HOLIDAY_API_BASE).replace(/\/$/, '');
  return `${baseUrl}/${year}/${countryCode}`;
};

const buildExchangeEndpoint = (baseCurrency, targetCurrency) => {
  const baseUrl = String(process.env.EXTERNAL_EXCHANGE_API_BASE || DEFAULT_EXCHANGE_API_BASE).replace(/\/$/, '');
  return `${baseUrl}?from=${baseCurrency}&to=${targetCurrency}`;
};

export const getPublicHolidaysB2C = async (req, res) => {
  try {
    const countryCode = normalizeCountryCode(req.query.countryCode || req.school?.address?.country || 'IN');
    const year = normalizeYear(req.query.year);
    const endpoint = buildHolidayEndpoint(year, countryCode);

    let holidays = [];
    let source = 'external';
    let integration = 'nager-public-holidays';

    try {
      holidays = await fetchWithTimeout(endpoint);
    } catch (error) {
      console.warn('B2C holidays external provider failed; using fallback data:', error.message);
      holidays = getFallbackHolidays(countryCode).map((holiday) => ({
        ...holiday,
        date: holiday.date.replace(/^\d{4}/, String(year))
      }));
      source = 'fallback';
      integration = 'eduaxis-static-holidays';
    }

    return res.json({
      success: true,
      source,
      integration,
      filters: { year, countryCode },
      total: holidays.length,
      items: holidays
    });
  } catch (error) {
    console.error('B2C holidays integration failed:', error.message);
    return res.status(502).json({
      success: false,
      message: 'External holiday service unavailable',
      error: error.message
    });
  }
};

export const getExchangeRatesB2C = async (req, res) => {
  try {
    const baseCurrency = String(req.query.base || 'INR').trim().toUpperCase();
    const targetCurrency = String(req.query.target || 'USD').trim().toUpperCase();
    const endpoint = buildExchangeEndpoint(baseCurrency, targetCurrency);

    const rates = await fetchWithTimeout(endpoint);

    return res.json({
      success: true,
      source: 'external',
      integration: 'frankfurter-exchange-rates',
      rates
    });
  } catch (error) {
    console.error('B2C exchange-rate integration failed:', error.message);
    return res.status(502).json({
      success: false,
      message: 'External exchange-rate service unavailable',
      error: error.message
    });
  }
};

export const getSchoolSummaryB2B = async (req, res) => {
  try {
    const { schoolCode } = req.params;

    const school = await resolveSchoolForB2B(schoolCode);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const schoolId = String(school._id);

    const [activeStudents, activeTeachers, activeCourses] = await Promise.all([
      User.countDocuments({ schoolId: school._id, role: 'student', status: 'active' }),
      User.countDocuments({ schoolId: school._id, role: 'teacher', status: 'active' }),
      Course.countDocuments({ schoolId: school._id, status: 'active' })
    ]);

    return res.json({
      success: true,
      b2b: true,
      client: req.b2bClient,
      school: {
        id: schoolId,
        name: school.name,
        code: school.code,
        status: school.status,
        subscriptionPlan: school.subscription?.plan,
        createdAt: school.createdAt,
        stats: {
          activeStudents,
          activeTeachers,
          activeCourses,
          registeredStudents: school.stats?.totalStudents || 0,
          registeredTeachers: school.stats?.totalTeachers || 0,
          registeredAdmins: school.stats?.totalAdmins || 0
        }
      }
    });
  } catch (error) {
    console.error('B2B school summary failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getPublicHolidaysB2B = async (req, res) => {
  try {
    const countryCode = normalizeCountryCode(req.query.countryCode || 'IN');
    const year = normalizeYear(req.query.year);
    const endpoint = buildHolidayEndpoint(year, countryCode);

    let holidays = [];
    let source = 'external';
    let integration = 'nager-public-holidays';

    try {
      holidays = await fetchWithTimeout(endpoint);
    } catch (error) {
      console.warn('B2B holidays external provider failed; using fallback data:', error.message);
      holidays = getFallbackHolidays(countryCode).map((holiday) => ({
        ...holiday,
        date: holiday.date.replace(/^\d{4}/, String(year))
      }));
      source = 'fallback';
      integration = 'eduaxis-static-holidays';
    }

    return res.json({
      success: true,
      b2b: true,
      source,
      integration,
      client: req.b2bClient,
      filters: { year, countryCode },
      total: holidays.length,
      items: holidays
    });
  } catch (error) {
    console.error('B2B holidays integration failed:', error.message);
    return res.status(502).json({
      success: false,
      message: 'External holiday service unavailable',
      error: error.message
    });
  }
};

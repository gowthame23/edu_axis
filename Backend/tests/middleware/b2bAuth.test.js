import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { b2bApiKeyAuth } from '../../middleware/b2bAuth.js';

const originalEnv = {
  B2B_API_KEY: process.env.B2B_API_KEY,
  B2B_API_KEYS: process.env.B2B_API_KEYS
};

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

describe('b2bApiKeyAuth', () => {
  beforeEach(() => {
    process.env.B2B_API_KEY = 'eduaxis-partner-dev-key';
    process.env.B2B_API_KEYS = 'backup-key, tertiary-key';
  });

  afterEach(() => {
    process.env.B2B_API_KEY = originalEnv.B2B_API_KEY;
    process.env.B2B_API_KEYS = originalEnv.B2B_API_KEYS;
  });

  it('returns 401 when the API key header is missing', () => {
    const req = { headers: {} };
    const res = createRes();
    const next = vi.fn();

    b2bApiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('x-api-key header');
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts x-api-key and attaches partner metadata', () => {
    const req = { headers: { 'x-api-key': 'eduaxis-partner-dev-key' } };
    const res = createRes();
    const next = vi.fn();

    b2bApiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.b2bClient).toEqual({ keyHash: 'eduaxi' });
  });

  it('accepts Authorization: ApiKey token', () => {
    const req = { headers: { authorization: 'ApiKey backup-key' } };
    const res = createRes();
    const next = vi.fn();

    b2bApiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.b2bClient.keyHash).toBe('backup');
  });

  it('rejects invalid API keys', () => {
    const req = { headers: { 'x-api-key': 'wrong-key' } };
    const res = createRes();
    const next = vi.fn();

    b2bApiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.message).toBe('Invalid API key');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 503 when no B2B keys are configured', () => {
    process.env.B2B_API_KEY = '';
    process.env.B2B_API_KEYS = '';

    const req = { headers: { 'x-api-key': 'anything' } };
    const res = createRes();
    const next = vi.fn();

    b2bApiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body.message).toContain('not configured');
    expect(next).not.toHaveBeenCalled();
  });
});
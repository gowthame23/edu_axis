import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cacheKey, getOrSetCache, isRedisReady } from '../../services/cacheService.js';

describe('cacheService', () => {
  const originalRedisEnabled = process.env.REDIS_ENABLED;

  beforeEach(() => {
    process.env.REDIS_ENABLED = 'false';
  });

  afterEach(() => {
    process.env.REDIS_ENABLED = originalRedisEnabled;
  });

  it('builds a stable cache key from path parts', () => {
    const key = cacheKey('student-dashboard', ['school:123', 'teacher-1', '', null, undefined, 42]);

    expect(key).toBe('student-dashboard:school_123:teacher-1:42');
  });

  it('returns a produced payload when Redis is disabled', async () => {
    const producer = vi.fn().mockResolvedValue({ total: 3, source: 'db' });

    const result = await getOrSetCache('student-dashboard:sample', producer, 60);

    expect(isRedisReady()).toBe(false);
    expect(producer).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      payload: { total: 3, source: 'db' },
      cacheHit: false
    });
  });
});
import { createClient } from 'redis';

const DEFAULT_TTL_SECONDS = 180;

let redisClient;
let redisReady = false;
let redisInitStarted = false;
let cacheErrorLogged = false;

const isRedisEnabled = () => process.env.REDIS_ENABLED !== 'false';

export const initRedis = async () => {
  if (!isRedisEnabled() || redisInitStarted) {
    return;
  }

  redisInitStarted = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[CACHE] REDIS_URL not set. Redis caching disabled.');
    return;
  }

  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (error) => {
      redisReady = false;
      console.error('[CACHE] Redis client error:', error.message);
    });
    redisClient.on('ready', () => {
      redisReady = true;
      console.log('[CACHE] Redis connected and ready');
    });

    await redisClient.connect();
  } catch (error) {
    redisReady = false;
    console.error('[CACHE] Failed to initialize Redis:', error.message);
  }
};

const handleCacheError = (error, operation) => {
  redisReady = false;
  if (!cacheErrorLogged) {
    console.error(`[CACHE] ${operation} failed; falling back to DB-only mode:`, error.message);
    cacheErrorLogged = true;
  }
};

const parseJSON = (payload) => {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

export const getCache = async (key) => {
  if (!redisReady || !redisClient) {
    return null;
  }

  try {
    const payload = await redisClient.get(key);
    if (!payload) {
      return null;
    }

    return parseJSON(payload);
  } catch (error) {
    handleCacheError(error, 'GET');
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  if (!redisReady || !redisClient) {
    return false;
  }

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    handleCacheError(error, 'SET');
    return false;
  }
};

export const delCacheByPattern = async (pattern) => {
  if (!redisReady || !redisClient) {
    return 0;
  }

  try {
    const matchedKeys = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      matchedKeys.push(key);
    }

    if (!matchedKeys.length) {
      return 0;
    }

    return redisClient.del(matchedKeys);
  } catch (error) {
    handleCacheError(error, 'DEL_PATTERN');
    return 0;
  }
};

export const getOrSetCache = async (key, producer, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  const hit = await getCache(key);
  if (hit) {
    return { payload: hit, cacheHit: true };
  }

  const freshPayload = await producer();
  await setCache(key, freshPayload, ttlSeconds);
  return { payload: freshPayload, cacheHit: false };
};

export const cacheKey = (prefix, parts = []) => {
  const normalized = parts
    .filter((part) => part !== undefined && part !== null && part !== '')
    .map((part) => String(part).replaceAll(':', '_'));

  return [prefix, ...normalized].join(':');
};

export const isRedisReady = () => redisReady;

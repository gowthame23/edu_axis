import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { cacheKey, getOrSetCache, initRedis, isRedisReady } from '../services/cacheService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nowIso = new Date().toISOString();

const benchmark = async (label, fn, rounds = 20) => {
  const timings = [];

  for (let i = 0; i < rounds; i += 1) {
    const startedAt = performance.now();
    await fn();
    timings.push(performance.now() - startedAt);
  }

  const total = timings.reduce((sum, entry) => sum + entry, 0);
  const average = total / timings.length;
  const sorted = [...timings].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95) - 1] || sorted[sorted.length - 1] || 0;

  return {
    label,
    rounds,
    averageMs: Number(average.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    minMs: Number(sorted[0].toFixed(2)),
    maxMs: Number(sorted[sorted.length - 1].toFixed(2))
  };
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await initRedis();
  const redisActive = isRedisReady();

  const sampleStudent = await User.findOne({ role: 'student' }).select('_id schoolId grade').lean();
  if (!sampleStudent?.schoolId) {
    throw new Error('No student found. Seed data before running perf report.');
  }

  const schoolId = sampleStudent.schoolId;

  const dbOnlyQuery = async () => {
    await Course.find({ schoolId, grade: Number(sampleStudent.grade), status: 'active' })
      .select('_id name code grade status')
      .limit(50)
      .lean();
  };

  const cachedQuery = async () => {
    const key = cacheKey('perf-report-courses', [schoolId, sampleStudent._id, sampleStudent.grade]);
    await getOrSetCache(
      key,
      async () => {
        const courses = await Course.find({ schoolId, grade: Number(sampleStudent.grade), status: 'active' })
          .select('_id name code grade status')
          .limit(50)
          .lean();

        return { coursesCount: courses.length };
      },
      60
    );
  };

  const dbOnly = await benchmark('db_only', dbOnlyQuery, 30);
  const withRedis = redisActive
    ? await benchmark('redis_cached', cachedQuery, 30)
    : {
        label: 'redis_cached',
        rounds: 0,
        averageMs: null,
        p95Ms: null,
        minMs: null,
        maxMs: null
      };

  const improvement = redisActive && dbOnly.averageMs > 0
    ? Number((((dbOnly.averageMs - withRedis.averageMs) / dbOnly.averageMs) * 100).toFixed(2))
    : null;

  const report = {
    generatedAt: nowIso,
    scope: 'Phase 1 - Database Optimization',
    sample: {
      schoolId: String(schoolId),
      studentId: String(sampleStudent._id)
    },
    redis: {
      enabled: process.env.REDIS_ENABLED !== 'false',
      ready: redisActive
    },
    metrics: {
      dbOnly,
      withRedis,
      averageLatencyImprovementPercent: improvement
    }
  };

  const reportDir = path.resolve(__dirname, '../logs');
  await fs.mkdir(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `phase1-perf-${Date.now()}.json`);
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

  console.log('Phase 1 performance report generated:');
  console.log(reportFile);
  console.log(JSON.stringify(report.metrics, null, 2));

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Failed to generate Phase 1 report:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors in failure flow
  }
  process.exit(1);
});

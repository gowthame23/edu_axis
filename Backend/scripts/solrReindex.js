import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { pingSolr } from '../services/solrSearchService.js';
import { reindexSolrForSchool } from '../controllers/searchController.js';

dotenv.config();

const getSchoolIdFromArgs = () => {
  const args = process.argv.slice(2);
  const schoolArg = args.find((arg) => arg.startsWith('--schoolId='));
  if (!schoolArg) {
    return null;
  }

  return schoolArg.split('=')[1]?.trim() || null;
};

const run = async () => {
  if (!process.env.SOLR_ENABLED || process.env.SOLR_ENABLED !== 'true') {
    throw new Error('SOLR_ENABLED must be true in .env before running Solr reindex');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const ping = await pingSolr();
  if (!ping.reachable) {
    throw new Error('Solr is not reachable. Check SOLR_HOST, SOLR_PORT, SOLR_CORE and SOLR_PROTOCOL');
  }

  let schoolId = getSchoolIdFromArgs();
  if (!schoolId) {
    const anyUser = await User.findOne({ schoolId: { $exists: true } }).select('schoolId').lean();
    schoolId = anyUser?.schoolId ? String(anyUser.schoolId) : null;
  }

  if (!schoolId) {
    throw new Error('Could not infer schoolId. Run with --schoolId=<id>');
  }

  const result = await reindexSolrForSchool(schoolId);
  console.log('Solr reindex successful');
  console.log(JSON.stringify(result, null, 2));

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Solr reindex failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});

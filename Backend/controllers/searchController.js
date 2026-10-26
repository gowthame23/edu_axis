import User from '../models/User.js';
import Course from '../models/Course.js';
import LibraryResource from '../models/LibraryResource.js';
import { cacheKey, getOrSetCache } from '../services/cacheService.js';
import { deleteSolrByQuery, indexSolrDocuments, pingSolr, searchWithSolr } from '../services/solrSearchService.js';

const SEARCH_CACHE_TTL = 120;

const normalizeLimit = (limit) => {
  const parsed = Number(limit);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 10;
  }

  return Math.min(parsed, 50);
};

const buildRegex = (query) => ({ $regex: query, $options: 'i' });

const buildSolrDoc = ({ id, schoolId, type, text, ...fields }) => ({
  id,
  schoolId: String(schoolId),
  type,
  text,
  ...fields
});

const getTargetSchoolId = (req) => {
  if (req.schoolId) {
    return req.schoolId;
  }

  if (req.user?.role === 'superadmin' && req.query.schoolId) {
    return req.query.schoolId;
  }

  return null;
};

export const buildSolrDocumentsForSchool = async (schoolId) => {
  const [users, courses, resources] = await Promise.all([
    User.find({ schoolId }).select('_id schoolId name email role subject grade status').lean(),
    Course.find({ schoolId }).select('_id schoolId name code description teacher grade semester status').lean(),
    LibraryResource.find({ schoolId, isActive: true }).select('_id schoolId title description author category tags grade isExternal').lean()
  ]);

  const userDocs = users.map((user) => buildSolrDoc({
    id: `user_${user._id}`,
    schoolId,
    type: 'users',
    text: `${user.name || ''} ${user.email || ''} ${user.subject || ''} ${user.role || ''}`.trim(),
    refId: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    subject: user.subject,
    grade: user.grade,
    status: user.status
  }));

  const courseDocs = courses.map((course) => buildSolrDoc({
    id: `course_${course._id}`,
    schoolId,
    type: 'courses',
    text: `${course.name || ''} ${course.code || ''} ${course.description || ''} ${course.teacher || ''}`.trim(),
    refId: String(course._id),
    name: course.name,
    code: course.code,
    description: course.description,
    teacher: course.teacher,
    grade: String(course.grade || ''),
    status: course.status
  }));

  const libraryDocs = resources.map((resource) => buildSolrDoc({
    id: `library_${resource._id}`,
    schoolId,
    type: 'library',
    text: `${resource.title || ''} ${resource.description || ''} ${resource.author || ''} ${(resource.tags || []).join(' ')}`.trim(),
    refId: String(resource._id),
    title: resource.title,
    description: resource.description,
    author: resource.author,
    category: resource.category,
    grade: resource.grade,
    tags: resource.tags || [],
    isExternal: Boolean(resource.isExternal)
  }));

  return [...userDocs, ...courseDocs, ...libraryDocs];
};

export const reindexSolrForSchool = async (schoolId) => {
  const documents = await buildSolrDocumentsForSchool(schoolId);
  await deleteSolrByQuery(`schoolId:${String(schoolId)}`);
  const result = await indexSolrDocuments(documents);

  return {
    schoolId: String(schoolId),
    indexed: result.indexed,
    users: documents.filter((doc) => doc.type === 'users').length,
    courses: documents.filter((doc) => doc.type === 'courses').length,
    library: documents.filter((doc) => doc.type === 'library').length
  };
};

const searchWithMongo = async ({ schoolId, query, type, limit }) => {
  if (type === 'users') {
    const users = await User.find({
      schoolId,
      $or: [{ name: buildRegex(query) }, { email: buildRegex(query) }, { subject: buildRegex(query) }]
    })
      .select('_id name email role subject grade status')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return users.map((user) => ({ ...user, type: 'users' }));
  }

  if (type === 'courses') {
    const courses = await Course.find({
      schoolId,
      $or: [{ name: buildRegex(query) }, { code: buildRegex(query) }, { description: buildRegex(query) }]
    })
      .select('_id name code description grade semester status teacher')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return courses.map((course) => ({ ...course, type: 'courses' }));
  }

  if (type === 'library') {
    const resources = await LibraryResource.find({
      schoolId,
      isActive: true,
      $or: [{ title: buildRegex(query) }, { description: buildRegex(query) }, { author: buildRegex(query) }]
    })
      .select('_id title description author category tags grade isExternal linkUrl file')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return resources.map((resource) => ({ ...resource, type: 'library' }));
  }

  const [users, courses, library] = await Promise.all([
    User.find({ schoolId, $text: { $search: query } })
      .select('_id name email role subject grade status')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean(),
    Course.find({ schoolId, $text: { $search: query } })
      .select('_id name code description grade semester status teacher')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean(),
    LibraryResource.find({ schoolId, isActive: true, $text: { $search: query } })
      .select('_id title description author category tags grade isExternal linkUrl file')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean()
  ]);

  return [
    ...users.map((entry) => ({ ...entry, type: 'users' })),
    ...courses.map((entry) => ({ ...entry, type: 'courses' })),
    ...library.map((entry) => ({ ...entry, type: 'library' }))
  ].slice(0, limit);
};

export const globalSearch = async (req, res) => {
  try {
    const schoolId = getTargetSchoolId(req);
    const query = String(req.query.q || '').trim();
    const type = String(req.query.type || 'all').trim().toLowerCase();
    const limit = normalizeLimit(req.query.limit);

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId context is required for search'
      });
    }

    const key = cacheKey('search', [schoolId, type, limit, query]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        try {
          const solrDocs = await searchWithSolr({ term: query, schoolId: String(schoolId), limit, type: type === 'all' ? undefined : type });
          if (solrDocs && solrDocs.length) {
            return {
              success: true,
              source: 'solr',
              type,
              total: solrDocs.length,
              items: solrDocs
            };
          }
        } catch (error) {
          console.warn('[SEARCH] Solr fallback to Mongo:', error.message);
        }

        const items = await searchWithMongo({ schoolId, query, type, limit });
        return {
          success: true,
          source: 'mongo',
          type,
          total: items.length,
          items
        };
      },
      SEARCH_CACHE_TTL
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    return res.json(payload);
  } catch (error) {
    console.error('Global search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const reindexSearch = async (req, res) => {
  try {
    const schoolId = getTargetSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId is required for reindex'
      });
    }

    const ping = await pingSolr();
    if (!ping.enabled) {
      return res.status(400).json({
        success: false,
        message: 'SOLR_ENABLED is false. Enable Solr in environment first.'
      });
    }

    if (!ping.reachable) {
      return res.status(502).json({
        success: false,
        message: 'Solr is not reachable'
      });
    }

    const result = await reindexSolrForSchool(schoolId);
    return res.json({
      success: true,
      message: 'Solr reindex completed',
      result
    });
  } catch (error) {
    console.error('Solr reindex error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reindex Solr data',
      error: error.message
    });
  }
};

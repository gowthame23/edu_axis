import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/auth.js';
import { globalSearch, reindexSearch } from '../controllers/searchController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', globalSearch);
router.post('/reindex', roleMiddleware('admin', 'superadmin'), reindexSearch);

export default router;

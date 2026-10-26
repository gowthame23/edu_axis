import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { b2bApiKeyAuth } from '../middleware/b2bAuth.js';
import {
  getExchangeRatesB2C,
  getPublicHolidaysB2B,
  getPublicHolidaysB2C,
  getSchoolSummaryB2B
} from '../controllers/webServiceController.js';

const router = express.Router();

// B2C integration endpoints: authenticated first-party clients (web/mobile app)
router.get('/integrations/public-holidays', authMiddleware, getPublicHolidaysB2C);
router.get('/integrations/exchange-rates', authMiddleware, getExchangeRatesB2C);

// B2B partner endpoints: API-key based access for third-party systems
router.get('/b2b/v1/schools/:schoolCode/summary', b2bApiKeyAuth, getSchoolSummaryB2B);
router.get('/b2b/v1/integrations/public-holidays', b2bApiKeyAuth, getPublicHolidaysB2B);

export default router;

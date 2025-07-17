import express from 'express';
import {
  getQualityMetrics,
  getInspectionStats
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Analytics endpoints
router.get('/', protect, getQualityMetrics);
router.get('/inspections', protect, getInspectionStats);

export default router;

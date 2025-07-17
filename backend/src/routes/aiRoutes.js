import express from 'express';
import {
  detectDefects,
  getAiStats,
  bulkAnalyzeImages,
  getAIData,
  getModelStatus,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMemory } from '../middleware/upload.js';

const router = express.Router();

// POST /api/ai/detect - upload single image & detect defects (protected)
router.post('/detect', protect, uploadMemory.single('image'), detectDefects);

// GET /api/ai/stats - get AI statistics (protected)
router.get('/stats', protect, getAiStats);

// POST /api/ai/bulk-analyze - upload multiple images for bulk defect detection (protected)
router.post('/bulk-analyze', protect, uploadMemory.array('images', 10), bulkAnalyzeImages);

// GET /api/ai/data - public route to get AI defect data (no auth)
router.get('/data', getAIData);

// GET /api/ai/model-status - check if AI model is loaded (public)
router.get('/model-status', getModelStatus);

export default router;

import express from 'express';
import {
    createDefect,
    getDefects,
    getDefect,
    updateDefect,
    deleteDefect,
    getDefectStats,
    resolveDefect,
    bulkCreateDefects
} from '../controllers/defectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router
    .route('/')
    .post(protect, upload.single('image'), createDefect)
    .get(protect, getDefects);

router.post('/bulk', protect, bulkCreateDefects);

router.get('/stats', protect, getDefectStats);

router
    .route('/:id')
    .get(protect, getDefect)
    .put(protect, upload.single('image'), updateDefect)
    .delete(protect, deleteDefect);

router.put('/:id/resolve', protect, resolveDefect);

export default router;